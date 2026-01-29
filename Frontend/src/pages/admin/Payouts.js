import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
    DollarSign,
    Calendar,
    Play,
    CheckCircle,
    Download,
    X
} from 'lucide-react';

const Payouts = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [eligibleUsers, setEligibleUsers] = useState(0);
    const [recentPayouts, setRecentPayouts] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPayoutDetails, setSelectedPayoutDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchPayouts = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/payouts.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            console.log('Payouts API Response:', data);

            if (data.success) {
                const formattedPayouts = data.data.map(p => ({
                    id: `PAY-${p.id}`,
                    date: new Date(p.payout_date).toLocaleDateString(),
                    amount: p.total_amount,
                    usersCount: p.total_users,
                    status: p.status.charAt(0).toUpperCase() + p.status.slice(1)
                }));

                setRecentPayouts(formattedPayouts);

                // Calculate pending amount (draft payouts)
                const draftPayouts = data.data.filter(p => p.status === 'draft');
                const totalPending = draftPayouts.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
                const totalUsers = draftPayouts.reduce((sum, p) => sum + parseInt(p.total_users), 0);

                setPendingAmount(totalPending);
                setEligibleUsers(totalUsers);
            }
        } catch (error) {
            console.error('Failed to fetch payouts:', error);
        }
    }, []);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    const handleGeneratePayout = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/admin/payouts.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payout_date: new Date().toISOString().split('T')[0],
                    notes: 'Generated from admin panel'
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 5000);
                fetchPayouts(); // Refresh the list
            } else {
                alert('Failed to generate payout: ' + data.message);
            }
        } catch (error) {
            console.error('Error generating payout:', error);
            alert('Failed to generate payout');
        } finally {
            setIsGenerating(false);
        }
    };

    const viewPayoutDetails = async (payoutId) => {
        setLoadingDetails(true);
        setShowDetailsModal(true);

        try {
            const token = localStorage.getItem('authToken');
            const actualId = payoutId.replace('PAY-', '');
            const response = await fetch(`http://localhost/mlm/backend/api/admin/payout_details.php?payout_id=${actualId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setSelectedPayoutDetails(data.data);
            } else {
                alert('Failed to load payout details');
            }
        } catch (error) {
            console.error('Error fetching payout details:', error);
            alert('Failed to load payout details');
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Generate and distribute commissions</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 shadow-sm">
                        <Download size={18} /> Export History
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-indigo-100 text-xs font-bold uppercase">Total Pending Payout</p>
                                <h2 className="text-3xl font-bold mt-1">₹ {pendingAmount.toLocaleString()}</h2>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-indigo-100 bg-white/10 inline-block px-2 py-1 rounded">{eligibleUsers} Eligible Users</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Next Payout Date</p>
                                <h2 className="text-3xl font-bold text-gray-900 mt-1">Upcoming</h2>
                            </div>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Weekly Payout Cycle</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">System Status</p>
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                <CheckCircle size={20} /> Ready to Process
                            </div>
                        </div>
                        <button
                            onClick={handleGeneratePayout}
                            disabled={isGenerating || pendingAmount === 0}
                            className={`w-full mt-4 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isGenerating || pendingAmount === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                }`}
                        >
                            {isGenerating ? (
                                <>Processing...</>
                            ) : (
                                <><Play size={18} /> Run Payout Engine</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 animate-fade-in-down">
                        <CheckCircle size={24} />
                        <div>
                            <p className="font-bold">Payouts Generated Successfully!</p>
                            <p className="text-sm">Transactions have been queued for processing.</p>
                        </div>
                    </div>
                )}

                {/* Recent Payouts Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Recent Payout Runs</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Run ID</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Total Amount</th>
                                    <th className="px-6 py-4 font-semibold">Beneficiaries</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentPayouts.length > 0 ? (
                                    recentPayouts.map((payout) => (
                                        <tr key={payout.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-mono text-sm text-gray-600">{payout.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{payout.date}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">₹ {payout.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{payout.usersCount} Users</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${payout.status.toLowerCase() === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        payout.status.toLowerCase() === 'failed' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                    }`}>
                                                    {payout.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => viewPayoutDetails(payout.id)}
                                                    className="text-blue-600 text-sm font-semibold hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No payout history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payout Details Modal */}
                {showDetailsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Payout Details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {loadingDetails ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedPayoutDetails.length > 0 ? (
                                                    selectedPayoutDetails.map((detail, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-mono text-gray-600">{detail.user_id}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{detail.user_name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{detail.email}</td>
                                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">₹ {detail.amount.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${detail.status === 'paid' ? 'bg-green-50 text-green-700' :
                                                                    detail.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                                        'bg-red-50 text-red-700'
                                                                    }`}>
                                                                    {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                            No payout details found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Payouts;
