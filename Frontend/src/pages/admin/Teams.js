import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Search, Network, ArrowLeft } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

// Import the tree components from UserTree
import UserTreeView from '../../components/UserTreeView';

const Teams = () => {
    const { users } = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [viewingTree, setViewingTree] = useState(false);

    // Initialize from URL query params
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userIdParam = params.get('user_id');

        if (userIdParam && users.length > 0 && !selectedUser) {
            const user = users.find(u => u.user_id === userIdParam || u.id === parseInt(userIdParam));
            if (user) {
                setSelectedUser(user);
                setViewingTree(true);
            }
        }
    }, [users, selectedUser]);

    // Filter users based on search - ONLY show users with role='user'
    const filteredUsers = users.filter(user =>
        user.role?.toLowerCase() === 'user' && (
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleViewUserTree = (user) => {
        setSelectedUser(user);
        setViewingTree(true);
        // Update URL without reloading
        const newUrl = `${window.location.pathname}?user_id=${user.user_id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleBackToList = () => {
        setViewingTree(false);
        setSelectedUser(null);
        // Reset URL
        const newUrl = window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    // If viewing a tree, show the tree component
    if (viewingTree && selectedUser) {
        return (
            <Layout>
                <div className="space-y-6">
                    {/* Back Button */}
                    <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        <span className="font-semibold text-gray-700">Back to Users List</span>
                    </button>

                    {/* User Info Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                                {selectedUser.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedUser.name}'s Network Tree</h2>
                                <p className="text-blue-100 mt-1">User ID: {selectedUser.user_id} • {selectedUser.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tree View */}
                    <UserTreeView user={selectedUser} />
                </div>
            </Layout>
        );
    }

    // Default view: Show list of users
    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Teams & Trees</h1>
                        <p className="text-gray-500 text-sm mt-1">View network trees for any user</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or user ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">User ID</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Join Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                    {user.avatar || user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{user.user_id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">{user.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' || user.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{user.joinDate}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewUserTree(user)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm font-semibold"
                                            >
                                                <Network size={16} />
                                                View Tree
                                            </button>
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
                </div>
            </div>
        </Layout>
    );
};

export default Teams;
