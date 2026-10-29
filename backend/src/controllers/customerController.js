const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const CreditNote = require('../models/CreditNote');
const { recalculateCustomerBalance } = require('../services/debtService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Get all customers
// @route GET /api/customers
const getCustomers = async (req, res, next) => {
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

    const customers = await Customer.find(query).sort({ name: 1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    next(err);
  }
};

// @desc Get single customer profile with comprehensive history
// @route GET /api/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Refresh balance dynamically
    await recalculateCustomerBalance(customer._id);
    const updated = await Customer.findById(customer._id);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc Create customer
// @route POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, notes, openingBalance = 0, creditLimit = 0 } = req.body;

    const openingBalanceCents = toCents(openingBalance);
    const creditLimitCents = toCents(creditLimit);

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      notes,
      openingBalanceCents,
      outstandingBalanceCents: openingBalanceCents,
      creditLimitCents,
    });

    await customer.save();

    await logAudit({
      user: req.user,
      action: 'CUSTOMER_CREATED',
      resourceType: 'Customer',
      resourceId: customer._id,
      description: `Customer '${customer.name}' registered`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc Update customer
// @route PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc Get detailed Customer Statement (Invoices, Payments, Aging, Balance)
// @route GET /api/customers/:id/statement
const getCustomerStatement = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const sales = await Sale.find({ customer: customer._id }).sort({ saleDate: -1 });
    const payments = await Payment.find({ partyId: customer._id, partyType: 'CUSTOMER' }).sort({
      paymentDate: -1,
    });
    const creditNotes = await CreditNote.find({ customer: customer._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        customer,
        sales,
        payments,
        creditNotes,
        reconciledBalanceCents: customer.outstandingBalanceCents,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerStatement,
};

