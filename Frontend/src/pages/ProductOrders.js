import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Package, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const ProductOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.PRODUCT_ORDERS, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-md text-xs font-semibold"><CheckCircle size={14} /> Delivered</span>;
            case 'pending':
                return <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md text-xs font-semibold"><Clock size={14} /> Pending</span>;
            case 'cancelled':
                return <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-md text-xs font-semibold"><XCircle size={14} /> Cancelled</span>;
            default:
                return <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-xs font-semibold">Unknown</span>;
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fadeIn">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Product Order Report</h1>
                                <p className="text-gray-500 text-sm mt-1">Track your product purchases and status</p>
                            </div>
                            {/* Filters */}
                            <div className="flex gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search Order ID..."
                                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                    />
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
                                    <Filter size={16} /> Filter
                                </button>
                            </div>
                        </div>

                        {/* Orders Grid */}
                        {orders.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-50 pb-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercas font-semibold tracking-wider">Order ID</p>
                                                    <h3 className="text-lg font-bold text-gray-900">{order.order_id}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                                                    <p className="text-sm font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
                                                    <p className="text-lg font-bold text-indigo-600">₹{order.total_amount}</p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Items Ordered</h4>
                                            <div className="space-y-2">
                                                {order.items && order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className="text-gray-800 font-medium">{item.product_name}</span>
                                                        </div>
                                                        <span className="text-gray-600">₹{item.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                                    <Package size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No Orders Found</h3>
                                <p className="text-gray-500 mt-1">You haven't placed any product orders yet.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ProductOrders;
