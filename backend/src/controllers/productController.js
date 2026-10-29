const Product = require('../models/Product');
const { recordMovement } = require('../services/inventoryService');
const { logAudit } = require('../services/auditService');
const { toCents, toDollars } = require('../utils/money');

// @desc Get all products with search & filter
// @route GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, lowStock } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;

    let products = await Product.find(query).populate('category', 'name code').sort({ name: 1 });

    if (lowStock === 'true') {
      products = products.filter((p) => p.currentStock <= p.minStockLevel);
    }

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// @desc Get single product
// @route GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name code');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc Create new product
// @route POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      description,
      baseUnit = 'PIECE',
      unitConversions = [],
      costPrice, // Decimal dollars or cents
      sellingPrice,
      currentStock = 0,
      minStockLevel = 10,
      allowNegativeStock = false,
      status = 'ACTIVE',
    } = req.body;

    const costPriceCents = toCents(costPrice);
    const sellingPriceCents = toCents(sellingPrice);

    // Format unitConversions
    const parsedConversions = unitConversions.map((uc) => ({
      unitName: uc.unitName.toUpperCase(),
      multiplier: Number(uc.multiplier),
      sellingPriceCents: uc.sellingPrice ? toCents(uc.sellingPrice) : Math.round(sellingPriceCents * Number(uc.multiplier)),
    }));

    const product = new Product({
      name,
      sku: sku || `SKU-${Date.now()}`,
      barcode: barcode || '',
      category,
      description,
      baseUnit: baseUnit.toUpperCase(),
      unitConversions: parsedConversions,
      costPriceCents,
      sellingPriceCents,
      currentStock: 0, // Set initially to 0, then record OPENING movement if initial stock > 0
      minStockLevel,
      allowNegativeStock,
      status,
    });

    await product.save();

    // If initial stock provided, record atomic movement
    if (Number(currentStock) > 0) {
      await recordMovement({
        productId: product._id,
        movementType: 'OPENING',
        quantityChange: Number(currentStock),
        unit: baseUnit,
        unitCostCents: costPriceCents,
        referenceType: 'InitialStock',
        reason: 'Initial Opening Stock Registration',
        userId: req.user._id,
      });
    }

    await logAudit({
      user: req.user,
      action: 'PRODUCT_CREATED',
      resourceType: 'Product',
      resourceId: product._id,
      description: `Product '${product.name}' created with SKU ${product.sku}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc Update product
// @route PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.costPrice !== undefined) updates.costPriceCents = toCents(updates.costPrice);
    if (updates.sellingPrice !== undefined) updates.sellingPriceCents = toCents(updates.sellingPrice);
    if (updates.unitConversions) {
      updates.unitConversions = updates.unitConversions.map((uc) => ({
        unitName: uc.unitName.toUpperCase(),
        multiplier: Number(uc.multiplier),
        sellingPriceCents: uc.sellingPrice ? toCents(uc.sellingPrice) : undefined,
      }));
    }

    // Do not allow direct silent modification of currentStock via updateProduct
    delete updates.currentStock;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logAudit({
      user: req.user,
      action: 'PRODUCT_UPDATED',
      resourceType: 'Product',
      resourceId: product._id,
      description: `Product '${product.name}' details updated`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc Manual Stock Adjustment (Audited)
// @route POST /api/products/:id/adjust-stock
const adjustStock = async (req, res, next) => {
  try {
    const { quantityChange, movementType = 'ADJUSTMENT', reason = '' } = req.body;

    if (!quantityChange || isNaN(quantityChange) || Number(quantityChange) === 0) {
      return res.status(400).json({ success: false, message: 'Valid non-zero quantity change required' });
    }

    const { product, movement } = await recordMovement({
      productId: req.params.id,
      movementType, // DAMAGE, LOSS, ADJUSTMENT, etc.
      quantityChange: Number(quantityChange),
      reason,
      userId: req.user._id,
    });

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTED',
      resourceType: 'Product',
      resourceId: product._id,
      description: `Stock for '${product.name}' adjusted by ${quantityChange}. Reason: ${reason}`,
      details: { movementType, quantityChange, stockBefore: movement.stockBefore, stockAfter: movement.stockAfter },
      reason,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { product, movement } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
};

