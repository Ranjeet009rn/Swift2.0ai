import React from 'react';
import Layout from '../../components/Layout';
import { } from 'lucide-react';

import apiService from '../../services/apiService';

const Transactions = () => {
    // Mock Transactions
    const [transactions, setTransactions] = React.useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Use franchise-specific API call (need to add to apiService)
                const response = await apiService.getFranchiseInventory(); // Re-using inventory endpoint for now which returns history
                if (response.success && response.history) {
                    // Map history to transaction format
                    const mapped = response.history.map(h => ({
                        id: h.id,
                        user: h.recipient_name || 'Self',
                        type: h.transaction_type,
                        category: h.item_name,
                        amount: h.amount,
                        date: new Date(h.created_at).toLocaleDateString(),
                        status: h.status
                    }));
                    setTransactions(mapped);
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
                        <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
                        <p className="text-gray-500 text-sm mt-1">Franchise financial activity log</p>
                    </div>
                    {/* Export button removed for now */}
                </div>

                {/* Filters kept same for now */}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">ID</th>
                                    <th className="px-6 py-4 font-semibold">Recipient/Source</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Item</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.length > 0 ? (
                                    transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-600 font-bold">#{txn.id}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{txn.user}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-xs font-bold capitalize">
                                                    {txn.type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{txn.category}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                ₹{parseFloat(txn.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">{txn.date}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 capitalize">
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No transactions found</td>
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

export default Transactions;
