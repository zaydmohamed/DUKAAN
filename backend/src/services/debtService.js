const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const CreditNote = require('../models/CreditNote');
const DebtAdjustment = require('../models/DebtAdjustment');
const { logAudit } = require('./auditService');

/**
 * Recalculate and update a customer's total outstanding balance
 */
const recalculateCustomerBalance = async (customerId, session = null) => {
  const customer = await Customer.findById(customerId).session(session);
  if (!customer) return 0;

  // Total Credit Sales: sum of all completed sales for this customer
  const sales = await Sale.find({
    customer: customerId,
    transactionStatus: 'COMPLETED',
  }).session(session);

  const totalSalesCents = sales.reduce((acc, s) => acc + s.totalAmountCents, 0);

  // Total Payments Allocated to sales
  const saleIds = sales.map((s) => s._id);
  const allocations = await PaymentAllocation.find({
    sale: { $in: saleIds },
  }).session(session);

  const totalAllocatedCents = allocations.reduce((acc, a) => acc + a.allocatedAmountCents, 0);

  // Outstanding credit notes or unutilized credit
  const creditNotes = await CreditNote.find({
    customer: customerId,
    status: 'ACTIVE',
  }).session(session);
  const totalCreditNotesCents = creditNotes.reduce((acc, cn) => acc + cn.remainingBalanceCents, 0);

  // Outstanding balance = Opening + Credit Sales - Payments Allocated - Credit Notes
  const outstanding = Math.max(
    0,
    customer.openingBalanceCents + totalSalesCents - totalAllocatedCents - totalCreditNotesCents
  );

  customer.totalCreditSalesCents = totalSalesCents;
  customer.totalPaymentsCents = totalAllocatedCents;
  customer.outstandingBalanceCents = outstanding;
  await customer.save({ session });

  return outstanding;
};

/**
 * Allocate a payment to customer sales
 * Method: 'SPECIFIC_INVOICE' or 'FIFO_OLDEST_FIRST'
 */
const allocateCustomerPayment = async ({
  paymentId,
  customerId,
  amountCents,
  method = 'FIFO_OLDEST_FIRST',
  targetSaleId = null,
  userId,
  session = null,
}) => {
  const payment = await Payment.findById(paymentId).session(session);
  if (!payment) throw new Error('Payment record not found');

  let remainingToAllocate = amountCents;
  const allocationsCreated = [];

  if (method === 'SPECIFIC_INVOICE' && targetSaleId) {
    const sale = await Sale.findById(targetSaleId).session(session);
    if (!sale) throw new Error('Target sale invoice not found');

    const allocatable = Math.min(remainingToAllocate, sale.outstandingBalanceCents);
    if (allocatable > 0) {
      sale.amountPaidCents += allocatable;
      sale.outstandingBalanceCents -= allocatable;
      sale.paymentStatus =
        sale.outstandingBalanceCents === 0
          ? 'PAID'
          : sale.amountPaidCents > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';
      await sale.save({ session });

      const alloc = new PaymentAllocation({
        payment: payment._id,
        sale: sale._id,
        allocatedAmountCents: allocatable,
        allocationMethod: 'SPECIFIC_INVOICE',
      });
      await alloc.save({ session });
      allocationsCreated.push(alloc);

      remainingToAllocate -= allocatable;
    }
  } else {
    // FIFO: apply to oldest outstanding invoices first
    const outstandingSales = await Sale.find({
      customer: customerId,
      transactionStatus: 'COMPLETED',
      outstandingBalanceCents: { $gt: 0 },
    })
      .sort({ saleDate: 1, createdAt: 1 })
      .session(session);

    for (const sale of outstandingSales) {
      if (remainingToAllocate <= 0) break;

      const allocatable = Math.min(remainingToAllocate, sale.outstandingBalanceCents);
      sale.amountPaidCents += allocatable;
      sale.outstandingBalanceCents -= allocatable;
      sale.paymentStatus =
        sale.outstandingBalanceCents === 0
          ? 'PAID'
          : sale.amountPaidCents > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';
      await sale.save({ session });

      const alloc = new PaymentAllocation({
        payment: payment._id,
        sale: sale._id,
        allocatedAmountCents: allocatable,
        allocationMethod: 'FIFO_OLDEST_FIRST',
      });
      await alloc.save({ session });
      allocationsCreated.push(alloc);

      remainingToAllocate -= allocatable;
    }
  }

  // If there is still excess unallocated payment, track as customer advance (liability)
  payment.unallocatedAmountCents = remainingToAllocate;
  await payment.save({ session });

  await recalculateCustomerBalance(customerId, session);

  return { allocationsCreated, unallocatedCents: remainingToAllocate };
};

/**
 * Write off a bad customer debt with strict authorization and audit logging
 */
const writeOffBadDebt = async ({
  customerId,
  amountCents,
  reason,
  approvedByUser,
  session = null,
}) => {
  const customer = await Customer.findById(customerId).session(session);
  if (!customer) throw new Error('Customer not found');

  if (customer.outstandingBalanceCents < amountCents) {
    throw new Error('Write-off amount cannot exceed current outstanding debt');
  }

  const previousBalance = customer.outstandingBalanceCents;
  const newBalance = previousBalance - amountCents;
  customer.outstandingBalanceCents = newBalance;
  await customer.save({ session });

  const adjustmentNumber = `ADJ-${Date.now()}`;
  const adjustment = new DebtAdjustment({
    adjustmentNumber,
    partyType: 'CUSTOMER',
    partyId: customer._id,
    partyModel: 'Customer',
    adjustmentType: 'BAD_DEBT_WRITE_OFF',
    amountCents,
    previousBalanceCents: previousBalance,
    newBalanceCents: newBalance,
    reason,
    approvedBy: approvedByUser._id,
  });
  await adjustment.save({ session });

  await logAudit({
    user: approvedByUser,
    action: 'BAD_DEBT_WRITTEN_OFF',
    resourceType: 'Customer',
    resourceId: customer._id,
    description: `Bad debt write-off of ${amountCents / 100} approved for customer ${customer.name}`,
    details: { amountCents, previousBalance, newBalance, adjustmentNumber },
    reason,
  });

  return adjustment;
};

module.exports = {
  recalculateCustomerBalance,
  allocateCustomerPayment,
  writeOffBadDebt,
};

