import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Copy, Send, Package, Filter, CheckCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const EPinUnused = () => {
    const { showAlert } = useAlert();
    const [searchTerm, setSearchTerm] = useState('');
    const [pins, setPins] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/epins_unused.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setPins(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch unused epins", error);
            }
        };
        fetchData();
    }, []);

    const handleCopy = (pin) => {
        navigator.clipboard.writeText(pin);
        showAlert('Pin copied to clipboard', 'success');
    };

    const filteredPins = pins.filter(p =>
        p.pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.package.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Unused E-Pins</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your active inventory available for activation</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Total Available</p>
                            <h3 className="text-2xl font-bold text-gray-900">{pins.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Starter Pack</p>
                            <h3 className="text-2xl font-bold text-gray-900">{pins.filter(p => p.package === 'Starter').length}</h3>
                        </div>
                    </div>
                </div>

                {/* Tools */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by PIN or Package..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-medium transition-colors">
                            <Filter size={18} /> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all">
                            <Send size={18} /> Transfer Pins
                        </button>
                    </div>
                </div>

                {/* Grid of Pins */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPins.map(pin => (
                        <div key={pin.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${pin.package === 'Starter' ? 'bg-blue-50 text-blue-600' :
                                    pin.package === 'Pro' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {pin.package}
                                </div>
                                <span className="text-xs text-gray-400 font-mono">{pin.date}</span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200 flex items-center justify-between">
                                <code className="font-mono font-bold text-gray-800 tracking-wide text-lg">{pin.pin}</code>
                                <button
                                    onClick={() => handleCopy(pin.pin)}
                                    className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="Copy PIN"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-gray-900">₹ {pin.amount.toLocaleString()}</div>
                                <button className="text-xs font-bold text-indigo-600 hover:underline">Activate User</button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPins.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No unused pins found matching your search.
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EPinUnused;
