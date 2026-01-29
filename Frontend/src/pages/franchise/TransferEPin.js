import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Send, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';

const TransferEPin = () => {
    const { showAlert } = useAlert();
    const [recipientId, setRecipientId] = useState('');
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [qty, setQty] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedUser, setVerifiedUser] = useState(null);

    const [stocks, setStocks] = useState([]);

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/franchise/stocks.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setStocks(data.data);
            }
        } catch (error) {
            console.error('Error fetching stocks:', error);
        }
    };

    const handleVerify = async () => {
        if (!recipientId) return;
        setIsVerifying(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/franchise/verify_user.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: recipientId })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setVerifiedUser(data.data); // Should contain name, rank, id
            } else {
                showAlert(data.message || 'User not found', 'error');
                setVerifiedUser(null);
            }
        } catch (error) {
            console.error('Validation error:', error);
            showAlert('Validation failed', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleTransfer = async () => {
        if (!verifiedUser || !selectedPkg || !verificationCode) {
            showAlert('Please complete all steps including Security Code', 'error');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/franchise/transfer_epin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipient_id: verifiedUser.id,
                    package: selectedPkg,
                    quantity: qty,
                    pin: verificationCode
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showAlert(`Successfully transferred ${qty} ${selectedPkg} Pin(s) to ${verifiedUser.name}!`, 'success');
                setRecipientId('');
                setVerifiedUser(null);
                setSelectedPkg(null);
                setQty(1);
                fetchStocks(); // Refresh stocks
            } else {
                showAlert(data.message || 'Transfer failed', 'error');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            showAlert('An error occurred during transfer', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-8 pb-32">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">Transfer Stock</h1>
                    <p className="text-gray-500 mt-2">Send E-Pins directly to your team members' wallets.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
                    {/* Left Side: Form */}
                    <div className="space-y-10">
                        {/* Step 1: User Verification */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-orange-600/20">1</div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Verify Recipient</h3>
                            </div>
                            <div className="relative group">
                                <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${recipientId ? 'text-orange-600' : 'text-gray-400'}`} size={20} />
                                <input
                                    type="text"
                                    placeholder="Enter Member User ID (e.g. RS002)"
                                    className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-gray-800"
                                    value={recipientId}
                                    onChange={(e) => { setRecipientId(e.target.value.toUpperCase()); setVerifiedUser(null); }}
                                />
                                <button
                                    onClick={handleVerify}
                                    disabled={!recipientId || isVerifying}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                                >
                                    {isVerifying ? 'Verifying...' : 'Check ID'}
                                </button>
                            </div>
                            {verifiedUser && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-between animate-fadeIn">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm"><ShieldCheck size={20} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-green-700">Valid Member</p>
                                            <p className="font-black text-gray-900">{verifiedUser.name}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100/50 text-green-700 text-[10px] font-black uppercase tracking-tighter rounded-lg">{verifiedUser.rank}</span>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Package & Quantity */}
                        <div className={`space-y-6 transition-all duration-500 ${verifiedUser ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-orange-600/20">2</div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Selection & Quantity</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {stocks.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedPkg(s.name)}
                                        className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 ${selectedPkg === s.name ? 'border-orange-500 bg-orange-50/30' : 'border-gray-50 bg-gray-50/50 hover:border-orange-200'
                                            }`}
                                    >
                                        <p className="text-[10px] font-black text-gray-400 uppercase">{s.name}</p>
                                        <p className="text-sm font-black text-gray-900">Stock: {s.balance}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase block ml-4">Items to Send</label>
                                    <div className="flex bg-white border border-gray-200 rounded-3xl p-1 shadow-sm">
                                        <input
                                            type="number"
                                            className="flex-1 bg-transparent px-4 font-black text-lg outline-none"
                                            value={qty}
                                            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100">-</button>
                                            <button onClick={() => setQty(qty + 1)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Security Verification */}
                        <div className={`space-y-4 transition-all duration-500 ${selectedPkg ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-orange-600/20">3</div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Security Check</h3>
                            </div>

                            <div className="relative">
                                <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${verificationCode ? 'text-green-600' : 'text-gray-400'}`} size={20} />
                                <input
                                    type="password"
                                    placeholder="Enter Transformation / Master PIN"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-gray-800 tracking-widest"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 ml-4 font-bold">* Required for authorizing transfer</p>
                        </div>
                    </div>

                    {/* Right Side: Preview & Submit */}
                    <div className={`transition-all duration-700 ${selectedPkg ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                        <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden h-fit">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>

                            <h4 className="text-orange-500 font-black uppercase text-xs tracking-[0.3em] mb-10">Transfer Receipt</h4>

                            <div className="space-y-8 relative z-10">
                                <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-black text-white/40 uppercase mb-1">Source</p>
                                        <p className="font-extrabold text-sm tracking-tight text-white">MY WALLET</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center"><ArrowRight size={18} className="text-orange-500" /></div>
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-black text-white/40 uppercase mb-1">Destination</p>
                                        <p className="font-extrabold text-sm tracking-tight text-orange-400">{verifiedUser?.name || '---'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 px-2">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-white/40">Item Type</span>
                                        <span className="text-white uppercase italic">{selectedPkg || '--'} E-PIN</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-white/40">Total Quantity</span>
                                        <span className="text-white text-xl">{qty} Units</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold border-t border-white/10 pt-4">
                                        <span className="text-white/40">Fee Estimate</span>
                                        <span className="text-green-400 uppercase tracking-widest">Zero Fee</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTransfer}
                                    disabled={loading}
                                    className="w-full mt-10 py-5 bg-orange-600 hover:bg-orange-500 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 text-white shadow-xl shadow-orange-600/30"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={16} /> Authenticate & Transfer
                                        </>
                                    )}
                                </button>

                                <div className="flex gap-2 text-white/30 px-4 mt-6">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <p className="text-[9px] leading-relaxed font-bold">WARNING: This action is irreversible. Pins will be deducted from your stock immediately.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TransferEPin;
