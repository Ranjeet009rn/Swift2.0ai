import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import apiService from '../../services/apiService';
import { History, ArrowUpRight, ArrowDownLeft, Search, Download } from 'lucide-react';

const Stock = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [inventory, setInventory] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await apiService.getFranchiseInventory();
                if (response.success) {
                    // Transform inventory data
                    // Note: Backend might send flat list, we need to adapt if needed. 
                    // Assuming backend sends { inventory: [], history: [] }

                    const mappedInventory = response.inventory.map((item, index) => ({
                        id: item.id || index,
                        package: item.package_name,
                        total: item.total_purchased,
                        issued: item.total_issued,
                        balance: item.quantity,
                        price: item.price,
                        color: ['blue', 'indigo', 'orange', 'purple'][index % 4]
                    }));

                    const mappedHistory = response.history.map((h, index) => ({
                        id: h.id,
                        date: new Date(h.created_at).toLocaleDateString(),
                        type: h.transaction_type.charAt(0).toUpperCase() + h.transaction_type.slice(1),
                        package: h.item_name,
                        qty: h.quantity,
                        recipient: h.recipient_name || h.recipient_user_id || 'Self',
                        status: h.status.charAt(0).toUpperCase() + h.status.slice(1)
                    }));

                    setInventory(mappedInventory);
                    setHistory(mappedHistory);
                }
            } catch (error) {
                console.error("Failed to fetch inventory", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </Layout>
        );
    }

    const filteredHistory = history.filter(h =>
        h.package.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 text-left">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">My Inventory</h1>
                        <p className="text-gray-500 mt-2">Manage your current stock levels and view transaction history.</p>
                    </div>
                </div>

                {/* Stock Summary Grid */}
                {inventory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {inventory.map((item) => (
                            <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br transition-opacity duration-500 opacity-5 group-hover:opacity-10 rounded-bl-full ${item.color === 'blue' ? 'from-blue-600 to-indigo-600' :
                                    item.color === 'indigo' ? 'from-indigo-600 to-purple-600' :
                                        item.color === 'orange' ? 'from-orange-600 to-red-600' : 'from-purple-600 to-pink-600'
                                    }`} />
                                <div className="relative">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{item.package} STOCK</p>
                                    <h2 className="text-3xl font-black text-gray-900 mb-1">{item.balance} <span className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-1">Units</span></h2>
                                    <p className="text-xs font-bold text-gray-500 mb-6">Valued at ₹ {(item.balance * item.price).toLocaleString()}</p>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Purchased</p>
                                            <p className="text-sm font-black text-gray-800">{item.total}</p>
                                        </div>
                                        <div className="border-l border-gray-50 pl-4">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Issued</p>
                                            <p className="text-sm font-black text-orange-600">{item.issued}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-3xl text-center text-gray-500">
                        No inventory data available.
                    </div>
                )}

                {/* History Section */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 italic tracking-tight">
                            <History className="text-orange-500" size={20} />
                            MOVEMENT LOG
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search History..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-100 transition-all"><Download size={18} /></button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-4 text-left">Date</th>
                                    <th className="px-8 py-4 text-left">Action Type</th>
                                    <th className="px-8 py-4 text-left">Item / Package</th>
                                    <th className="px-8 py-4 text-center">Quantity</th>
                                    <th className="px-8 py-4 text-left">Reference</th>
                                    <th className="px-8 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-8 py-5 text-sm font-bold text-gray-500">{log.date}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${log.type === 'Purchase' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {log.type === 'Purchase' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                    </div>
                                                    <span className="text-sm font-black text-gray-900 tracking-tight underline decoration-orange-100 underline-offset-4">{log.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-gray-700">{log.package}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`text-sm font-black ${log.type === 'Purchase' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {log.type === 'Purchase' ? '+' : '-'}{log.qty}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-mono text-gray-400">{log.recipient}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${log.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'Sent' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-8 text-center text-gray-500">No transactions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 text-center text-gray-300 font-bold uppercase text-xs tracking-widest border-t border-gray-50">
                        {filteredHistory.length} Transactions Found
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Stock;
