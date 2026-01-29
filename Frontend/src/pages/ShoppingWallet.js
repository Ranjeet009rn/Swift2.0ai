import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Wallet, TrendingUp, TrendingDown, Gift, ArrowRight, Clock } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const ShoppingWallet = () => {
    const { showAlert } = useAlert();
    const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [epinCode, setEpinCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);

    const fetchWalletData = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/user/shopping_wallet.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setWalletData(data);
            }
        } catch (error) {
            showAlert('Failed to fetch wallet data', 'error');
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const handleRedeemEpin = async (e) => {
        e.preventDefault();
        if (!epinCode.trim()) {
            showAlert('Please enter E-Pin code', 'error');
            return;
        }

        setRedeeming(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/user/redeem_epin.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ epinCode: epinCode.trim() })
            });
            const data = await response.json();
            if (data.success) {
                showAlert(data.message, 'success');
                setEpinCode('');
                fetchWalletData();
            } else {
                showAlert(data.message || 'Redemption failed', 'error');
            }
        } catch (error) {
            showAlert('Failed to redeem E-Pin', 'error');
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shopping Wallet</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your shopping balance and redeem E-Pins</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Balance Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                        <Wallet size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/80 font-medium">Shopping Balance</p>
                                        <p className="text-xs text-white/60">Available for purchases</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-8">
                                {loading ? (
                                    <div className="h-12 bg-white/20 rounded-lg animate-pulse"></div>
                                ) : (
                                    <p className="text-5xl font-bold">₹ {walletData.balance.toLocaleString()}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-xs text-white/70 mb-1">Total Credits</p>
                                    <p className="text-xl font-bold">
                                        ₹ {walletData.transactions
                                            .filter(t => t.transaction_type === 'credit')
                                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                            .toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-xs text-white/70 mb-1">Total Spent</p>
                                    <p className="text-xl font-bold">
                                        ₹ {walletData.transactions
                                            .filter(t => t.transaction_type === 'debit')
                                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                            .toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Clock size={20} className="text-gray-500" />
                                    Transaction History
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                    </div>
                                ) : walletData.transactions.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Wallet className="mx-auto text-gray-300" size={48} />
                                        <p className="text-gray-500 mt-4">No transactions yet</p>
                                    </div>
                                ) : (
                                    walletData.transactions.map((txn) => (
                                        <div key={txn.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${txn.transaction_type === 'credit'
                                                        ? 'bg-green-50 text-green-600'
                                                        : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {txn.transaction_type === 'credit' ? (
                                                            <TrendingUp size={20} />
                                                        ) : (
                                                            <TrendingDown size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{txn.description}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(txn.created_at).toLocaleString()}
                                                        </p>
                                                        {txn.reference_id && (
                                                            <p className="text-xs text-gray-400 font-mono mt-1">
                                                                Ref: {txn.reference_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${txn.transaction_type === 'credit'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                        }`}>
                                                        {txn.transaction_type === 'credit' ? '+' : '-'}₹{parseFloat(txn.amount).toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Balance: ₹{parseFloat(txn.balance_after).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Redeem E-Pin Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Gift size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">Redeem E-Pin</h3>
                            </div>
                            <form onSubmit={handleRedeemEpin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Enter E-Pin Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="EP1234567890AB"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                                        value={epinCode}
                                        onChange={(e) => setEpinCode(e.target.value.toUpperCase())}
                                        disabled={redeeming}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={redeeming || !epinCode.trim()}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {redeeming ? 'Redeeming...' : (
                                        <>
                                            Redeem Now
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                                <p className="text-xs text-indigo-900 font-semibold mb-2">How to redeem?</p>
                                <ul className="text-xs text-indigo-700 space-y-1">
                                    <li>• Enter your E-Pin code above</li>
                                    <li>• Click "Redeem Now"</li>
                                    <li>• Balance will be added instantly</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
                            <h4 className="font-bold text-lg mb-2">Need E-Pins?</h4>
                            <p className="text-sm text-white/80 mb-4">
                                Request new E-Pins from the E-Pin System menu
                            </p>
                            <button
                                onClick={() => window.location.href = '/epin/apply'}
                                className="w-full py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors"
                            >
                                Request E-Pins
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ShoppingWallet;

