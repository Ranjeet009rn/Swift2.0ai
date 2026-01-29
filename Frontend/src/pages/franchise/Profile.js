import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, Mail, Phone, MapPin, Building, CreditCard, Save, Box } from 'lucide-react';
import apiService from '../../services/apiService';
import { useAlert } from '../../context/AlertContext';

const MultiStepForm = () => {
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        franchise_name: '',
        owner_name: '',
        email: '',
        mobile: '',
        franchise_code: '',
        franchise_type: '',
        city: '',
        state: '',
        pincode: '',
        address: '',
        gst_number: '',
        pan_number: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiService.getFranchiseProfile();
                if (response.success && response.data) {
                    const data = response.data;
                    setFormData(prev => ({
                        ...prev,
                        franchise_name: data.franchise_name || '',
                        owner_name: data.owner_name || '',
                        email: data.email || '',
                        mobile: data.mobile || '',
                        franchise_code: data.franchise_code || '',
                        franchise_type: data.franchise_type || '',
                        city: data.city || '',
                        state: data.state || '',
                        pincode: data.pincode || '',
                        address: data.address || '',
                        gst_number: data.gst_number || '',
                        pan_number: data.pan_number || ''
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
                showAlert("Failed to load profile data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [showAlert]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await apiService.updateFranchiseProfile(formData);
            if (response.success) {
                showAlert("Profile updated successfully", "success");
            } else {
                showAlert(response.message || "Update failed", "error");
            }
        } catch (error) {
            showAlert("An error occurred while updating", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Franchise Profile</h1>
                        <p className="text-gray-500 mt-2">Manage your franchise profile and legal details</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
                    >
                        <Save size={20} />
                        <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <User className="text-blue-500" />
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Owner Name</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="owner_name"
                                        value={formData.owner_name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Franchise Details */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <Building className="text-purple-500" />
                            Franchise Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Franchise Name</label>
                                <div className="relative">
                                    <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="franchise_name"
                                        value={formData.franchise_name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Franchise Type</label>
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
                                    {formData.franchise_type}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Franchise Code</label>
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 flex items-center justify-between">
                                    <span>{formData.franchise_code}</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address & Legal */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <MapPin className="text-orange-500" />
                            Address & Legal
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700">Full Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">GST Number</label>
                                <div className="relative">
                                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={formData.gst_number}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">PAN Number</label>
                                <div className="relative">
                                    <Box size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="pan_number"
                                        value={formData.pan_number}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default MultiStepForm;
