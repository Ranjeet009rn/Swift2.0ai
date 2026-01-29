import React, { useState } from 'react';
import Layout from '../../components/Layout';
import apiService from '../../services/apiService';
import { useAdmin } from '../../context/AdminContext';
import { useAlert } from '../../context/AlertContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
    Search,
    Filter,
    Shield,
    UserCheck,
    UserX,
    Download,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Lock,
    X
} from 'lucide-react';

import useLockBodyScroll from '../../utils/useLockBodyScroll';

const UserModal = ({ isOpen, onClose, mode, user, onSave }) => {
    useLockBodyScroll(isOpen);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Distributor',
        rank: 'None',
        status: 'Active'
    });

    React.useEffect(() => {
        if (user && mode === 'edit') {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'Distributor',
                rank: user.rank || 'None',
                status: user.status || 'Active'
            });
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'Distributor',
                rank: 'None',
                status: 'Active'
            });
        }
    }, [user, mode]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 opacity-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">
                        {mode === 'add' ? 'Add New User' : 'Edit User'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter email address"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="Distributor">Distributor</option>
                                <option value="Franchise">Franchise</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.rank}
                                onChange={e => setFormData({ ...formData, rank: e.target.value })}
                            >
                                <option value="None">None</option>
                                <option value="Bronze">Bronze</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Diamond">Diamond</option>
                                <option value="Platinum">Platinum</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                        >
                            {mode === 'add' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewUserModal = ({ isOpen, onClose, user }) => {
    useLockBodyScroll(isOpen);
    if (!isOpen || !user) return null;

    const sections = [
        { label: 'Personal Info', icon: UserCheck, fields: ['name', 'email', 'mobile', 'date_of_birth', 'pan_number'] },
        { label: 'Address', icon: UserCheck, fields: ['full_address', 'city', 'state', 'country', 'pin_code'] },
        { label: 'Network', icon: Shield, fields: ['member_id', 'username', 'created_at', 'sponsor_id', 'sponsor_name', 'upline_id', 'role', 'rank', 'status', 'selected_package', 'position'] },
        { label: 'Bank Details', icon: Shield, fields: ['bank_name', 'account_number', 'ifsc_code', 'branch_name', 'account_holder_name', 'account_type'] },
        { label: 'Nominee', icon: UserCheck, fields: ['nominee_name', 'nominee_relation'] }
    ];

    const formatLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200 shadow-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{section.label}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {section.fields.map(field => (
                                    <div key={field}>
                                        <p className="text-xs text-gray-400 font-medium mb-1">{formatLabel(field)}</p>
                                        <p className="text-sm font-semibold text-gray-900 break-words">
                                            {field === 'created_at' && user[field] ? new Date(user[field]).toLocaleString() : (user[field] || <span className="text-gray-300 italic">Not set</span>)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-lg">
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const Users = () => {
    const { users, blockUser, unblockUser, deleteUser, addUser, updateUser } = useAdmin();
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);

    // View Modal State
    const [viewUser, setViewUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const handleViewDetails = async (userId) => {
        try {
            const response = await apiService.getAdminUserDetails(userId);
            if (response.success) {
                setViewUser(response.data);
                setIsViewModalOpen(true);
            } else {
                showAlert(response.message || 'Failed to fetch user details', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Failed to fetch user details', 'error');
        }
    };

    const handleAddUser = () => {
        setModalMode('add');
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleSaveUser = (data) => {
        if (modalMode === 'add') {
            addUser(data);
            showAlert('User created successfully', 'success');
        } else {
            updateUser(selectedUser.id, data);
            showAlert('User updated successfully', 'success');
        }
        setIsModalOpen(false);
    };

    const getStatusColor = (status) => {
        const s = status ? status.toLowerCase() : '';
        switch (s) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
            case 'banned': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleBlock = async (userId) => {
        const confirmed = await showConfirm(
            'Block User',
            'Are you sure you want to block this user? They will not be able to access their account.',
            'danger'
        );
        if (confirmed) {
            blockUser(userId);
            showAlert('User blocked successfully', 'success');
        }
    };

    const handleUnblock = async (userId) => {
        const confirmed = await showConfirm(
            'Unblock User',
            'Do you want to unblock this user? They will regain access to their account.',
            'success'
        );
        if (confirmed) {
            unblockUser(userId);
            showAlert('User unblocked successfully', 'success');
        }
    };

    const handleDelete = async (userId) => {
        const confirmed = await showConfirm(
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone and all user data will be permanently removed.',
            'danger'
        );
        if (confirmed) {
            deleteUser(userId);
            showAlert('User deleted successfully', 'success');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || user.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const activeCount = users.filter(u => u.status.toLowerCase() === 'active').length;
    const blockedCount = users.filter(u => u.status.toLowerCase() === 'blocked').length;
    const inactiveCount = users.filter(u => ['inactive', 'pending'].includes(u.status.toLowerCase())).length;

    return (
        <Layout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500 text-sm mt-1">View, manage and monitor all registered users</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 shadow-sm transition-all">
                            <Download size={18} /> Export
                        </button>
                        <button
                            onClick={handleAddUser}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                        >
                            <Shield size={18} /> Add User
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Users</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{users.length}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Shield size={20} />
                            </div>
                        </div>
                        <p className="text-green-600 text-xs font-medium mt-3 flex items-center gap-1">
                            <CheckCircle size={12} /> +125 this week
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</h3>
                            </div>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <UserCheck size={20} />
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(activeCount / users.length) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Inactive</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{inactiveCount}</h3>
                            </div>
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                                <UserX size={20} />
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                            <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: `${(inactiveCount / users.length) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Blocked</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{blockedCount}</h3>
                            </div>
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <XCircle size={20} />
                            </div>
                        </div>
                        <p className="text-red-500 text-xs font-medium mt-3 flex items-center gap-1">
                            Requires Attention
                        </p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4 items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Pending">Pending</option>
                        </select>
                        <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Rank</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Join Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700 font-medium">{user.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.rank !== 'None' && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 w-fit border border-orange-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                                    <span className="text-xs font-bold text-orange-700">{user.rank}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.joinDate}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(user.id)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Edit User">
                                                    <Edit size={18} />
                                                </button>
                                                {['Blocked', 'Banned', 'blocked', 'banned'].includes(user.status) ? (
                                                    <button
                                                        onClick={() => handleUnblock(user.id)}
                                                        className="p-1 px-2 text-red-500 font-bold text-xs border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                                                        title="Unblock User"
                                                    >
                                                        UNBLOCK
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBlock(user.id)}
                                                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="Block User"
                                                    >
                                                        <Lock size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>No users found matching your search.</p>
                        </div>
                    )}
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                        <span>Showing {filteredUsers.length} of {users.length} users</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                user={selectedUser}
                onSave={handleSaveUser}
            />

            {/* View Modal */}
            <ViewUserModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                user={viewUser}
            />
        </Layout>
    );
};

export default Users;
