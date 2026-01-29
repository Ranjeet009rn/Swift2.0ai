import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ShoppingCart, CreditCard, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';

const BuyEPin = () => {
    const { showAlert } = useAlert();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const [packages, setPackages] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/franchise/packages.php', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setPackages(data.data);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
            // Fallback empty or handle error
        } finally {
            setLoadingData(false);
        }
    };

    const handlePurchase = () => {
        if (!selectedPackage) {
            showAlert('Please select a package first', 'error');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            showAlert(`Successfully purchased ${quantity} ${selectedPackage.name} Pins!`, 'success');
            setLoading(false);
            setSelectedPackage(null);
            setQuantity(1);
        }, 1500);
    };

    const totalAmount = selectedPackage ? selectedPackage.price * quantity : 0;

    return (
        <Layout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 leading-tight">Stock Purchase</h1>
                    <p className="text-gray-500 mt-2">Buy new E-Pins to restock your franchise inventory.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Package Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {packages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer group ${selectedPackage?.id === pkg.id
                                        ? 'border-orange-500 bg-orange-50/50 shadow-xl scale-[1.02]'
                                        : 'border-gray-100 bg-white hover:border-orange-200'
                                        }`}
                                >
                                    {selectedPackage?.id === pkg.id && (
                                        <div className="absolute top-4 right-4 text-orange-500 bg-white rounded-full p-1 shadow-sm">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${pkg.theme === 'blue' ? 'bg-blue-600' :
                                        pkg.theme === 'indigo' ? 'bg-indigo-600' :
                                            pkg.theme === 'orange' ? 'bg-orange-600' : 'bg-purple-600'
                                        } text-white`}>
                                        <Package size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{pkg.desc}</p>
                                    <div className="mt-6">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price per Unit</p>
                                        <p className="text-2xl font-black text-gray-900">₹ {pkg.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                <ShoppingCart className="text-orange-500" size={20} />
                                Order Summary
                            </h2>

                            <div className="space-y-6">
                                {/* Quantity Picker */}
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Quantity</label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >-</button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="flex-1 bg-transparent text-center font-black text-xl text-gray-900 outline-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >+</button>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Package Type</span>
                                        <span className="font-bold text-gray-900">{selectedPackage?.name || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-bold text-gray-900">₹ {totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Processing Fee</span>
                                        <span className="font-bold text-green-600">FREE</span>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Payable</p>
                                            <p className="text-3xl font-black text-orange-600">₹ {totalAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePurchase}
                                    disabled={loading || !selectedPackage}
                                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-white shadow-xl transition-all ${selectedPackage
                                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] shadow-orange-500/25'
                                        : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Confirm Purchase
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center gap-2 text-gray-400 bg-gray-50 p-4 rounded-2xl">
                                    <AlertCircle size={16} />
                                    <p className="text-[10px] font-medium leading-tight">Pins will be instantly added to your inventory upon successful payment confirmation.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BuyEPin;
