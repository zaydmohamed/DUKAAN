const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const Settings = require('../models/Settings');

/**
 * Resolves unit conversion multiplier for a product
 */
const getUnitConversion = (product, unitName) => {
  if (!unitName || unitName.toUpperCase() === product.baseUnit.toUpperCase()) {
    return 1;
  }
  const match = (product.unitConversions || []).find(
    (u) => u.unitName.toUpperCase() === unitName.toUpperCase()
  );
  if (!match) {
    throw new Error(`Unit '${unitName}' is not configured for product '${product.name}'`);
  }
  return match.multiplier;
};

/**
 * Updates product stock and records an immutable inventory movement
 */
const recordMovement = async ({
  productId,
  movementType, // OPENING, PURCHASE, SALE, CUSTOMER_RETURN, DAMAGE, LOSS, ADJUSTMENT
  quantityChange, // Signed integer/float in base units (positive for additions, negative for deductions)
  unit = 'PIECE',
  unitCostCents = 0,
  referenceType = 'ManualAdjustment',
  referenceId = null,
  reason = '',
  userId,
  session = null,
}) => {
  const query = Product.findById(productId);
  if (session) query.session(session);
  const product = await query;

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  // Check negative stock restriction if deducting
  const settings = await Settings.findOne();
  const globalAllowNegative = settings ? settings.allowNegativeStock : false;
  const allowNegative = product.allowNegativeStock || globalAllowNegative;

  const stockBefore = product.currentStock;
  const stockAfter = Number((stockBefore + quantityChange).toFixed(4));

  if (!allowNegative && stockAfter < 0) {
    throw new Error(
      `Insufficient stock for product '${product.name}'. Current: ${stockBefore}, Requested: ${Math.abs(quantityChange)}. Negative inventory is disabled.`
    );
  }

  // Update product stock
  product.currentStock = stockAfter;
  await product.save({ session });

  const totalCostCents = Math.round(Math.abs(quantityChange) * (unitCostCents || product.costPriceCents));

  const movementData = {
    product: product._id,
    movementType,
    quantity: quantityChange,
    unit,
    unitCostCents: unitCostCents || product.costPriceCents,
    totalCostCents,
    stockBefore,
    stockAfter,
    referenceType,
    referenceId,
    reason,
    createdBy: userId,
  };

  const movement = new InventoryMovement(movementData);
  await movement.save({ session });

  return { product, movement };
};

/**
 * Updates product weighted-average cost when goods are received
 */
const updateWeightedAverageCost = async (productId, receivedQtyBase, deliveredUnitCostCents, session = null) => {
  const query = Product.findById(productId);
  if (session) query.session(session);
  const product = await query;

  if (!product) return;

  const currentStock = Math.max(0, product.currentStock);
  const currentCost = product.costPriceCents || 0;

  const totalCurrentValue = currentStock * currentCost;
  const totalReceivedValue = receivedQtyBase * deliveredUnitCostCents;
  const totalNewStock = currentStock + receivedQtyBase;

  let newAverageCost = deliveredUnitCostCents;
  if (totalNewStock > 0) {
    newAverageCost = Math.round((totalCurrentValue + totalReceivedValue) / totalNewStock);
  }

  product.costPriceCents = newAverageCost;
  await product.save({ session });
  return newAverageCost;
};

module.exports = {
  getUnitConversion,
  recordMovement,
  updateWeightedAverageCost,
};

