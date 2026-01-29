import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
    Users,
    DollarSign,
    Activity,
    ArrowUpRight,
    Shield,
    FileText
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                <p className="font-semibold text-gray-900 mb-3 text-sm">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString('en-IN')}
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('week');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/admin/dashboard.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Derived Variables
    const totalUsers = stats?.total_users || 0;
    const totalRevenue = stats?.total_revenue || 0;
    const pendingWithdrawals = stats?.pending_withdrawals || 0;
    const recentRegistrations = stats?.recent_registrations || [];
    const totalFranchises = stats?.total_franchises || 0;

    // Placeholder for charts until backend sends distinct history
    const chartData = [];

    // Status Pie Chart
    const pieData = [
        { name: 'Total Users', value: parseInt(totalUsers) || 0 },
        { name: 'Franchises', value: parseInt(totalFranchises) || 0 }
    ];

    const COLORS = ['#10b981', '#9ca3af', '#ef4444'];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg">
                            System overview and management controls
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center gap-2">
                            <Activity size={16} />
                            System Status: Online
                        </button>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Total Users Card */}
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-indigo-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
                                    <Users size={24} className="text-white" />
                                </div>
                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                    <ArrowUpRight size={14} className="mr-1" /> +12%
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Users</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</h2>
                        </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-green-200 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
                                    <DollarSign size={24} className="text-white" />
                                </div>
                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                    <ArrowUpRight size={14} className="mr-1" /> +8.5%
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Revenue</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">₹{parseFloat(totalRevenue).toLocaleString('en-IN')}</h2>
                        </div>
                    </div>

                    {/* Pending KYC Card */}
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 cursor-pointer" onClick={() => navigate('/admin/approvals')}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-amber-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30">
                                    <FileText size={24} className="text-white" />
                                </div>
                                <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                    Action Required
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Pending Withdrawals</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{pendingWithdrawals}</h2>
                        </div>
                    </div>

                    {/* Active Franchises Card */}
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30">
                                    <Shield size={24} className="text-white" />
                                </div>
                                <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    Active
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Franchises</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{totalFranchises}</h2>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Revenue Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Financial Overview</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Revenue vs Payouts</p>
                            </div>
                            <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                {['Week', 'Month', 'Year'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setTimePeriod(period.toLowerCase())}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === period.toLowerCase()
                                            ? 'bg-white text-purple-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                    <Area type="monotone" dataKey="payouts" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPayouts)" name="Payouts" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* User Distribution Pie Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">User Status</h3>
                            <p className="text-gray-500 text-xs mt-0.5">Active vs Inactive Base</p>
                        </div>
                        <div className="h-[250px] w-full flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {pieData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                                        <span className="text-sm text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Registrations Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Recent Registrations</h3>
                            <p className="text-sm text-gray-500">New joiners needing attention</p>
                        </div>
                        <button className="text-purple-600 text-sm font-semibold hover:text-purple-700">View All Users</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Package</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentRegistrations.length > 0 ? (
                                    recentRegistrations.map((user, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">ID: {user.user_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold border border-blue-100">
                                                    {user.package_name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.package_status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    <span className="text-sm font-medium text-gray-700 capitalize">{user.package_status || 'Inactive'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-gray-400 hover:text-purple-600 transition-colors">
                                                    <Activity size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No recent registrations found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
