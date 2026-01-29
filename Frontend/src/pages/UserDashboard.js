import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import apiService from '../services/apiService';
import { TrendingUp, ArrowUpRight, DollarSign, Target, Package, GitBranch } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                <p className="font-semibold text-gray-900 mb-3 text-sm">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs font-medium" style={{ color: entry.stroke }}>
                            {entry.name}: {entry.value?.toLocaleString('en-IN')}
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const UserDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('30days');

    useEffect(() => {
        const fetchData = async () => {
            // Check if we have a valid auth token before making the request
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('No auth token found, skipping dashboard fetch');
                setLoading(false);
                return;
            }

            try {
                const dashboardData = await apiService.getDashboard();
                if (dashboardData.success) {
                    setStats(dashboardData);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    // Default or Real Data
    const walletBalance = stats?.wallet_balance || 0;
    const totalEarnings = stats?.total_earnings || 0;
    const teamSize = stats?.team_size || 0;

    // Process Earnings for Chart (Mocking chart history if not present in API yet, or use empty)
    // The backend dashboard.php returns 'recent_earnings' array.
    // We can map that effectively or fallback to empty array to avoid confusion.
    // User requested "show only db tables data".

    const recentEarnings = stats?.recent_earnings || [];
    const chartData = recentEarnings.map(e => ({
        date: new Date(e.created_at).toLocaleDateString(),
        amount: parseFloat(e.amount),
        type: e.source_type
    }));

    // Grouping by type for Pie Chart
    const pieMap = {};
    recentEarnings.forEach(e => {
        pieMap[e.source_type] = (pieMap[e.source_type] || 0) + parseFloat(e.amount);
    });

    const pieData = Object.keys(pieMap).map(key => ({
        name: key,
        value: pieMap[key]
    }));

    // If no data, show empty state or placeholder structure to prevent crash
    if (pieData.length === 0) {
        pieData.push({ name: 'No Data', value: 1 });
    }

    const COLORS = ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6'];

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">User Dashboard</h1>
                        <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg">Welcome back! Here's your performance summary</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                            <p className="text-xs text-gray-600 font-medium">Last Updated</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* E-Pin System Card */}
                    <div
                        onClick={() => navigate('/epin/unused')}
                        className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-300 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400/10 to-violet-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/30">
                                        <Package size={20} className="text-white sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Wallet</h3>
                                        <p className="text-xs text-gray-500">Available Balance</p>
                                    </div>
                                </div>
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <ArrowUpRight className="text-purple-600" size={18} />
                                </div>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">₹ {parseFloat(walletBalance).toLocaleString('en-IN')}</h2>
                        </div>
                    </div>

                    {/* Team / Network Card */}
                    <div className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 cursor-pointer hover:shadow-2xl hover:border-pink-200 transition-all duration-300" onClick={() => navigate('/team')}>
                        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-pink-400/10 to-rose-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div className="p-3 sm:p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/30">
                                    <GitBranch size={24} className="text-white sm:w-7 sm:h-7" />
                                </div>
                                <div className="p-2 bg-pink-50 rounded-lg">
                                    <ArrowUpRight className="text-pink-600" size={18} />
                                </div>
                            </div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm font-medium">Team Size</p>
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{teamSize}</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Income Card */}
                    <div className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 cursor-pointer hover:shadow-2xl hover:border-blue-200 transition-all duration-300" onClick={() => navigate('/earnings')}>
                        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                    <DollarSign size={24} className="text-white sm:w-7 sm:h-7" />
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <ArrowUpRight className="text-blue-600" size={18} />
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-2">Total Earnings</p>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">₹ {parseFloat(totalEarnings).toLocaleString('en-IN')}</h2>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                        {/* ... Chart Header ... */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Earnings Overview</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Track your income performance</p>
                            </div>
                            <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setTimePeriod('today')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === 'today'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setTimePeriod('week')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === 'week'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setTimePeriod('30days')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === '30days'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    30 Days
                                </button>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }} />
                                <Line type="monotone" dataKey="direct_income" stroke="#fbbf24" strokeWidth={2} name="Direct Income" dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="sponsor_income" stroke="#f59e0b" strokeWidth={2} name="Sponsor Income" dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="recharge_income" stroke="#3b82f6" strokeWidth={2} name="Recharge Income" dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="rewards" stroke="#8b5cf6" strokeWidth={2} name="Rewards" dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Income Breakdown</h3>
                                <p className="text-gray-500 text-sm mt-1">Source analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹ ${value.toLocaleString('en-IN')}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {pieData.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <div>
                                        <p className="text-xs text-gray-600">{item.name}</p>
                                        <p className="font-semibold text-gray-800 text-xs">₹ {item.value.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Side Bar Modules Alignment (Downline & Payouts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Downline Activity */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Active Downline</h3>
                                <p className="text-gray-500 text-sm mt-1">Recent member activations</p>
                            </div>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {stats?.recent_downline && stats.recent_downline.length > 0 ? (
                                stats.recent_downline.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{member.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-green-600">Level {member.level} • {member.status}</p>
                                                    {member.is_team_leader && (
                                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                                            Team Leader
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(member.activation_date).toLocaleDateString()}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                            )}
                        </div>
                        <button onClick={() => navigate('/downline/activated')} className="w-full mt-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-colors">
                            View All Downlines
                        </button>
                    </div>

                    {/* Recent Payouts */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Recent Payouts</h3>
                                <p className="text-gray-500 text-sm mt-1">Bank transfer status</p>
                            </div>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <Target size={20} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {stats?.recent_withdrawals && stats.recent_withdrawals.length > 0 ? (
                                stats.recent_withdrawals.map((payout, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">₹ {parseFloat(payout.amount).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{payout.method} • {payout.status}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${payout.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {payout.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No recent payouts</p>
                            )}
                        </div>
                        <button onClick={() => navigate('/bank')} className="w-full mt-4 py-2 text-sm text-green-600 font-semibold hover:bg-green-50 rounded-lg transition-colors">
                            View Payment History
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};


export default UserDashboard;
