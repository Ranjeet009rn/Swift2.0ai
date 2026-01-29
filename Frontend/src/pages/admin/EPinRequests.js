import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Package, CheckCircle, XCircle, Clock, Search, Filter, Eye } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import { useConfirm } from '../../context/ConfirmContext';

const EPinRequests = () => {
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
    const [requests, setRequests] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/epin_requests.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
                setCounts(data.counts);
            }
        } catch (error) {
            showAlert('Failed to fetch requests', 'error');
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (requestId, action) => {
        const actionText = action === 'approve' ? 'approve' : 'reject';
        const confirmed = await showConfirm(
            `${action === 'approve' ? 'Approve' : 'Reject'} E-Pin Request`,
            `Are you sure you want to ${actionText} this E-Pin request?`,
            action === 'approve' ? 'check' : 'x'
        );

        if (!confirmed) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/epin_action.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requestId, action, remarks })
            });
            const data = await response.json();
            if (data.success) {
                showAlert(data.message, 'success');
                setShowModal(false);
                setRemarks('');
                fetchRequests();
            } else {
                showAlert(data.message || 'Action failed', 'error');
            }
        } catch (error) {
            showAlert('Failed to process request', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'all' || req.status.toLowerCase() === filter;

        const userName = req.user_name || '';
        const userCode = req.user_code || '';
        const txnId = req.transaction_id || '';

        const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txnId.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Approved': 'bg-green-100 text-green-700',
            'Rejected': 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">E-Pin Requests</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage user E-Pin purchase requests</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Requests', value: counts.total, icon: Package, color: 'indigo' },
                        { label: 'Pending', value: counts.pending, icon: Clock, color: 'yellow' },
                        { label: 'Approved', value: counts.approved, icon: CheckCircle, color: 'green' },
                        { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'red' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                                    <stat.icon size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by user name, code, or transaction ID..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="mx-auto text-gray-300" size={48} />
                            <p className="text-gray-500 mt-4">No requests found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Package</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Qty</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Payment</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900">{req.user_name}</p>
                                                    <p className="text-xs text-gray-500">{req.user_code}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-800">{req.package}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-indigo-600">{req.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">₹{parseFloat(req.amount).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">{req.payment_mode}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{req.transaction_id}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {req.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(req);
                                                                    handleAction(req.id, 'approve');
                                                                }}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Approve"
                                                                disabled={processing}
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(req);
                                                                    setShowModal(true);
                                                                }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Reject"
                                                                disabled={processing}
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">User Name</p>
                                    <p className="font-bold text-gray-900">{selectedRequest.user_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">User Code</p>
                                    <p className="font-bold text-gray-900">{selectedRequest.user_code}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Package</p>
                                    <p className="font-bold text-gray-900">{selectedRequest.package}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Quantity</p>
                                    <p className="font-bold text-gray-900">{selectedRequest.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="font-bold text-gray-900">₹{parseFloat(selectedRequest.amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment Mode</p>
                                    <p className="font-bold text-gray-900">{selectedRequest.payment_mode}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Transaction ID</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">{selectedRequest.transaction_id}</p>
                                </div>
                                {selectedRequest.admin_remarks && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Admin Remarks</p>
                                        <p className="text-gray-900">{selectedRequest.admin_remarks}</p>
                                    </div>
                                )}
                            </div>

                            {selectedRequest.screenshot && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-2">Payment Proof</p>
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
                                        <img
                                            src={`http://localhost/mlm/backend/${selectedRequest.screenshot}`}
                                            alt="Payment Proof"
                                            className="w-full h-auto max-h-96 object-contain rounded cursor-pointer hover:opacity-95 transition-opacity"
                                            onClick={() => window.open(`http://localhost/mlm/backend/${selectedRequest.screenshot}`, '_blank')}
                                        />
                                        <p className="text-center text-xs text-gray-400 mt-2">Click image to view full size</p>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === 'Pending' && (
                                <div className="mt-6 space-y-3">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        rows="3"
                                        placeholder="Add remarks..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            {selectedRequest.status === 'Pending' ? (
                                <>
                                    <button
                                        onClick={() => handleAction(selectedRequest.id, 'approve')}
                                        disabled={processing}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'Processing...' : 'Approve & Generate E-Pins'}
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedRequest.id, 'reject')}
                                        disabled={processing}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Reject Request
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default EPinRequests;
