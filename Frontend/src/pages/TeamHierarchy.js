import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Users, TrendingUp, UserPlus, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';

// Helper to find a node in the tree recursively
const findNodeById = (node, id) => {
    if (!node) return null;
    if (String(node.id) === String(id)) return node;
    if (node.children) {
        for (let child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
};

const TeamHierarchy = () => {
    const [fullTree, setFullTree] = useState(null);
    const [selectedPath, setSelectedPath] = useState([]); // Array of selected user objects
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTree = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/tree.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.tree) {
                    setFullTree(data.tree);
                }
            } catch (error) {
                console.error("Failed to fetch team hierarchy", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, []);

    const handleUserClick = (user) => {
        // Only if user has children (referrals)
        if (user.children && user.children.length > 0) {
            setSelectedPath([...selectedPath, user]);
        }
    };

    const handleBackClick = (index) => {
        setSelectedPath(selectedPath.slice(0, index + 1));
    };

    const getCurrentView = () => {
        if (!fullTree) return [];

        if (selectedPath.length === 0) {
            // Show immediate downline of root (Level 1)
            return fullTree.children || [];
        } else {
            // Show children of the last selected user
            const lastUser = selectedPath[selectedPath.length - 1];
            // Since selectedPath stores the actual node objects, we can just return their children
            // However, to be safe and ensure we have the latest structure if we were re-fetching (not the case here but good practice),
            // implies we assume the nodes in path are valid.
            return lastUser.children || [];
        }
    };

    // Helper to map DB fields to UI expected fields if needed, 
    // or we just update JSX to use DB fields.
    // DB fields: id, name, referral_code, children, left_count, right_count (maybe earnings not in tree API yet)
    // We will use placeholders for missing stats like earnings.

    const getPackageColor = (packageName) => {
        const colors = {
            'Gold': 'from-amber-400 to-yellow-500',
            'Silver': 'from-gray-300 to-gray-400',
            'Platinum': 'from-purple-400 to-violet-500',
            'Starter': 'from-blue-400 to-indigo-500'
        };
        return colors[packageName] || 'from-gray-400 to-gray-500';
    };

    const currentView = getCurrentView();

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Team Hierarchy</h1>
                        <p className="text-gray-600 mt-1">
                            {selectedPath.length === 0
                                ? 'View your team heads and their networks'
                                : `Viewing ${selectedPath[selectedPath.length - 1].name}'s referrals`}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Users size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium mb-2">Total Team</p>
                        <h2 className="text-4xl font-bold">{(fullTree?.left_count || 0) + (fullTree?.right_count || 0)}</h2>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <TrendingUp size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium mb-2">Total Earnings</p>
                        <h2 className="text-4xl font-bold">₹ {fullTree?.total_earnings?.toLocaleString() || '0'}</h2>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <UserPlus size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium mb-2">Direct Referrals</p>
                        <h2 className="text-4xl font-bold">{fullTree?.children?.length || 0}</h2>
                    </div>
                </div>

                {/* Breadcrumb Navigation */}
                {selectedPath.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 flex-wrap">
                            <button
                                onClick={() => setSelectedPath([])}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                <span>Team Heads</span>
                            </button>
                            {selectedPath.map((user, index) => (
                                <React.Fragment key={user.id}>
                                    <ChevronRight size={16} className="text-gray-400" />
                                    <button
                                        onClick={() => handleBackClick(index)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${index === selectedPath.length - 1
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {user.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Team Members Grid */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                        {selectedPath.length === 0 ? 'Team Heads' : 'Team Members'}
                    </h2>

                    {currentView.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentView.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => handleUserClick(member)}
                                    className="group relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                                >
                                    {/* Package Badge */}
                                    <div className={`absolute top-3 right-3 px-3 py-1 bg-gradient-to-r ${getPackageColor(member.package || 'Starter')} text-white text-xs font-bold rounded-full shadow-sm`}>
                                        {member.package || 'Starter'}
                                    </div>

                                    {/* User Avatar */}
                                    <div className="flex items-start space-x-4 mb-4">
                                        <div className={`w-16 h-16 bg-gradient-to-br ${getPackageColor(member.package || 'Starter')} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md`}>
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                                            <p className="text-sm text-gray-500">@{member.referral_code}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Earnings</span>
                                            <span className="font-bold text-gray-900">₹ {member.earnings?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Referrals</span>
                                            <span className="font-bold text-gray-900">{member.children?.length || 0}</span>
                                        </div>

                                        {/* Status Badge */}
                                        {member.is_team_leader && (
                                            <div className="flex justify-start">
                                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                                    Team Leader
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* View Details Button */}
                                    {member.children?.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-blue-600 group-hover:text-blue-700">
                                                <span className="text-sm font-semibold">View Downline</span>
                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    )}

                                    {(!member.children || member.children.length === 0) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="text-center text-xs text-gray-400 font-medium">
                                                No direct referrals
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No team members found</p>
                            <p className="text-sm text-gray-400 mt-1">This member hasn't referred anyone yet</p>
                        </div>
                    )}
                </div>

                {/* Background Members (Previous selections) */}
                {selectedPath.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center space-x-2">
                            <ChevronDown size={20} />
                            <span>Navigation Path</span>
                        </h3>
                        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                            {selectedPath.map((user, index) => (
                                <div
                                    key={user.id}
                                    onClick={() => handleBackClick(index)}
                                    className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 bg-gradient-to-br ${getPackageColor(user.package)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.referrals} referrals</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TeamHierarchy;
