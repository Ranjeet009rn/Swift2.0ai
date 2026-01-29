import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAdmin } from '../../context/AdminContext';
import { useAlert } from '../../context/AlertContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
    Search,
    Unlock,
    AlertTriangle,
    ShieldOff
} from 'lucide-react';

const BlockedUsers = () => {
    const { users, unblockUser } = useAdmin();
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');

    const blockedUsers = users.filter(user => ['blocked', 'banned'].includes(user.status.toLowerCase()));

    const handleUnblock = async (userId) => {
        const confirmed = await showConfirm(
            'Unblock User',
            'Are you sure you want to unblock this user? They will regain full access to their account.',
            'success'
        );
        if (confirmed) {
            unblockUser(userId);
            showAlert('User unblocked successfully', 'success');
        }
    };

    const filteredUsers = blockedUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Blocked Users</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage restricted accounts and security violations</p>
                    </div>
                </div>

                {/* Alert Banner */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <ShieldOff size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-800">Security Notice</h4>
                        <p className="text-sm text-red-600 mt-1">Blocked users cannot login or perform any transactions. Unblocking a user will restore their full access immediately.</p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search blocked users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Blocked Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Reason</th>
                                    <th className="px-6 py-4 font-semibold">Blocked Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-red-50/10 transition">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit border border-red-100">
                                                <AlertTriangle size={14} />
                                                <span className="text-xs font-semibold">{user.blockReason || 'Admin Action'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{user.joinDate}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleUnblock(user.id)}
                                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
                                                >
                                                    <Unlock size={16} /> Unblock
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
                            <p>No blocked users found.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default BlockedUsers;
