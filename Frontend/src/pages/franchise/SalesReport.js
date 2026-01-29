import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { BarChart3, ArrowUpRight, Download } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

const SalesReport = () => {
    const [timeRange, setTimeRange] = useState('Month');

    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [hubs, setHubs] = useState([]);

    useEffect(() => {
        fetchSalesAnalytics();
    }, [timeRange]);

    const fetchSalesAnalytics = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost/mlm/backend/api/franchise/sales_report.php?range=${timeRange}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setStats(data.data.stats || []);
                setChartData(data.data.chart || []);
                setHubs(data.data.hubs || []);
            }
        } catch (error) {
            console.error('Error fetching sales analytics:', error);
        }
    };

    return (
        <Layout>
            <div className="space-y-10 pb-32">
                {/* Header with Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-left w-full">
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">Sales Analytics</h1>
                        <p className="text-gray-500 mt-2">Deep dive into your franchise network performance and revenue trends.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto">
                        {['Day', 'Week', 'Month', 'Year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((item, i) => (
                        <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform ${item.color === 'orange' ? 'bg-orange-600 shadow-orange-600/20' :
                                    item.color === 'blue' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-purple-600 shadow-purple-600/20'
                                    } text-white`}>
                                    <item.icon size={24} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-black ${item.growth?.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                    {item.growth} <ArrowUpRight size={14} className={item.growth?.startsWith('-') ? 'rotate-90' : ''} />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{item.value}</h2>
                        </div>
                    ))}
                </div>

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Area Chart */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <BarChart3 className="text-orange-500" size={20} />
                                REVENUE TRAJECTORY
                            </h3>
                            <button className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 transition-all"><Download size={18} /></button>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `₹${v / 1000000}M`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                                        itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Performance Table / List */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                        <h3 className="text-xl font-black text-gray-900 mb-8 relative z-10">TOP PERFORMING HUBS</h3>

                        <div className="space-y-6 relative z-10">
                            {hubs.map((hub, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors`}>{i + 1}</div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{hub.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Level 2</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-gray-900 text-sm">{hub.sales}</p>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-12 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-gray-200">
                            Download Hub Report
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesReport;
