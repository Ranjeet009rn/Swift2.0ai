import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import apiService from '../services/apiService';
import {
    Package,
    DollarSign,
    BarChart3,

    CreditCard,
    ArrowUpRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
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

const FranchiseDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('week');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiService.getFranchiseDashboard();
                if (response.success) {
                    setStats(response);
                }
            } catch (error) {
                console.error("Failed to fetch franchise data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Derived Data
    const walletBalance = stats?.wallet_balance || 0;
    const stockValue = stats?.stock_value || 0;
    const franchiseType = stats?.franchise_type || 'N/A';

    // Mock charts for now as DB might be empty, but variables are ready
    const chartData = [];

    const pieData = [
        { name: 'Stock Value', value: stockValue > 0 ? stockValue : 1 },
        // Add more if API returns breakdowns
    ];

    const COLORS = ['#ef4444', '#10b981', '#3b82f6'];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-900 to-gray-900 bg-clip-text text-transparent">
                            Franchise Dashboard
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg">
                            Manage inventory and track sales performance
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center gap-2">
                            <Package size={16} /> Stock Status: Good
                        </button>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Wallet Balance - White Theme */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-blue-50 p-3.5 rounded-full">
                                <CreditCard className="text-blue-600" size={28} strokeWidth={2} />
                            </div>
                            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                <ArrowUpRight size={14} className="mr-1" /> Active
                            </span>
                        </div>
                        <div>
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Wallet Balance</h3>
                            <h2 className="text-3xl font-bold text-gray-900">₹{walletBalance.toLocaleString('en-IN')}</h2>
                        </div>
                    </div>

                    {/* Stock Value - White Theme */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-purple-50 p-3.5 rounded-full">
                                <Package className="text-purple-600" size={28} strokeWidth={2} />
                            </div>
                            <span className="flex items-center text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                {franchiseType}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Stock Value</h3>
                            <h2 className="text-3xl font-bold text-gray-900">₹{stockValue.toLocaleString('en-IN')}</h2>
                        </div>
                    </div>

                    {/* Total Sales - White Theme */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-green-50 p-3.5 rounded-full">
                                <DollarSign className="text-green-600" size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Total Sales</h3>
                            <h2 className="text-3xl font-bold text-gray-900">₹{(stats?.total_sales || 0).toLocaleString('en-IN')}</h2>
                        </div>
                    </div>

                    {/* Total Commission - White Theme */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-orange-50 p-3.5 rounded-full">
                                <BarChart3 className="text-orange-500" size={28} strokeWidth={2} />
                            </div>
                            <div className="text-right">
                                <p className="text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg inline-block">+0%</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Total Commission</h3>
                            <h2 className="text-3xl font-bold text-gray-900">₹{(stats?.total_commission || 0).toLocaleString('en-IN')}</h2>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Overview Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Sales Overview</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Sales Volume vs Commission</p>
                            </div>
                            <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                {['Week', 'Month', 'Year'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setTimePeriod(period.toLowerCase())}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === period.toLowerCase()
                                            ? 'bg-white text-orange-600 shadow-sm'
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
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area type="monotone" dataKey="sales" stroke="#f97316" fillOpacity={1} fill="url(#colorSales)" name="Sales Vol." />
                                    <Area type="monotone" dataKey="commission" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCommission)" name="Commission" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stock Distribution Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">E-Pin Stock</h3>
                            <p className="text-gray-500 text-xs mt-0.5">Inventory Distribution</p>
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
                                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Transfers Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Recent Transfers</h3>
                            <p className="text-sm text-gray-500">History of E-Pin distribution</p>
                        </div>
                        <button className="text-orange-600 text-sm font-semibold hover:text-orange-700" onClick={() => navigate('/franchise/transactions')}>
                            View All History
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Recipient</th>
                                    <th className="px-6 py-4 font-semibold">Package</th>
                                    <th className="px-6 py-4 font-semibold">Quantity</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats?.recent_transfers && stats.recent_transfers.length > 0 ? (
                                    stats.recent_transfers.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                                        {item.recipient_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{item.recipient_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500">ID: {item.recipient_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold border border-gray-200">
                                                    {item.package}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-orange-600">₹ {parseFloat(item.amount).toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500 text-sm">No recent transfers</td>
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

export default FranchiseDashboard;
