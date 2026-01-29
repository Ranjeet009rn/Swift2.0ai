import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Search, Bell, X, Edit, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useConfirm } from '../context/ConfirmContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const Layout = ({ children }) => {
  const { user, logout, updateUserProfile } = useAuth();
  const { showConfirm } = useConfirm();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);


  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      // Check if we have a valid auth token before making the request
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, skipping notifications fetch');
        return;
      }

      try {
        const response = await apiService.getNotifications();
        if (response.success) {
          setNotifications(response.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
        // Set empty array on error to prevent repeated attempts
        setNotifications([]);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const [profileData, setProfileData] = useState({
    name: user?.full_name || user?.name || '',
    email: user?.email || '',
    phone: user?.mobile || '',
    referralCode: user?.user_id || user?.referral_code || ''
  });

  // Search data - Role specific
  const getRoleBasedSearchData = () => {
    const role = user?.role || 'user'; // Default to user if not found

    const common = [
      { type: 'feature', name: 'Profile Settings', path: '#', description: 'Edit your profile information' },
      { type: 'feature', name: 'Notifications', path: '#', description: 'View all notifications' },
      { type: 'feature', name: 'Logout', path: '#', description: 'Sign out of your account' },
    ];

    const userPages = [
      { type: 'page', name: 'Bank Details', path: '/bank', description: 'Manage your bank account and withdrawals' },
      { type: 'page', name: 'Dashboard', path: '/dashboard', description: 'View your overview and statistics' },
      { type: 'page', name: 'Earnings', path: '/earnings', description: 'Track your income and transactions' },
      { type: 'page', name: 'My Team', path: '/team', description: 'View your referral team structure' },
      { type: 'page', name: 'Packages', path: '/packages', description: 'Browse and purchase packages' },
      { type: 'page', name: 'Rank & Rewards', path: '/ranks', description: 'Check your rank and claim rewards' },
      { type: 'feature', name: 'Claim Rewards', path: '/ranks', description: 'Claim your achievement rewards' },
      { type: 'feature', name: 'Direct Income', path: '/earnings', description: 'View direct referral income' },
      { type: 'feature', name: 'Referral Code', path: '/team', description: 'Share your referral code' },
      { type: 'feature', name: 'Sponsor Income', path: '/earnings', description: 'View sponsor income' },
      { type: 'feature', name: 'Team Analytics', path: '/team', description: 'View team performance' },
      { type: 'feature', name: 'Transaction History', path: '/dashboard', description: 'View your transaction history' },
      { type: 'feature', name: 'Withdraw Funds', path: '/bank', description: 'Withdraw money to your bank' },
    ];

    const adminPages = [
      { type: 'page', name: 'Admin Dashboard', path: '/admin-dashboard', description: 'System overview' },
      { type: 'page', name: 'All Users', path: '/admin/users', description: 'Manage registered users' },
      { type: 'page', name: 'Teams & Trees', path: '/admin/teams', description: 'View genealogy trees' },
      { type: 'page', name: 'Pending Approvals', path: '/admin/approvals', description: 'Approve KYC/Withdrawals' },
      { type: 'page', name: 'Franchise Applications', path: '/admin/franchise-approvables', description: 'Approve franchise applications' },
      { type: 'page', name: 'Blocked Users', path: '/admin/users?filter=blocked', description: 'View blocked accounts' },
      { type: 'page', name: 'All Franchises', path: '/admin/franchises', description: 'Manage franchises' },
      { type: 'page', name: 'Add New Franchise', path: '/admin/franchises/add', description: 'Create new franchise' },
      { type: 'page', name: 'Generate Payout', path: '/admin/payouts', description: 'Process commissions' },
      { type: 'page', name: 'Transactions', path: '/admin/transactions', description: 'View financial logs' },
      { type: 'page', name: 'Sales Report', path: '/admin/reports/sales', description: 'View sales analytics' },
      { type: 'page', name: 'Income Report', path: '/admin/reports/income', description: 'View income distribution' },
      { type: 'page', name: 'Settings', path: '/admin/settings', description: 'System settings' },
    ];

    const franchisePages = [
      { type: 'page', name: 'Dashboard', path: '/franchise-dashboard', description: 'Franchise overview' },
      { type: 'page', name: 'Buy E-Pins', path: '/franchise/epins', description: 'Purchase E-Pins' },
      { type: 'page', name: 'Transfer Stock', path: '/franchise/stock', description: 'Transfer E-Pin stock' },
      { type: 'page', name: 'My Inventory', path: '/franchise/inventory', description: 'View your E-Pins' },
      { type: 'page', name: 'Sales Report', path: '/franchise/sales', description: 'View sales history' },
      { type: 'page', name: 'Commissions', path: '/franchise/commissions', description: 'View commission earnings' },
      { type: 'page', name: 'Team Tree', path: '/franchise/network', description: 'View network structure' },
      { type: 'page', name: 'Franchise Profile', path: '/franchise/profile', description: 'Manage franchise profile' },
    ];

    let data = [];
    if (role === 'admin') data = [...common, ...adminPages];
    else if (role === 'franchise') data = [...common, ...franchisePages];
    else data = [...common, ...userPages];

    return data.sort((a, b) => a.name.localeCompare(b.name));
  };

  const searchData = getRoleBasedSearchData();

  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  const filteredResults = searchData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchResultClick = (path) => {
    if (path === '#') {
      if (path.includes('Notifications')) {
        setShowNotifications(true);
      } else if (path.includes('Profile')) {
        setShowProfile(true);
      }
    } else {
      navigate(path);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleNotificationClick = (notification) => {
    navigate(notification.link);
    setShowNotifications(false);
    // Mark as read
    setNotifications(notifications.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const { showAlert } = useAlert();

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      'danger'
    );

    if (confirmed) {
      // Handle account deletion
      logout();
      navigate('/login');
    }
  };

  const handleSaveProfile = async () => {
    // Handle profile save
    const updateData = {
      full_name: profileData.name,
      email: profileData.email,
      mobile: profileData.phone
    };

    const result = await updateUserProfile(updateData);

    if (result.success) {
      showAlert('Profile updated successfully!', 'success', 'Profile Updated');
      setShowProfile(false);
    } else {
      showAlert(result.message || 'Failed to update profile', 'error', 'Update Failed');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar - Full Width - Fixed */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-[50] h-[75px] flex items-center border-b border-gray-200">
        <div className="px-8 w-full flex items-center justify-between">
          {/* Logo */}
          <div className={`flex items-center transition-all duration-300 ${!sidebarOpen ? 'ml-16' : ''}`}>
            <img src="/logo.png" alt="SwiftMLM Logo" className="h-[110px] w-auto max-w-[500px] object-contain" />
          </div>

          <div className="flex-1 max-w-xl relative mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search pages, features..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && filteredResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                <div className="p-2">
                  {filteredResults.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearchResultClick(item.path)}
                      className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.type === 'page'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                              }`}>
                              {item.type === 'page' ? 'PAGE' : 'FEATURE'}
                            </span>
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <Search size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {showSearchResults && filteredResults.length === 0 && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50 text-center">
                <Search size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">No results found</p>
                <p className="text-gray-400 text-sm mt-1">Try searching for pages or features</p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-white text-xs hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const Icon = notification.icon;
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${notification.type === 'rank' ? 'bg-yellow-100' :
                                notification.type === 'referral' ? 'bg-blue-100' :
                                  notification.type === 'earning' ? 'bg-green-100' :
                                    notification.type === 'reward' ? 'bg-purple-100' :
                                      'bg-indigo-100'
                                }`}>
                                <Icon size={20} className={
                                  notification.type === 'rank' ? 'text-yellow-600' :
                                    notification.type === 'referral' ? 'text-blue-600' :
                                      notification.type === 'earning' ? 'text-green-600' :
                                        notification.type === 'reward' ? 'text-purple-600' :
                                          'text-indigo-600'
                                } />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div
              onClick={() => {
                if (user?.role === 'franchise') {
                  navigate('/franchise/profile');
                } else if (user?.role !== 'admin') {
                  setShowProfile(true);
                }
              }}
              className={`flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 ${user?.role !== 'admin' ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'} transition-colors`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {(user?.name || user?.full_name || user?.user_id || 'AD').substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{user?.name || user?.full_name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'Administrator' : `ID: ${user?.user_id || user?.referral_code || '---'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex pt-[75px] overflow-x-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-8 transition-all duration-300 overflow-x-hidden ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-12'}`}>
          {children}
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3">
                  {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <button className="text-blue-600 text-sm font-semibold hover:underline">
                  Change Photo
                </button>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Referral Code</label>
                  <input
                    type="text"
                    value={profileData.referralCode}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Edit size={20} />
                    <span>Save Changes</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>

                  <button
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={20} />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
