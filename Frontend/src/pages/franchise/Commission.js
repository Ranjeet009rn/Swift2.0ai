import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { DollarSign, Wallet, TrendingUp, Filter, Download, PieChart, Info } from 'lucide-react';

const Commission = () => {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({
        wallet_balance: 0,
        total_commission: 0,
        matching_bonus: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/franchise/commission.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setRecords(data.data.history || []);
                setStats(data.data.stats || {
                    wallet_balance: 0,
                    total_commission: 0,
                    matching_bonus: 0
                });
            }
        } catch (error) {
            console.error('Error fetching commissions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 pb-32">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 text-left">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">Earnings & Commissions</h1>
                        <p className="text-gray-500 mt-2">Track all your franchise referral and matching commission records.</p>
                    </div>
                </div>

                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Master Wallet Balance - White Theme */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                                <Wallet size={24} />
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Active</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Master Wallet Balance</p>
                            <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-4">₹ {parseFloat(stats.wallet_balance).toLocaleString()}</h2>
                            <button className="w-full py-3 bg-orange-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-200">
                                <Wallet size={14} /> Request Payout
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                                <TrendingUp size={24} />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">+18.4%</span>
                                <p className="text-[9px] font-bold text-gray-300 uppercase">Vs L.Month</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Commission Earned</p>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">₹ {parseFloat(stats.total_commission).toLocaleString()}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <PieChart size={24} />
                            </div>
                            <div className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-tighter text-gray-400">Current Rate: 5%</div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Matching Bonus</p>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">₹ {parseFloat(stats.matching_bonus).toLocaleString()}</h2>
                        </div>
                    </div>
                </div>

                {/* Detailed Records Table */}
                <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                            <DollarSign className="text-orange-500" size={20} />
                            COMMISSION LOG
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase text-gray-500 hover:bg-gray-50 transition-all"><Filter size={14} /> Filter</button>
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-gray-200"><Download size={14} /> Export</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-10 py-5 text-left">Date</th>
                                    <th className="px-10 py-5 text-left">Description / Member</th>
                                    <th className="px-10 py-5 text-left">Income Type</th>
                                    <th className="px-10 py-5 text-right font-black">Amount</th>
                                    <th className="px-10 py-5 text-center">Status</th>
                                    <th className="px-10 py-5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {records.length > 0 ? (
                                    records.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50/40 transition-colors group">
                                            <td className="px-10 py-6 text-sm font-bold text-gray-400">{row.date}</td>
                                            <td className="px-10 py-6">
                                                <p className="font-black text-gray-900 tracking-tight">{row.member}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Ref ID: {row.ref_id || 'N/A'}</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                    <span className="text-xs font-black text-gray-600 uppercase italic tracking-tighter">{row.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-gray-900 text-base">₹ {parseFloat(row.amount).toLocaleString()}</td>
                                            <td className="px-10 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${row.status === 'Released' ? 'bg-green-100 text-green-700 shadow-sm shadow-green-100' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-all"><Info size={16} /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500 text-sm">No records found</td>
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

export default Commission;
