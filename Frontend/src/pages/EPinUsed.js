import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Package } from 'lucide-react';

const EPinUsed = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const [usedPins, setUsedPins] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/epins_used.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setUsedPins(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch used epins", error);
            }
        };
        fetchData();
    }, []);

    const filteredPins = usedPins.filter(p =>
        p.pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.usedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Used E-Pins</h1>
                        <p className="text-gray-500 text-sm mt-1">History of activated keys</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm border border-indigo-100">
                        Total Value Used: ₹ {usedPins.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search PIN, Name or User ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">E-Pin Code</th>
                                    <th className="px-6 py-4">Package Details</th>
                                    <th className="px-6 py-4">Used By</th>
                                    <th className="px-6 py-4">Activation Date</th>
                                    <th className="px-6 py-4 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPins.map((pin) => (
                                    <tr key={pin.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <code className="font-mono font-bold text-gray-800">{pin.pin}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package size={16} className="text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700">{pin.package}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                    {pin.usedBy.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{pin.usedBy}</p>
                                                    <p className="text-xs text-gray-500">{pin.userId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pin.usedDate}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">₹ {pin.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredPins.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No records found.</div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default EPinUsed;
