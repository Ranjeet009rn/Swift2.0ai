import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
    CheckCircle, XCircle, Eye, FileText,
    MapPin, CreditCard, AlertCircle, Download,
    User, Filter
} from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import { useConfirm } from '../../context/ConfirmContext';

const FranchiseApprovables = () => {
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost/mlm/backend/api/get_franchise_applications.php?status=${filter}`);
            const data = await response.json();
            if (data.success) {
                setApplications(data.applications || []);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleApprove = async (appId) => {
        const confirmed = await showConfirm(
            'Approve Franchise Application',
            'Are you sure you want to approve this franchise application? This will grant them access to the system.',
            'success'
        );
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const response = await fetch('http://localhost/mlm/backend/api/approve_franchise.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application_id: appId, action: 'approve' })
            });

            const data = await response.json();
            if (data.success) {
                showAlert('Franchise application approved successfully!', 'success');
                fetchApplications();
                setShowModal(false);
            } else {
                showAlert(data.message || 'Failed to approve application', 'error');
            }
        } catch (error) {
            showAlert('Error approving application', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (appId) => {
        if (!rejectionReason.trim()) {
            showAlert('Please provide a reason for rejection', 'error');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch('http://localhost/mlm/backend/api/approve_franchise.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: appId,
                    action: 'reject',
                    rejection_reason: rejectionReason
                })
            });

            const data = await response.json();
            if (data.success) {
                showAlert('Franchise application rejected', 'info');
                fetchApplications();
                setShowModal(false);
                setRejectionReason('');
            } else {
                showAlert(data.message || 'Failed to reject application', 'error');
            }
        } catch (error) {
            showAlert('Error rejecting application', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const viewDetails = (app) => {
        setSelectedApp(app);
        setShowModal(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            approved: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            suspended: 'bg-gray-100 text-gray-800 border-gray-300'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Franchise Applications</h1>
                        <p className="text-gray-600 mt-1">Review and approve franchise applications</p>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none font-semibold"
                        >
                            <option value="all">All Applications</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Applications', value: applications.length, color: 'blue' },
                        { label: 'Pending', value: applications.filter(a => a.application_status === 'pending').length, color: 'yellow' },
                        { label: 'Approved', value: applications.filter(a => a.application_status === 'approved').length, color: 'green' },
                        { label: 'Rejected', value: applications.filter(a => a.application_status === 'rejected').length, color: 'red' }
                    ].map((stat, idx) => (
                        <div key={idx} className={`bg-gradient-to-br from-${stat.color}-50 to-white p-6 rounded-2xl border-2 border-${stat.color}-100`}>
                            <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                            <p className={`text-3xl font-bold text-${stat.color}-600 mt-2`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-20">
                            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-500 text-lg">No applications found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-orange-50 to-yellow-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Business Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Contact Person</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Applied On</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">#{app.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{app.franchisee_name}</div>
                                                <div className="text-xs text-gray-500">{app.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{app.contact_person_name}</div>
                                                <div className="text-xs text-gray-500">{app.mobile_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                                    {app.franchise_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {app.city}, {app.state}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(app.applied_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(app.application_status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => viewDetails(app)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
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
            {showModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Franchise Application Details</h2>
                                    <p className="text-orange-100 text-sm mt-1">Application ID: #{selectedApp.id}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Basic Details */}
                            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="text-blue-600" size={20} />
                                    Basic Details
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Business Name</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.franchisee_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Contact Person</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.contact_person_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Email</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Mobile</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.mobile_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Business & Location */}
                            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="text-green-600" size={20} />
                                    Business & Location
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Franchise Type</p>
                                        <p className="text-sm font-semibold text-gray-900 uppercase">{selectedApp.franchise_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Territory</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.area_territory}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-500 font-semibold">Address</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.business_address}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">City</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.city}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">State</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.state}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">PIN Code</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.pincode}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legal Documents */}
                            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-purple-600" size={20} />
                                    Legal & Identity
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">PAN Number</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.pan_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">ID Type</p>
                                        <p className="text-sm font-semibold text-gray-900 uppercase">{selectedApp.govt_id_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">ID Number</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.govt_id_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">GST Number</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.gst_number || 'N/A'}</p>
                                    </div>
                                    {selectedApp.id_proof_path && (
                                        <div className="md:col-span-2">
                                            <a
                                                href={`http://localhost/mlm/backend/api/download_id_proof.php?id=${selectedApp.id}`}
                                                download
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                                            >
                                                <Download size={16} />
                                                Download ID Proof
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="text-yellow-600" size={20} />
                                    Bank Details
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Bank Name</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.bank_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Account Holder</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.account_holder_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Account Number</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.account_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">IFSC Code</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedApp.ifsc_code}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {selectedApp.application_status === 'pending' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleApprove(selectedApp.id)}
                                            disabled={actionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                                        >
                                            <CheckCircle size={20} />
                                            Approve Application
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter reason for rejection (required)"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                                            rows="3"
                                        />
                                        <button
                                            onClick={() => handleReject(selectedApp.id)}
                                            disabled={actionLoading || !rejectionReason.trim()}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                                        >
                                            <XCircle size={20} />
                                            Reject Application
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedApp.application_status === 'rejected' && selectedApp.rejection_reason && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                                    <p className="text-sm font-semibold text-red-900">Rejection Reason:</p>
                                    <p className="text-sm text-red-700 mt-1">{selectedApp.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default FranchiseApprovables;
