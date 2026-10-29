const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Get all suppliers
// @route GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const { search, withDebtOnly } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (withDebtOnly === 'true') {
      query.outstandingBalanceCents = { $gt: 0 };
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (err) {
    next(err);
  }
};

// @desc Get single supplier
// @route GET /api/suppliers/:id
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc Create supplier
// @route POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, openingBalance = 0 } = req.body;
    const openingBalanceCents = toCents(openingBalance);

    const supplier = new Supplier({
      name,
      contactPerson,
      phone,
      email,
      address,
      openingBalanceCents,
      outstandingBalanceCents: openingBalanceCents,
    });

    await supplier.save();

    await logAudit({
      user: req.user,
      action: 'SUPPLIER_CREATED',
      resourceType: 'Supplier',
      resourceId: supplier._id,
      description: `Supplier '${supplier.name}' registered`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc Update supplier
// @route PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc Get Supplier Statement
// @route GET /api/suppliers/:id/statement
const getSupplierStatement = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchases = await Purchase.find({ supplier: supplier._id }).sort({ purchaseDate: -1 });
    const payments = await Payment.find({ partyId: supplier._id, partyType: 'SUPPLIER' }).sort({
      paymentDate: -1,
    });

    res.json({
      success: true,
      data: {
        supplier,
        purchases,
        payments,
        outstandingBalanceCents: supplier.outstandingBalanceCents,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  getSupplierStatement,
};

