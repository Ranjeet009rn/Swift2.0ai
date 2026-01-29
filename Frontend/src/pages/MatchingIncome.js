import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Download, GitMerge } from 'lucide-react';

const MatchingIncome = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const [incomeData, setIncomeData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/income_matching.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setIncomeData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch matching income", error);
            }
        };
        fetchData();
    }, []);

    const totalPayout = incomeData.reduce((acc, curr) => acc + parseFloat(curr.payout || 0), 0);

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Matching Income</h1>
                    <p className="text-gray-500 text-sm mt-1">Binary matching bonuses from your team</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <GitMerge size={24} />
                            </div>
                        </div>
                        <p className="text-pink-100 text-sm font-medium">Total Matching Bonus</p>
                        <h2 className="text-3xl font-bold mt-1">₹ {totalPayout.toLocaleString()}</h2>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Date..."
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
                                    <th className="px-6 py-4">Left Business</th>
                                    <th className="px-6 py-4">Right Business</th>
                                    <th className="px-6 py-4">Matched</th>
                                    <th className="px-6 py-4">Payout (10%)</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {incomeData.filter(item => item.date.includes(searchTerm)).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                        <td className="px-6 py-4 font-medium text-gray-700">₹ {item.leftBusiness.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-700">₹ {item.rightBusiness.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-indigo-600">₹ {item.matchingAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-green-600">+ ₹ {item.payout.toLocaleString()}</td>
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
                    {incomeData.length === 0 && <div className="p-8 text-center text-gray-400">No matching income records yet.</div>}
                </div>
            </div>
        </Layout>
    );
};

export default MatchingIncome;
