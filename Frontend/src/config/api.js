// Production domain: mlm.swift2ai.com (root)
// FORCE LOCALHOST FOR NOW TO DEBUG
const API_BASE_URL = 'http://localhost/mlm/backend/api';

console.log('API Base URL:', API_BASE_URL); // Log to console to verify

// API endpoints
// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/login.php`,
  REGISTER: `${API_BASE_URL}/auth/register.php`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change_password.php`,
  ME: `${API_BASE_URL}/auth/me.php`,

  // User
  DASHBOARD: `${API_BASE_URL}/user/dashboard.php`,
  PROFILE: `${API_BASE_URL}/user/profile.php`,

  // Packages
  PACKAGES: `${API_BASE_URL}/user/packages.php`,
  PURCHASE_PACKAGE: `${API_BASE_URL}/user/purchase_package.php`,

  // Wallet & Income
  WALLET: `${API_BASE_URL}/user/wallet.php`,
  INCOME: `${API_BASE_URL}/user/earnings.php`, // Using earnings.php as generic income endpoint

  // Withdrawals
  WITHDRAWAL: `${API_BASE_URL}/user/withdrawals.php`,

  // Team
  TEAM: `${API_BASE_URL}/user/teams.php`,
  CHECK_USER: `${API_BASE_URL}/user/check_user.php`,
  GET_USER_DETAILS: `${API_BASE_URL}/user/get_user_details.php`,
  UPDATE_USER: `${API_BASE_URL}/user/update_user.php`,

  // Bank
  BANK: `${API_BASE_URL}/user/bank.php`,

  // KYC
  KYC: `${API_BASE_URL}/user/kyc.php`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/user/notifications.php`,

  // Support
  SUPPORT: `${API_BASE_URL}/user/support.php`,

  // Stats
  STATS: `${API_BASE_URL}/user/stats.php`,

  // Admin
  ADMIN_USERS: `${API_BASE_URL}/admin/users.php`,
  ADMIN_USER_DETAILS: `${API_BASE_URL}/admin/get_user_details.php`,
  ADMIN_FRANCHISES: `${API_BASE_URL}/admin/franchises.php`,
  ADMIN_TREE: `${API_BASE_URL}/admin/network_tree.php`,
  ADMIN_TRANSACTIONS: `${API_BASE_URL}/admin/transactions.php`,

  // Franchise
  FRANCHISE_DASHBOARD: `${API_BASE_URL}/franchise/dashboard.php`,
  FRANCHISE_PROFILE: `${API_BASE_URL}/franchise/profile.php`,
  FRANCHISE_INVENTORY: `${API_BASE_URL}/franchise/inventory.php`,

  FRANCHISE_TREE: `${API_BASE_URL}/franchise/tree.php`,

  // Shopping (New)
  SHOPPING_WALLET: `${API_BASE_URL}/user/shopping_wallet.php`,
  PRODUCT_ORDERS: `${API_BASE_URL}/user/product_orders.php`,
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to get user from localStorage
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Helper function to set user in localStorage
export const setStoredUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export default API_BASE_URL;
