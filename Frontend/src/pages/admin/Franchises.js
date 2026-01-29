import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
    Search,
    MapPin,
    Package,
    Plus,
    Briefcase,
    Edit,
    Trash2,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext';
import { useConfirm } from '../../context/ConfirmContext';

import useLockBodyScroll from '../../utils/useLockBodyScroll';

const FranchiseEditModal = ({ isOpen, onClose, franchise, onSave }) => {
    useLockBodyScroll(isOpen);
    const [formData, setFormData] = useState({
        name: '',
        owner: '',
        region: '',
        stock: 0
    });

    React.useEffect(() => {
        if (franchise) {
            setFormData({
                name: franchise.name || '',
                owner: franchise.owner || '',
                region: franchise.region || '',
                stock: franchise.stock || 0
            });
        }
    }, [franchise]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 opacity-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Edit Franchise</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Franchise Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.owner}
                            onChange={e => setFormData({ ...formData, owner: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.region}
                            onChange={e => setFormData({ ...formData, region: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Units</label>
                        <input
                            type="number"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.stock}
                            onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Franchises = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedFranchise, setSelectedFranchise] = useState(null);

    const fetchFranchises = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost/mlm/backend/api/admin/franchises.php', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                }
            });
            const data = await response.json();
            console.log('Franchise API Response:', data);
            console.log('Raw franchise data:', JSON.stringify(data.data, null, 2));
            if (data.success) {
                setFranchises(data.data || []);
                console.log('Franchises loaded:', data.data.length);
                console.log('First franchise:', data.data[0]);
            } else {
                console.error('API Error:', data.message);
                showAlert('Failed to load: ' + (data.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error fetching franchises:', error);
            showAlert('Failed to load franchises', 'error');
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    // Fetch franchises from API
    useEffect(() => {
        fetchFranchises();
    }, [fetchFranchises]);

    const filteredFranchises = franchises.filter(fr =>
        (fr.name && fr.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (fr.owner && fr.owner.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleEdit = (fr) => {
        setSelectedFranchise(fr);
        setIsEditModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            // TODO: Implement update API call
            showAlert('Update functionality coming soon', 'info');
            setIsEditModalOpen(false);
        } catch (error) {
            showAlert('Failed to update franchise', 'error');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Delete Franchise',
            'Are you sure you want to delete this franchise? This action cannot be undone and will remove all franchise data.',
            'danger'
        );
        if (confirmed) {
            try {
                // TODO: Implement delete API call
                showAlert('Delete functionality coming soon', 'info');
            } catch (error) {
                showAlert('Failed to delete franchise', 'error');
            }
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Franchise Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Monitor franchise performance and inventory</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/create-franchise')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium flex items-center gap-2 shadow-lg shadow-purple-200 transition-all"
                    >
                        <Plus size={20} /> Add New Franchise
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Total Franchises</p>
                            <h3 className="text-2xl font-bold text-gray-900">{franchises.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Total Stock Distributed</p>
                            <h3 className="text-2xl font-bold text-gray-900">{franchises.reduce((acc, curr) => acc + parseInt(curr.stock || 0), 0).toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Active Regions</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {[...new Set(franchises.map(f => f.region))].length}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search details..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        </div>
                    ) : filteredFranchises.length === 0 ? (
                        <div className="text-center py-20">
                            <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-500 text-lg">No franchises found</p>
                            <p className="text-gray-400 text-sm mt-2">Approved franchise applications will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Franchise Name</th>
                                        <th className="px-6 py-4 font-semibold">Owner</th>
                                        <th className="px-6 py-4 font-semibold">Region</th>
                                        <th className="px-6 py-4 font-semibold">Type/Role</th>
                                        <th className="px-6 py-4 font-semibold">Current Stock</th>
                                        <th className="px-6 py-4 font-semibold">Total Sales</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredFranchises.map((fr) => (
                                        <tr key={fr.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                        {fr.id}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{fr.name || 'Unnamed Franchise'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{fr.owner || 'Not Available'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{fr.region || 'Location Not Set'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-purple-700 uppercase">{fr.type || 'Standard'}</span>
                                                    <span className="text-[10px] text-gray-400 capitalize">{fr.role || 'franchise'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${fr.stock < 500 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'
                                                    } `}>
                                                    <Package size={14} />
                                                    <span className="text-xs font-bold">{fr.stock} Units</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">₹ {(fr.sales || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex bg-gray-50 rounded-lg p-1 w-fit ml-auto gap-1">
                                                    <button
                                                        onClick={() => handleEdit(fr)}
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-white rounded-md transition-all shadow-sm" title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(fr.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition-all shadow-sm" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
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

            <FranchiseEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                franchise={selectedFranchise}
                onSave={handleSave}
            />
        </Layout>
    );
};

export default Franchises;
