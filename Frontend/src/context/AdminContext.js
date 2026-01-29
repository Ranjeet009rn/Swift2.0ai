import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const { user } = useAuth();

    // --- REAL STATE ---

    // Users
    const [users, setUsers] = useState([]);

    // Franchises
    const [franchises, setFranchises] = useState([]);

    // Approvals (KYC & Withdrawal)
    const [kycRequests, setKycRequests] = useState([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);

    // Settings
    const [settings, setSettings] = useState({
        companyName: 'SwiftMLM Network',
        supportEmail: 'support@swiftmlm.com',
        currency: 'INR',
        timezone: 'IST',
        adminFee: 5,
        tds: 10,
        minWithdrawal: 500,
        twoFactor: false,
        registrationOpen: true
    });

    // Fetch Initial Data
    const fetchUsers = React.useCallback(async () => {
        try {
            if (user?.role === 'admin') {
                const response = await apiService.getAdminUsers();
                if (response.success) {
                    setUsers(response.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch admin users", error);
        }
    }, [user]);

    const fetchFranchises = React.useCallback(async () => {
        try {
            if (user?.role === 'admin') {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/admin/franchises.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    // Transform backend data to match frontend format
                    const formattedFranchises = data.data.map(f => ({
                        id: f.id,
                        name: f.name || 'Unnamed Franchise',
                        owner: f.owner || 'Not Available',
                        region: f.region || 'Location Not Set',
                        stock: f.stock || 0,
                        sales: f.sales || 0,
                        status: f.status || 'active',
                        type: f.type || 'Standard',
                        role: f.role || 'franchise'
                    }));
                    setFranchises(formattedFranchises);
                }
            }
        } catch (error) {
            console.error("Failed to fetch franchises", error);
        }
    }, [user]);

    const fetchApprovals = React.useCallback(async () => {
        try {
            if (user?.role === 'admin') {
                const token = localStorage.getItem('authToken');

                // Fetch KYC requests
                const kycResponse = await fetch('http://localhost/mlm/backend/api/admin/kyc_requests.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const kycData = await kycResponse.json();
                if (kycData.success) {
                    setKycRequests(kycData.data || []);
                }

                // Fetch Withdrawal requests
                const withdrawalResponse = await fetch('http://localhost/mlm/backend/api/admin/withdrawal_requests.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const withdrawalData = await withdrawalResponse.json();
                if (withdrawalData.success) {
                    setWithdrawalRequests(withdrawalData.data || []);
                }
            }
        } catch (error) {
            console.error("Failed to fetch approvals", error);
        }
    }, [user]);

    useEffect(() => {
        // Call fetchers only if admin
        if (user?.role === 'admin') {
            fetchUsers();
            fetchFranchises();
            fetchApprovals();
        }
    }, [user, fetchUsers, fetchFranchises, fetchApprovals]);


    // --- ACTIONS ---

    // User Actions
    const blockUser = async (userId, reason = 'Admin Action') => {
        try {
            const response = await apiService.adminManageUser('block', userId, { reason });
            if (response.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, status: 'Blocked', blockReason: reason } : u));
                fetchUsers(); // Sync with DB
            }
        } catch (error) {
            console.error("Failed to block user", error);
        }
    };

    const unblockUser = async (userId) => {
        try {
            const response = await apiService.adminManageUser('active', userId);
            if (response.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, status: 'Active', blockReason: null } : u));
                fetchUsers(); // Sync with DB
            }
        } catch (error) {
            console.error("Failed to unblock user", error);
        }
    };

    const deleteUser = async (userId) => {
        try {
            // TODO: Ensure backend supports 'delete' action
            /* 
            const response = await apiService.adminManageUser('delete', userId);
            if (response.success) {
                setUsers(users.filter(u => u.id !== userId));
            }
            */
            setUsers(users.filter(u => u.id !== userId));
            // fetchUsers(); 
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const addUser = async (newUser) => {
        try {
            const response = await apiService.register(newUser); // Assuming register endpoint works for admins too, otherwise need specific admin add user endpoint
            if (response.success) {
                // Refresh list or add result
                const addedUser = { ...newUser, id: response.data?.id || (users.length + 100), joinDate: new Date().toISOString().split('T')[0], status: 'Active', rank: 'None', avatar: newUser.name.charAt(0) };
                setUsers([addedUser, ...users]); // Add to top
            }
        } catch (error) {
            console.error("Failed to add user", error);
        }
    };

    const updateUser = (id, updatedData) => {
        setUsers(users.map(u => u.id === id ? { ...u, ...updatedData } : u));
        // TODO: Call API to persist
    };

    // Franchise Actions
    const addFranchise = (newFranchise) => {
        const id = `FR${String(franchises.length + 1).padStart(3, '0')}`;
        setFranchises([...franchises, { ...newFranchise, id, status: 'Active', sales: 0 }]);
    };

    const updateFranchise = (id, updatedData) => {
        setFranchises(franchises.map(f => f.id === id ? { ...f, ...updatedData } : f));
    };

    const deleteFranchise = (id) => {
        setFranchises(franchises.filter(f => f.id !== id));
    };

    // Approval Actions
    const approveKyc = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/kyc_requests.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'approve', kyc_id: id })
            });
            const data = await response.json();
            if (data.success) {
                setKycRequests(kycRequests.filter(req => req.id !== id));
                fetchApprovals(); // Refresh
            }
        } catch (error) {
            console.error("Failed to approve KYC", error);
        }
    };

    const rejectKyc = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/kyc_requests.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'reject', kyc_id: id })
            });
            const data = await response.json();
            if (data.success) {
                setKycRequests(kycRequests.filter(req => req.id !== id));
                fetchApprovals(); // Refresh
            }
        } catch (error) {
            console.error("Failed to reject KYC", error);
        }
    };

    const approveWithdrawal = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/withdrawal_requests.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'approve', withdrawal_id: id })
            });
            const data = await response.json();
            if (data.success) {
                setWithdrawalRequests(withdrawalRequests.filter(req => req.id !== id));
                fetchApprovals(); // Refresh
            }
        } catch (error) {
            console.error("Failed to approve withdrawal", error);
        }
    };

    const rejectWithdrawal = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/withdrawal_requests.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'reject', withdrawal_id: id })
            });
            const data = await response.json();
            if (data.success) {
                setWithdrawalRequests(withdrawalRequests.filter(req => req.id !== id));
                fetchApprovals(); // Refresh
            }
        } catch (error) {
            console.error("Failed to reject withdrawal", error);
        }
    };

    // Settings Actions
    const updateSettings = (newSettings) => {
        setSettings({ ...settings, ...newSettings });
    };

    const value = {
        users,
        franchises,
        kycRequests,
        withdrawalRequests,
        settings,
        blockUser,
        unblockUser,
        deleteUser,
        addUser,
        updateUser,
        addFranchise,
        updateFranchise,
        deleteFranchise,
        approveKyc,
        rejectKyc,
        approveWithdrawal,
        rejectWithdrawal,
        updateSettings,
        fetchUsers,
        fetchFranchises,
        fetchApprovals
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};
