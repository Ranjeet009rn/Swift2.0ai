import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Download, Store, MapPin } from 'lucide-react';

const FranchiseBonusIncome = () => {
    // Franchise earnings
    const [bonusData, setBonusData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/income_franchise.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setBonusData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch franchise bonus", error);
            }
        };
        fetchData();
    }, []);

    const totalBonus = bonusData.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Franchise Bonus</h1>
                    <p className="text-gray-500 text-sm mt-1">Overrides and commissions from franchise network</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Store size={24} />
                            </div>
                        </div>
                        <p className="text-cyan-100 text-sm font-medium">Total Franchise Bonus</p>
                        <h2 className="text-3xl font-bold mt-1">₹ {totalBonus.toLocaleString()}</h2>
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
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Franchise</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bonusData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span className="font-medium text-gray-900">{item.franchiseName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.type}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.details}</td>
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
                    {bonusData.length === 0 && <div className="p-8 text-center text-gray-400">No franchise bonuses yet.</div>}
                </div>
            </div>
        </Layout>
    );
};

export default FranchiseBonusIncome;
