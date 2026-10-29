# DUKAAN — Enterprise Shop Management & Financial POS System (MERN Stack)

A complete, professional, and responsive Shop Management System built on strict accrual accounting principles, separating sales revenue from cash inflows, maintaining multi-unit inventory tracking (weighted-average costing), accounts receivable, accounts payable, daily physical cash session drawer reconciliation, and 20 standardized financial reports.

---

## 1. Technology Architecture

- **Backend**: Node.js & Express.js REST API
- **Database**: MongoDB with Mongoose ODM (supports both external MongoDB / MongoDB Atlas and zero-configuration built-in persistent MongoDB engine)
- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, Recharts
- **Precision**: Monetary figures stored as integer cents / minor units (e.g., `$100.50` stored as `10050`) to eliminate floating-point rounding errors.

---

## 2. Default Access Credentials

After seeding, the system provides pre-configured role-based user accounts:

| Role | Username | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin / Owner** | `admin` | `admin@dukaan.com` | `Password123!` | Full authorized access to all modules, financial P&L reports, write-offs, void sales, user management, and settings |
| **Cashier** | `cashier` | `cashier@dukaan.com` | `Password123!` | Point of Sale (POS), customer debt payments, receipts, viewing assigned cash drawer sessions |
| **Stock Manager** | `stock` | `stock@dukaan.com` | `Password123!` | Receiving purchase orders, inventory movements, stock adjustments, vendor details |

---

## 3. Critical Accounting Principles Implemented

1. **Revenue Recognition vs Cash Receipt**:
   - $\text{Net Sales} = \text{Gross Sales} - \text{Discounts} - \text{Sales Returns}$
   - Recognized at the time of sale. Credit sales increase Sales Revenue and Accounts Receivable.
   - Cash received from existing customer debts reduces Accounts Receivable; it **does NOT create duplicate sales revenue**.
2. **Cost of Goods Sold (COGS)**:
   - Recognized when inventory is sold based on the weighted-average unit cost at that exact moment.
   - Weighted-Average Cost is automatically updated whenever new purchase shipments are accepted:
     $$\text{New Unit Cost} = \frac{(\text{Current Stock} \times \text{Old Cost}) + (\text{Received Qty} \times \text{Effective Unit Cost})}{\text{Current Stock} + \text{Received Qty}}$$
3. **Gross Profit & Net Profit**:
   - $\text{Gross Profit} = \text{Net Sales} - \text{COGS}$
   - $\text{Net Profit} = \text{Gross Profit} - \text{Operating Expenses}$
4. **Physical Cash Drawer Reconciliation**:
   - Each cashier opens a daily session with an initial float.
   - $\text{Expected Closing Cash} = \text{Opening Cash} + \text{Cash Sales} + \text{Debt Collections in Cash} - \text{Cash Expenses} - \text{Supplier Cash Payments}$
   - Discrepancy is audited upon closing: $\text{Difference} = \text{Actual Counted} - \text{Expected Closing Cash}$.
5. **Customer Debt Management & Aging**:
   - Supports two allocation strategies: **FIFO (Oldest Outstanding First)** or **Specific Invoice Application**.
   - Aging buckets: `0-30 days` (current), `31-60 days`, `61-90 days`, and `90+ days` (critical).
   - Bad debt write-offs require authorized justification and generate immutable audit log entries.
6. **Multi-Unit Products**:
   - Configure base units (Pieces, KG, Grams, Liters) and conversions (e.g. 1 Carton = 20 Pieces). Selling 1 Carton automatically deducts 20 Pieces from base inventory.
   - Negative inventory is strictly prevented unless explicitly allowed in configuration.

---

## 4. 20 Standardized Financial Reports

Available with date range filters (`today`, `yesterday`, `this_week`, `this_month`, `this_year`, `custom`) and 1-click CSV export:
1. Daily Sales Report
2. Weekly Sales Report
3. Monthly Sales Report
4. Annual Sales Report
5. Cash Flow Report
6. Cash Session Report
7. Customer Debt Report
8. Customer Debt Aging Report (0-30, 31-60, 61-90, 90+ days)
9. Supplier Debt Report (A/P)
10. Inventory Movement Report
11. Stock Valuation Report
12. Low Stock & Reorder Report
13. Damaged & Lost Goods Report
14. Operating Expense Report
15. Gross Profit Analysis
16. Net Profit and Loss (P&L Income Statement)
17. Payment Method Breakdown (Cash vs Mobile vs Bank)
18. Customer Ledger Statements
19. Supplier Statements
20. Sales Returns & Refunds Report

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Step 1: Backend Setup & Seed
```bash
cd backend
npm install
npm run seed       # Populates default settings, categories, products, suppliers, customers, and demo users
```

### Step 2: Run the Critical Accounting Test Suite
```bash
cd backend
npm test
```
Verifies all 8 accounting invariant tests (Test A through Test H).

### Step 3: Run the Application
In terminal 1 (Backend):
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000` with healthcheck at `http://localhost:5000/api/health`.*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

