import React from 'react';
import Layout from '../../components/Layout';
import { Search, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react';

import apiService from '../../services/apiService';

const Transactions = () => {
    // Mock Transactions
    const [transactions, setTransactions] = React.useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiService.getAdminTransactions();
                if (response.success) {
                    setTransactions(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch transactions", error);
            }
        };
        fetchData();
    }, []);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                        <p className="text-gray-500 text-sm mt-1">Global financial activity log</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 shadow-sm">
                        <Download size={18} /> Export CSV
                    </button>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search transaction ID or user..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>All Types</option>
                            <option>Credit</option>
                            <option>Debit</option>
                        </select>
                        <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>All Status</option>
                            <option>Success</option>
                            <option>Processing</option>
                            <option>Failed</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-600 font-bold">{txn.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{txn.user}</td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1 text-xs font-bold ${txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {txn.type === 'Credit' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                {txn.type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{txn.category}</td>
                                        <td className={`px-6 py-4 font-bold ${txn.type === 'Credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {txn.type === 'Credit' ? '+' : '-'} ₹{txn.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{txn.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${txn.status === 'Success' ? 'bg-green-50 text-green-700' :
                                                txn.status === 'Processing' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                {txn.status}
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

export default Transactions;
