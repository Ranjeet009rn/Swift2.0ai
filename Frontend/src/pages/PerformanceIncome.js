import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Download, TrendingUp } from 'lucide-react';

const PerformanceIncome = () => {
    const [incomeData, setIncomeData] = useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/income_performance.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setIncomeData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch performance income", error);
            }
        };
        fetchData();
    }, []);

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Performance Bonus</h1>
                    <p className="text-gray-500 text-sm mt-1">Rewards for achieving monthly business targets</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <p className="text-amber-100 text-sm font-medium">Total Performance Bonus</p>
                        <h2 className="text-3xl font-bold mt-1">
                            ₹ {incomeData.reduce((acc, curr) => acc + parseFloat(curr.bonus || 0), 0).toLocaleString()}
                        </h2>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-end mb-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors">
                            <Download size={18} /> Export
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Month</th>
                                    <th className="px-6 py-4">Personal Business</th>
                                    <th className="px-6 py-4">Group Business</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Bonus Amount</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {incomeData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.month}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">₹ {item.personalBusiness.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">₹ {item.groupBusiness.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.levelAchieved === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {item.levelAchieved}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">+ ₹ {item.bonus.toLocaleString()}</td>
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

export default PerformanceIncome;
