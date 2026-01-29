import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';

// Standard Pages
import Login from './pages/Login';
import PublicRegistration from './pages/PublicRegistration';
import FranchiseRegistration from './pages/FranchiseRegistration';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Earnings from './pages/Earnings';
import UserTree from './pages/UserTree';
import FranchiseTree from './pages/FranchiseTree';
import Bank from './pages/Bank';
import Profile from './pages/Profile';
import UserFranchiseApply from './pages/UserFranchiseApply';

// E-Pin Pages
import EPinApply from './pages/EPinApply';
import EPinReport from './pages/EPinReport';
import EPinUnused from './pages/EPinUnused';
import EPinUsed from './pages/EPinUsed';
import ShoppingWallet from './pages/ShoppingWallet';
import ProductOrders from './pages/ProductOrders';

// Downline & Income Pages
import DownlineReport from './pages/DownlineReport';
import DownlineActivated from './pages/DownlineActivated';
import DirectFranchiseIncome from './pages/DirectFranchiseIncome';
import MatchingIncome from './pages/MatchingIncome';
import PerformanceIncome from './pages/PerformanceIncome';
import FranchiseBonusIncome from './pages/FranchiseBonusIncome';

// Franchise Pages
import BuyEPin from './pages/franchise/BuyEPin';
import TransferEPin from './pages/franchise/TransferEPin';
import Stock from './pages/franchise/Stock';
import SalesReport from './pages/franchise/SalesReport';
import Commission from './pages/franchise/Commission';
import FranchiseProfile from './pages/franchise/Profile';
import FranchiseTransactions from './pages/franchise/Transactions';

// Admin Pages
import Users from './pages/admin/Users';
import Approvals from './pages/admin/Approvals';
import FranchiseApprovables from './pages/admin/FranchiseApprovables';
import UserFranchiseApplications from './pages/admin/UserFranchiseApplications';
import BlockedUsers from './pages/admin/BlockedUsers';
import Franchises from './pages/admin/Franchises';
import CreateFranchise from './pages/admin/CreateFranchise';
import AdminFranchiseTree from './pages/admin/FranchiseTree';
import AdminTeams from './pages/admin/Teams';
import Payouts from './pages/admin/Payouts';
import Transactions from './pages/admin/Transactions';
import AdminSales from './pages/admin/reports/Sales';
import AdminIncome from './pages/admin/reports/Income';
import Settings from './pages/admin/Settings';
import EPinRequests from './pages/admin/EPinRequests';



import { AdminProvider } from './context/AdminContext';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <ConfirmProvider>
          <AdminProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<PublicRegistration />} />
                <Route path="/franchise-registration" element={<FranchiseRegistration />} />

                {/* Protected Core Routes */}
                <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* User Specific Routes */}
                <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
                <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><UserTree /></ProtectedRoute>} />
                <Route path="/bank" element={<ProtectedRoute><Bank /></ProtectedRoute>} />

                <Route path="/epin/apply" element={<ProtectedRoute><EPinApply /></ProtectedRoute>} />
                <Route path="/epin/request-report" element={<ProtectedRoute><EPinReport /></ProtectedRoute>} />
                <Route path="/epin/unused" element={<ProtectedRoute><EPinUnused /></ProtectedRoute>} />
                <Route path="/epin/used" element={<ProtectedRoute><EPinUsed /></ProtectedRoute>} />
                <Route path="/epin/shopping-wallet" element={<ProtectedRoute><ShoppingWallet /></ProtectedRoute>} />
                <Route path="/epin/product-orders" element={<ProtectedRoute><ProductOrders /></ProtectedRoute>} />

                <Route path="/downline/report" element={<ProtectedRoute><DownlineReport /></ProtectedRoute>} />
                <Route path="/downline/activated" element={<ProtectedRoute><DownlineActivated /></ProtectedRoute>} />

                <Route path="/income/direct-franchise" element={<ProtectedRoute><DirectFranchiseIncome /></ProtectedRoute>} />
                <Route path="/income/matching" element={<ProtectedRoute><MatchingIncome /></ProtectedRoute>} />
                <Route path="/income/performance" element={<ProtectedRoute><PerformanceIncome /></ProtectedRoute>} />
                <Route path="/income/franchise-bonus" element={<ProtectedRoute><FranchiseBonusIncome /></ProtectedRoute>} />

                {/* User Franchise Application */}
                <Route path="/user/franchise/apply" element={<ProtectedRoute><UserFranchiseApply /></ProtectedRoute>} />

                {/* Franchise Routes */}
                <Route path="/franchise/buy-epin" element={<ProtectedRoute><BuyEPin /></ProtectedRoute>} />
                <Route path="/franchise/transfer" element={<ProtectedRoute><TransferEPin /></ProtectedRoute>} />
                <Route path="/franchise/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
                <Route path="/franchise/sales-report" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
                <Route path="/franchise/commission" element={<ProtectedRoute><Commission /></ProtectedRoute>} />
                <Route path="/franchise/tree" element={<ProtectedRoute><FranchiseTree /></ProtectedRoute>} />
                <Route path="/franchise/profile" element={<ProtectedRoute><FranchiseProfile /></ProtectedRoute>} />
                <Route path="/franchise/transactions" element={<ProtectedRoute><FranchiseTransactions /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                <Route path="/admin/teams" element={<ProtectedRoute><AdminTeams /></ProtectedRoute>} />
                <Route path="/admin/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
                <Route path="/admin/franchise-approvables" element={<ProtectedRoute><FranchiseApprovables /></ProtectedRoute>} />
                <Route path="/admin/blocked" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />

                <Route path="/admin/franchises" element={<ProtectedRoute><Franchises /></ProtectedRoute>} />
                <Route path="/admin/create-franchise" element={<ProtectedRoute><CreateFranchise /></ProtectedRoute>} />
                <Route path="/admin/user-franchise-applications" element={<ProtectedRoute><UserFranchiseApplications /></ProtectedRoute>} />
                <Route path="/admin/franchise-tree" element={<ProtectedRoute><AdminFranchiseTree /></ProtectedRoute>} />

                <Route path="/admin/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
                <Route path="/admin/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/admin/epin-requests" element={<ProtectedRoute><EPinRequests /></ProtectedRoute>} />

                <Route path="/admin/reports/sales" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
                <Route path="/admin/reports/income" element={<ProtectedRoute><AdminIncome /></ProtectedRoute>} />

                <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />


                {/* Fallback */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AdminProvider>
        </ConfirmProvider>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;