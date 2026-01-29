import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Search, Network, ArrowLeft, Building2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import FranchiseTreeView from '../../components/FranchiseTreeView';

const AdminFranchiseTree = () => {
    const { franchises } = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFranchise, setSelectedFranchise] = useState(null);
    const [viewingTree, setViewingTree] = useState(false);

    // Initialize from URL query params
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const franchiseIdParam = params.get('franchise_id');

        if (franchiseIdParam && franchises.length > 0 && !selectedFranchise) {
            const franchise = franchises.find(f => f.id === franchiseIdParam || f.id === parseInt(franchiseIdParam));
            if (franchise) {
                setSelectedFranchise(franchise);
                setViewingTree(true);
            }
        }
    }, [franchises, selectedFranchise]);

    // Filter franchises based on search
    const filteredFranchises = franchises.filter(franchise =>
        franchise.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        franchise.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        franchise.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewFranchiseTree = (franchise) => {
        setSelectedFranchise(franchise);
        setViewingTree(true);
        // Update URL
        const newUrl = `${window.location.pathname}?franchise_id=${franchise.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleBackToList = () => {
        setViewingTree(false);
        setSelectedFranchise(null);
        // Reset URL
        const newUrl = window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    // If viewing a tree, show the franchise tree component
    if (viewingTree && selectedFranchise) {
        return (
            <Layout>
                <div className="space-y-6">
                    {/* Back Button */}
                    <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        <span className="font-semibold text-gray-700">Back to Franchises List</span>
                    </button>

                    {/* Franchise Info Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedFranchise.name}'s Network Tree</h2>
                                <p className="text-purple-100 mt-1">Owner: {selectedFranchise.owner} • {selectedFranchise.region}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tree View */}
                    <FranchiseTreeView franchise={selectedFranchise} />
                </div>
            </Layout>
        );
    }

    // Default view: Show list of franchises
    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Franchise Teams & Trees</h1>
                        <p className="text-gray-500 text-sm mt-1">View hierarchical structure of franchise units</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by franchise name, owner, or region..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Franchises List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Franchise</th>
                                    <th className="px-6 py-4 font-semibold">Owner</th>
                                    <th className="px-6 py-4 font-semibold">Region</th>
                                    <th className="px-6 py-4 font-semibold">Stock</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredFranchises.map((franchise) => (
                                    <tr key={franchise.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{franchise.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {franchise.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{franchise.owner}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{franchise.region}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{franchise.stock} Units</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-purple-700 capitalize">{franchise.role}</span>
                                                <span className="text-xs text-gray-400 capitalize">{franchise.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${franchise.status === 'Active' || franchise.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {franchise.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewFranchiseTree(franchise)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm text-sm font-semibold"
                                            >
                                                <Network size={16} />
                                                View Tree
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredFranchises.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>No franchises found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminFranchiseTree;
