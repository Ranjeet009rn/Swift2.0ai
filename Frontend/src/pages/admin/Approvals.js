import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAdmin } from '../../context/AdminContext';
import { useAlert } from '../../context/AlertContext';
import {
    CheckCircle,
    XCircle,
    Eye,
    FileText,
    CreditCard,
    Clock
} from 'lucide-react';

const Approvals = () => {
    const {
        kycRequests,
        withdrawalRequests,
        approveKyc,
        rejectKyc,
        approveWithdrawal,
        rejectWithdrawal
    } = useAdmin();
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState('kyc'); // 'kyc' or 'withdrawals'

    // Initialize from URL query params
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['kyc', 'withdrawals'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, []);

    const changeTab = (tab) => {
        setActiveTab(tab);
        const newUrl = `${window.location.pathname}?tab=${tab}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        type: null, // 'approve_kyc', 'reject_kyc', 'approve_withdrawal', 'reject_withdrawal'
        id: null,
        title: '',
        message: '',
        color: 'blue' // blue, red, green
    });

    const triggerConfirmation = (type, id, title, message, color = 'blue') => {
        setConfirmation({
            isOpen: true,
            type,
            id,
            title,
            message,
            color
        });
    };

    const closeConfirmation = () => {
        setConfirmation({ ...confirmation, isOpen: false });
    };

    const handleConfirmAction = () => {
        const { type, id } = confirmation;

        switch (type) {
            case 'approve_kyc':
                approveKyc(id);
                showAlert('KYC Approved successfully', 'success');
                break;
            case 'reject_kyc':
                rejectKyc(id);
                showAlert('KYC Rejected', 'info');
                break;
            case 'approve_withdrawal':
                approveWithdrawal(id);
                showAlert('Withdrawal Approved and Processed', 'success');
                break;
            case 'reject_withdrawal':
                rejectWithdrawal(id);
                showAlert('Withdrawal Rejected', 'warn');
                break;
            default:
                break;
        }
        closeConfirmation();
    };

    const handleApproveKyc = (id) => {
        triggerConfirmation('approve_kyc', id, 'Approve KYC Request', 'Are you sure you want to approve this user\'s KYC document? This will verify the user.', 'green');
    };

    const handleRejectKyc = (id) => {
        triggerConfirmation('reject_kyc', id, 'Reject KYC Request', 'Are you sure you want to reject this KYC document? The user will need to resubmit.', 'red');
    };

    const handleApproveWithdrawal = (id) => {
        triggerConfirmation('approve_withdrawal', id, 'Approve Withdrawal', 'Are you sure you want to approve this withdrawal request?', 'green');
    };

    const handleRejectWithdrawal = (id) => {
        triggerConfirmation('reject_withdrawal', id, 'Reject Withdrawal', 'Are you sure you want to reject this withdrawal request?', 'red');
    };

    const [selectedRequest, setSelectedRequest] = useState(null);

    const handleViewDetails = (req) => {
        setSelectedRequest(req);
    };

    const closeDetails = () => {
        setSelectedRequest(null);
    };

    const handleApproveFromModal = () => {
        if (selectedRequest) {
            closeDetails();
            handleApproveKyc(selectedRequest.id);
        }
    };

    const handleRejectFromModal = () => {
        if (selectedRequest) {
            closeDetails();
            handleRejectKyc(selectedRequest.id);
        }
    };

    return (
        <Layout>
            {/* Custom Confirmation Modal */}
            {confirmation.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 transform transition-all">
                        <div className={`p-6 text-center ${confirmation.color === 'red' ? 'bg-red-50' :
                                confirmation.color === 'green' ? 'bg-green-50' : 'bg-blue-50'
                            }`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white shadow-sm ${confirmation.color === 'red' ? 'text-red-500' :
                                    confirmation.color === 'green' ? 'text-green-500' : 'text-blue-500'
                                }`}>
                                {confirmation.color === 'red' ? <XCircle size={32} /> :
                                    confirmation.color === 'green' ? <CheckCircle size={32} /> :
                                        <FileText size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{confirmation.title}</h3>
                            <p className="text-sm text-gray-600 px-4">{confirmation.message}</p>
                        </div>
                        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                            <button
                                onClick={closeConfirmation}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 ${confirmation.color === 'red' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
                                        confirmation.color === 'green' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' :
                                            'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                KYC Document Details
                            </h3>
                            <button onClick={closeDetails} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">User Name</p>
                                    <p className="font-semibold text-gray-900 text-lg">{selectedRequest.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Document Type</p>
                                    <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                                        {selectedRequest.type}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Document Number</p>
                                    <p className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block mt-1">
                                        {selectedRequest.docNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Submitted On</p>
                                    <p className="text-gray-700 mt-1 flex items-center gap-1">
                                        <Clock size={14} /> {selectedRequest.date}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Attached Document</p>
                                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center min-h-[400px]">
                                    {selectedRequest.file.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={selectedRequest.file}
                                            className="w-full h-[600px]"
                                            title="KYC Document"
                                        />
                                    ) : (
                                        <img
                                            src={selectedRequest.file}
                                            alt="KYC Document"
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found' }}
                                        />
                                    )}
                                </div>

                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                            <button
                                onClick={handleRejectFromModal}
                                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm flex items-center gap-2"
                            >
                                <XCircle size={18} /> Reject
                            </button>
                            <button
                                onClick={handleApproveFromModal}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all shadow-md flex items-center gap-2"
                            >
                                <CheckCircle size={18} /> Approve KYC
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                        <p className="text-gray-500 text-sm mt-1">Review and action pending requests</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-100 w-fit shadow-sm">
                    <button
                        onClick={() => changeTab('kyc')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'kyc'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <FileText size={18} />
                        KYC Requests
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'kyc' ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {kycRequests.length}
                        </span>
                    </button>
                    <button
                        onClick={() => changeTab('withdrawals')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'withdrawals'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <CreditCard size={18} />
                        Withdrawals
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'withdrawals' ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {withdrawalRequests.length}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {activeTab === 'kyc' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Document Type</th>
                                        <th className="px-6 py-4 font-semibold">Details</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Submitted</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {kycRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{req.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                                                    {req.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{req.docNumber}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${req.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    req.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                    }`}>
                                                    {req.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                                                <Clock size={14} /> {req.date}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                                                        <button
                                                            onClick={() => handleApproveKyc(req.id)}
                                                            className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center ${req.status === 'approved' || req.status === 'Approved'
                                                                ? 'bg-green-500 text-white shadow-sm'
                                                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                                }`}
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={16} strokeWidth={req.status === 'Approved' ? 3 : 2} />
                                                        </button>
                                                        <div className="w-px bg-gray-200 my-1 mx-1"></div>
                                                        <button
                                                            onClick={() => handleRejectKyc(req.id)}
                                                            className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center ${req.status === 'rejected' || req.status === 'Rejected'
                                                                ? 'bg-red-500 text-white shadow-sm'
                                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                                }`}
                                                            title="Reject"
                                                        >
                                                            <XCircle size={16} strokeWidth={req.status === 'Rejected' ? 3 : 2} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleViewDetails(req)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                        title="View Proof"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {kycRequests.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No pending KYC requests</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'withdrawals' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Amount</th>
                                        <th className="px-6 py-4 font-semibold">Method</th>
                                        <th className="px-6 py-4 font-semibold">Requested Date</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {withdrawalRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-bold text-gray-900">{req.name}</td>
                                            <td className="px-6 py-4 font-bold text-green-600">₹ {req.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{req.method}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{req.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApproveWithdrawal(req.id)}
                                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectWithdrawal(req.id)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold hover:bg-red-100"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {withdrawalRequests.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No pending withdrawal requests</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Approvals;
