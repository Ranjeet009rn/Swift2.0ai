import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Package, CreditCard, Upload, Send, History, AlertCircle, FileText } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

const EPinApply = () => {
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        packageType: '',
        quantity: 1,
        paymentMode: 'UPI',
        transactionId: '',
        screenshot: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [packages, setPackages] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Fetch Packages
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const response = await fetch('http://localhost/mlm/backend/api/packages.php');
                const data = await response.json();

                // Allow for different response structures (data.packages or data.data)
                const packagesList = data.packages || data.data;

                if (data.success && Array.isArray(packagesList)) {
                    setPackages(packagesList);
                    // Do NOT set default package automatically.
                }
            } catch (error) {
                console.error("Failed to fetch packages", error);
            }
        };
        fetchPackages();
    }, []);

    // Fetch Request History
    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/user/epin_requests.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const selectedPkg = Array.isArray(packages) ? packages.find(p => p.name === formData.packageType) : null;
    const totalAmount = (selectedPkg?.price || 0) * formData.quantity;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.packageType) {
            showAlert('Please select a package', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');

            // Use FormData for file upload
            const submitData = new FormData();
            submitData.append('package', formData.packageType);
            submitData.append('quantity', formData.quantity);
            submitData.append('amount', totalAmount);
            submitData.append('paymentMode', formData.paymentMode);
            submitData.append('transactionId', formData.transactionId);
            if (formData.screenshot) {
                submitData.append('screenshot', formData.screenshot);
            }

            const response = await fetch('http://localhost/mlm/backend/api/user/epin_apply_submit.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type not needed for FormData, browser sets it with boundary
                },
                body: submitData
            });

            const data = await response.json();
            if (data.success) {
                showAlert('E-Pin Request Submitted Successfully!', 'success');
                setFormData(prev => ({
                    ...prev,
                    transactionId: '',
                    screenshot: null
                }));
                // Refresh history
                fetchHistory();
            } else {
                showAlert(data.message || 'Submission failed', 'error');
            }
        } catch (error) {
            showAlert('Failed to connect to server', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request E-Pins</h1>
                    <p className="text-gray-500 text-sm mt-1">Purchase new keys for user activation</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Request Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Send size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">New Request Application</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Package Type</label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <select
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={formData.packageType}
                                                onChange={e => setFormData({ ...formData, packageType: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Package</option>
                                                {Array.isArray(packages) && packages.map(p => (
                                                    <option key={p.id} value={p.name}>{p.name} - ₹{parseFloat(p.price).toLocaleString()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Total Payable Amount</span>
                                    <span className="text-xl font-bold text-indigo-600">₹ {totalAmount.toLocaleString()}</span>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <CreditCard size={18} className="text-gray-500" /> Payment Details
                                    </h4>

                                    {/* Dynamic QR Code Section */}
                                    {formData.packageType && totalAmount > 0 && (
                                        <div className="flex flex-col items-center justify-center p-6 border-2 border-indigo-100 bg-indigo-50/50 rounded-2xl mb-6">
                                            <p className="text-sm font-bold text-gray-800 mb-3">Scan to Pay ₹{totalAmount.toLocaleString()}</p>
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=chiragbhandarkar780-1@okaxis&pn=Nexway LifeCare&am=${totalAmount}&cu=INR`)}`}
                                                    alt="Payment QR Code"
                                                    className="w-48 h-48 object-contain"
                                                />
                                            </div>
                                            <div className="mt-4 flex flex-wrap justify-center items-center gap-3 text-xs text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-5" alt="GPay" />
                                                <img src="https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png" className="h-5" alt="PhonePe" />
                                                <img src="https://download.logo.wine/logo/Paytm/Paytm-Logo.wine.png" className="h-4" alt="Paytm" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4" alt="UPI" />
                                                <span className="font-medium ml-1 text-gray-400">| & All UPI Apps Accepted</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">Amount will be pre-filled automatically</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={formData.paymentMode}
                                                onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                            >
                                                <option value="UPI">UPI / GPay / PhonePe</option>
                                                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                                                <option value="Wallet">Wallet Deduction</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Ref No.</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. UPI/12345678"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={formData.transactionId}
                                                onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Payment Proof</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => setFormData({ ...formData, screenshot: e.target.files[0] })}
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm font-medium text-gray-600">
                                                    {formData.screenshot ? formData.screenshot.name : "Click to upload screenshot"}
                                                </p>
                                                <p className="text-xs text-gray-400">JPG, PNG, PDF up to 2MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isSubmitting ? 'Processing...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <AlertCircle size={20} /> Instructions
                            </h4>
                            <ul className="space-y-3 text-sm text-indigo-100">
                                <li className="flex gap-2"><span className="text-white font-bold">•</span> Transfer exact amount to avoid delays.</li>
                                <li className="flex gap-2"><span className="text-white font-bold">•</span> Upload clear screenshot of transaction.</li>
                                <li className="flex gap-2"><span className="text-white font-bold">•</span> Requests are processed within 2-4 hours.</li>
                            </ul>
                            <div className="mt-6 pt-6 border-t border-white/20">
                                <p className="text-xs uppercase font-bold tracking-wider mb-2">User Bank Details</p>
                                <p className="font-mono text-lg font-bold">{user?.bank_name || 'N/A'}</p>
                                <p className="font-mono">AC: {user?.bank_account_no || 'N/A'}</p>
                                <p className="font-mono">IFSC: {user?.ifsc_code || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <History size={18} className="text-gray-500" /> Recent Requests
                                </h4>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {loadingHistory ? (
                                    <p className="text-center text-gray-400 text-sm py-4">Loading history...</p>
                                ) : requests.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-4">No recent requests</p>
                                ) : (
                                    requests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{req.quantity} x {req.package}</p>
                                                <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                                <p className="text-xs text-indigo-600 font-mono mt-0.5">{req.transaction_id}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                                {req.screenshot && (
                                                    <a
                                                        href={`http://localhost/mlm/backend/${req.screenshot}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1"
                                                    >
                                                        <FileText size={10} /> View
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EPinApply;
