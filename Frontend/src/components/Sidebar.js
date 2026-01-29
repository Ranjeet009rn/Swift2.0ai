import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Network,
  Package as PackageIcon,
  TrendingDown,
  DollarSign,
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  ChevronLeft,
  Users,
  Settings,
  ShoppingCart,
  PieChart,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- MENU CONFIGURATIONS ---

const userMenuItems = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    key: 'profile', icon: User, label: 'My Profile', hasSubmenu: true,
    submenu: [{ path: '/profile', label: 'View Profile' }]
  },
  {
    key: 'network', icon: Network, label: 'My Network', hasSubmenu: true,
    submenu: [{ path: '/team', label: 'Team View' }]
  },
  {
    key: 'epin', icon: PackageIcon, label: 'E-Pin System', hasSubmenu: true,
    submenu: [
      { path: '/epin/apply', label: 'Apply New' },
      { path: '/epin/request-report', label: 'Request Report' },
      { path: '/epin/unused', label: 'Unused Pins' },
      { path: '/epin/used', label: 'Used Pins' },
      { path: '/epin/shopping-wallet', label: 'Shopping Wallet' },
      { path: '/epin/product-orders', label: 'Product Order Report' },
    ]
  },

  {
    key: 'franchise', icon: Briefcase, label: 'Franchise', hasSubmenu: true, requiresApproval: true,
    submenu: [
      { path: '/user/franchise/apply', label: 'Apply for Franchise', alwaysVisible: true },
      { path: '/franchise/buy-epin', label: 'Buy E-Pins', requiresApproval: true },
      { path: '/franchise/transfer', label: 'Transfer Stock', requiresApproval: true },
      { path: '/franchise/stock', label: 'My Inventory', requiresApproval: true },
      { path: '/franchise/sales-report', label: 'Sales Report', requiresApproval: true },
      { path: '/franchise/commission', label: 'Commissions', requiresApproval: true },
      { path: '/franchise/tree', label: 'Team Tree', requiresApproval: true },
      { path: '/franchise/profile', label: 'Franchise Profile', requiresApproval: true },
    ]
  },
  {
    key: 'downline', icon: TrendingDown, label: 'Downline', hasSubmenu: true,
    submenu: [
      { path: '/downline/report', label: 'Downline Report' },
      { path: '/downline/activated', label: 'Activated Members' },
    ]
  },
  {
    key: 'income', icon: DollarSign, label: 'Incomes', hasSubmenu: true,
    submenu: [
      { path: '/earnings', label: 'Overview' },
      { path: '/income/direct-franchise', label: 'Direct Bonus' },
      { path: '/income/matching', label: 'Matching Bonus' },
      { path: '/income/performance', label: 'Performance Bonus' },
      { path: '/income/franchise-bonus', label: 'Franchise Bonus' },
    ]
  },
  { key: 'payout', path: '/bank', icon: FileText, label: 'Payouts' },
];

const franchiseMenuItems = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    key: 'epin_manage', icon: ShoppingCart, label: 'E-Pin Manager', hasSubmenu: true,
    submenu: [
      { path: '/franchise/buy-epin', label: 'Buy E-Pins' },
      { path: '/franchise/transfer', label: 'Transfer Stock' },
      { path: '/franchise/stock', label: 'My Inventory' },
    ]
  },
  {
    key: 'sales', icon: TrendingDown, label: 'Sales & Reports', hasSubmenu: true,
    submenu: [
      { path: '/franchise/sales-report', label: 'Sales Report' },
      { path: '/franchise/commission', label: 'Commissions' },
    ]
  },
  {
    key: 'network', icon: Network, label: 'My Network', hasSubmenu: true,
    submenu: [{ path: '/franchise/tree', label: 'Team Tree' }]
  },
  { key: 'profile', path: '/franchise/profile', icon: Briefcase, label: 'Franchise Profile' }
];

const adminMenuItems = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
  {
    key: 'users', icon: Users, label: 'User Management', hasSubmenu: true,
    submenu: [
      { path: '/admin/users', label: 'All Users' },
      { path: '/admin/teams', label: 'Teams & Trees' },
      { path: '/admin/approvals', label: 'Pending Approvals' },
      { path: '/admin/blocked', label: 'Blocked Users' },
    ]
  },
  {
    key: 'franchise', icon: Briefcase, label: 'Franchises', hasSubmenu: true,
    submenu: [
      { path: '/admin/franchises', label: 'All Franchises' },
      { path: '/admin/create-franchise', label: 'Add New' },
      { path: '/admin/franchise-approvables', label: 'Franchise Applications' },
      { path: '/admin/user-franchise-applications', label: 'User Franchise Applications' },
      { path: '/admin/franchise-tree', label: 'Franchise Tree' },
    ]
  },
  {
    key: 'epin', icon: PackageIcon, label: 'E-Pin Management', hasSubmenu: true,
    submenu: [
      { path: '/admin/epin-requests', label: 'E-Pin Requests' },
    ]
  },
  {
    key: 'payouts', icon: DollarSign, label: 'Finance', hasSubmenu: true,
    submenu: [
      { path: '/admin/payouts', label: 'Generate Payout' },
      { path: '/admin/transactions', label: 'Transactions' },
    ]
  },
  {
    key: 'reports', icon: PieChart, label: 'Reports', hasSubmenu: true,
    submenu: [
      { path: '/admin/reports/sales', label: 'Sales Report' },
      { path: '/admin/reports/income', label: 'Income Report' },
    ]
  },
  { key: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings' }
];


const Sidebar = ({ isOpen, onClose, onOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [franchiseApproved, setFranchiseApproved] = useState(false);

  // Determine role and theme color
  const role = user?.role?.toLowerCase() || 'user';
  let currentMenuItems = userMenuItems;
  let themeColor = 'blue'; // blue, orange, purple

  if (role === 'admin') {
    currentMenuItems = adminMenuItems;
    themeColor = 'purple';
  } else if (role === 'franchise') {
    currentMenuItems = franchiseMenuItems;
    themeColor = 'orange';
  }

  // Fetch franchise approval status for regular users
  useEffect(() => {
    if (role === 'user') {
      fetch('http://localhost/mlm/backend/api/user/franchise_status.php', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFranchiseApproved(data.approved || false);
          }
        })
        .catch(err => console.error('Failed to fetch franchise status:', err));
    }
  }, [role]);

  // Pre-expand menus
  useEffect(() => {
    currentMenuItems.forEach(item => {
      if (item.hasSubmenu && item.submenu) {
        if (item.submenu.some(subItem => subItem.path === location.pathname)) {
          setExpandedMenus(prev => ({ ...prev, [item.key]: true }));
        }
      }
    });
  }, [location.pathname, currentMenuItems]);

  const toggleMenu = (key) => setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  const handleLogout = () => { logout(); navigate('/login'); onClose(); };
  const handleMenuClick = () => { if (window.innerWidth < 1024) onClose(); };

  // Helper for dynamic classes
  const getActiveClass = (isActive) => {
    if (!isActive) return `hover:bg-${themeColor}-50 text-gray-600 hover:text-${themeColor}-700`;
    // Active State
    if (themeColor === 'orange') return 'bg-orange-600 text-white shadow-md shadow-orange-200';
    if (themeColor === 'purple') return 'bg-purple-600 text-white shadow-md shadow-purple-200';
    return 'bg-blue-600 text-white shadow-md shadow-blue-200';
  };

  const getSubMenuActiveClass = (isActive) => {
    if (!isActive) return 'text-gray-500 hover:text-gray-900 border-l-2 border-transparent';
    if (themeColor === 'orange') return 'text-orange-600 font-bold border-l-2 border-orange-600 bg-orange-50';
    if (themeColor === 'purple') return 'text-purple-600 font-bold border-l-2 border-purple-600 bg-purple-50';
    return 'text-blue-600 font-bold border-l-2 border-blue-600 bg-blue-50';
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}
      {!isOpen && (
        <button onClick={onOpen} className="fixed left-0 top-24 z-50 p-2 pl-3 bg-white shadow-lg rounded-r-xl border border-gray-100 text-gray-600 hover:text-blue-600 transition-all">
          <Menu size={20} />
        </button>
      )}

      <div className={`w-72 bg-white fixed left-0 top-[75px] bottom-0 shadow-2xl z-50 transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header Profile Card - COMPACT */}
        <div className={`p-4 bg-gradient-to-br ${themeColor === 'orange' ? 'from-orange-50 to-amber-50' : themeColor === 'purple' ? 'from-purple-50 to-pink-50' : 'from-blue-50 to-indigo-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm text-${themeColor}-600`}>
                {role === 'admin' ? <Settings size={20} /> : role === 'franchise' ? <Briefcase size={20} /> : <User size={20} />}
              </div>
              <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                {role === 'admin' ? 'Administrator' : role === 'franchise' ? 'Franchise Owner' : 'Direct Seller'}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full transition"><ChevronLeft size={18} className="text-gray-500" /></button>
          </div>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
          {currentMenuItems.map(item => (
            <div key={item.key}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-1 
                                    ${expandedMenus[item.key] ? `bg-${themeColor}-50 text-${themeColor}-700` : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} strokeWidth={2} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${expandedMenus[item.key] ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Submenu */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMenus[item.key] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-4 space-y-1 py-1">
                      {item.submenu.map((sub, idx) => {
                        // Check if this item requires franchise approval
                        const requiresApproval = sub.requiresApproval && !franchiseApproved;
                        const isAlwaysVisible = sub.alwaysVisible;

                        // Show item if it's always visible OR if it doesn't require approval OR if franchise is approved
                        if (isAlwaysVisible || !sub.requiresApproval || franchiseApproved) {
                          return (
                            <NavLink
                              key={idx}
                              to={sub.path}
                              onClick={handleMenuClick}
                              className={({ isActive }) => `block pl-9 py-2 rounded-r-lg text-sm transition-colors ${getSubMenuActiveClass(isActive)}`}
                            >
                              {sub.label}
                            </NavLink>
                          );
                        } else if (requiresApproval) {
                          // Show locked item
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between pl-9 py-2 rounded-r-lg text-sm text-gray-400 cursor-not-allowed border-l-2 border-transparent"
                              title="Franchise approval required"
                            >
                              <span>{sub.label}</span>
                              <span className="text-xs">🔒</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={handleMenuClick}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-1 ${getActiveClass(isActive)}`}
                >
                  <item.icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-semibold group">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;
