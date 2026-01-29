import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, MapPin, CreditCard, Package, Save } from 'lucide-react';

const EditMemberModal = ({ isOpen, onClose, userId, userData, onSave }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        mobile: '',
        country_code: '',
        state: '',
        city: '',
        pincode: '',
        full_address: '',
        pan_number: '',
        id_number: '',
        bank_name: '',
        account_holder: '',
        account_number: '',
        ifsc_code: '',
        package_id: '',
        total_earnings: '',
        sponsor_amount: ''
    });

    const [packages, setPackages] = useState([]);
    const [saving, setSaving] = useState(false);

    // Scroll lock effect
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Populate form when userData changes
    useEffect(() => {
        if (userData) {
            setFormData({
                full_name: userData.identity?.full_name || '',
                email: userData.identity?.email || '',
                mobile: userData.identity?.mobile || '',
                country_code: userData.location?.country_code || '',
                state: userData.location?.state || '',
                city: userData.location?.city || '',
                pincode: userData.location?.pincode || '',
                full_address: userData.location?.address || '',
                pan_number: userData.kyc?.pan_number || '',
                id_number: userData.kyc?.id_number || '',
                bank_name: userData.bank?.bank_name || '',
                account_holder: userData.bank?.account_holder || '',
                account_number: userData.bank?.account_number || '',
                ifsc_code: userData.bank?.ifsc_code || '',
                package_id: userData.package?.id || '',
                total_earnings: userData.earnings?.total_earnings || '',
                sponsor_amount: userData.earnings?.sponsor_amount || ''
            });
        }
    }, [userData]);

    // Fetch packages
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const apiService = (await import('../services/apiService')).default;
                const response = await apiService.getPackages();
                if (response.success && response.data) {
                    setPackages(response.data);
                }
            } catch (error) {
                console.error('Error fetching packages:', error);
            }
        };

        if (isOpen) {
            fetchPackages();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setSaving(true);
        // Call onSave with formData
        await onSave(userId, formData);
        setSaving(false);
    };

    return createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">Edit Member</h2>
                        <p className="text-xs text-indigo-200 mt-1">ID: <span className="text-white font-mono">{userId || 'N/A'}</span></p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                    <div className="space-y-6">
                        {/* Identity Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <User size={18} className="text-indigo-600" /> Identity Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Mobile</label>
                                    <input
                                        type="text"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-indigo-600" /> Location Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Country</label>
                                    <input
                                        type="text"
                                        value={formData.country_code}
                                        onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Pincode</label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Full Address</label>
                                    <textarea
                                        value={formData.full_address}
                                        onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                        rows="2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KYC & Bank Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-indigo-600" /> KYC & Bank Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">PAN Number</label>
                                    <input
                                        type="text"
                                        value={formData.pan_number}
                                        onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">ID Number</label>
                                    <input
                                        type="text"
                                        value={formData.id_number}
                                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Account Holder</label>
                                    <input
                                        type="text"
                                        value={formData.account_holder}
                                        onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        value={formData.ifsc_code}
                                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Package Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Package size={18} className="text-indigo-600" /> Package
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Select Package</label>
                                <select
                                    value={formData.package_id}
                                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                                    className="w-full p-3 border rounded-lg text-sm font-medium"
                                >
                                    <option value="">Select Package</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.package_name} - ₹{pkg.price?.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Earnings Management Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-indigo-600" /> Earnings Management
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Total Earnings</label>
                                    <input
                                        type="number"
                                        value={formData.total_earnings}
                                        onChange={(e) => setFormData({ ...formData, total_earnings: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Sponsor Amount</label>
                                    <input
                                        type="number"
                                        value={formData.sponsor_amount}
                                        onChange={(e) => setFormData({ ...formData, sponsor_amount: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-100 border-t flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditMemberModal;
