import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAdmin } from '../../context/AdminContext';
import { useAlert } from '../../context/AlertContext';
import { ChevronLeft, Save, Briefcase, User, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateFranchise = () => {
    const navigate = useNavigate();
    const { addFranchise } = useAdmin();
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        name: '', // Changed to match context property 'name'
        owner: '', // Changed to match context property 'owner'
        email: '',
        phone: '',
        region: '',
        address: '',
        stock: 1000 // Changed to 'stock'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addFranchise(formData);
        showAlert("Franchise Account Created Successfully!", "success");
        navigate('/admin/franchises');
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/franchises')}
                        className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Franchise</h1>
                        <p className="text-gray-500 text-sm">Onboard a new partner to the network</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">

                    {/* Section 1: Basic Details */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                            <Briefcase className="text-purple-600" size={20} />
                            <h3 className="text-lg font-bold text-gray-800">Franchise Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Franchise Name</label>
                                <input
                                    type="text"
                                    name="franchiseName"
                                    value={formData.franchiseName}
                                    onChange={handleChange}
                                    placeholder="e.g. City Center Hub"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Region / Zone</label>
                                <input
                                    type="text"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    placeholder="e.g. Mumbai South"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Owner Information */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                            <User className="text-purple-600" size={20} />
                            <h3 className="text-lg font-bold text-gray-800">Owner Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Owner Full Name</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Inventory */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                            <Package className="text-purple-600" size={20} />
                            <h3 className="text-lg font-bold text-gray-800">Initial Inventory Setup</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Allocate Initial E-Pin Stock</label>
                            <input
                                type="number"
                                name="initialStock"
                                value={formData.initialStock}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-2">Default allocation is 1000 units. You can change this later.</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/franchises')}
                            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center gap-2"
                        >
                            <Save size={20} /> Create Franchise
                        </button>
                    </div>

                </form>
            </div>
        </Layout>
    );
};

export default CreateFranchise;
