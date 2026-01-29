import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Download, DollarSign } from 'lucide-react';

const DirectFranchiseIncome = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const [incomeData, setIncomeData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/income_direct.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setIncomeData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch direct income", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalIncome = incomeData.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Direct Income</h1>
                    <p className="text-gray-500 text-sm mt-1">Earnings from your direct referrals</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                            <span className="bg-white/20 text-xs py-1 px-2 rounded-lg">+12% this week</span>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium">Total Direct Income</p>
                        <h2 className="text-3xl font-bold mt-1">₹ {totalIncome.toLocaleString()}</h2>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search User..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors">
                            <Download size={18} /> Export
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">From User</th>
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {incomeData.filter(i => i.fromUser.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.fromUser}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">{item.package}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">+ ₹ {item.amount}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DirectFranchiseIncome;
