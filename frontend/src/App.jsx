import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Debts from './pages/Debts';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import OwnerDrawings from './pages/OwnerDrawings';
import BalanceSheet from './pages/BalanceSheet';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-bold">
        Loading DUKAAN Enterprise...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* The 13 Dedicated Modules Requested */}
            <Route path="pos" element={<POS />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="debts" element={<Debts />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="employees" element={<Employees />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="owner-drawings" element={<OwnerDrawings />} />
            <Route path="balance-sheet" element={<BalanceSheet />} />
            <Route path="reports" element={<Reports />} />

            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
