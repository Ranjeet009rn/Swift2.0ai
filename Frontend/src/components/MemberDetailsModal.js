import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, MapPin, CreditCard, Users, CheckCircle, Smartphone, Mail, Calendar, Hash, Building, TrendingUp } from 'lucide-react';

const MemberDetailsModal = ({ isOpen, onClose, userId, loading, data, onEdit }) => {
    const [activeTab, setActiveTab] = useState('identity');

    // Scroll lock effect
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'identity', label: 'Identity', icon: User },
        { id: 'location', label: 'Location', icon: MapPin },
        { id: 'bank', label: 'KYC & Bank', icon: CreditCard },
        { id: 'network', label: 'Network', icon: Users },
    ];

    const DetailRow = ({ label, value, icon: Icon }) => (
        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2 hover:bg-gray-100 transition-colors">
            {Icon && <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border border-gray-200 mr-3 shrink-0"><Icon size={14} /></div>}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800 truncate" title={value}>{value || 'N/A'}</p>
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">Member Details</h2>
                        <p className="text-xs text-gray-400 mt-1">ID: <span className="text-white font-mono">{userId || 'N/A'}</span></p>
                    </div>
                    <div className="flex gap-2">
                        {!loading && data && onEdit && (
                            <button
                                onClick={() => onEdit(userId, data)}
                                className="hover:bg-white/10 p-2 rounded-full transition-colors flex items-center gap-2 text-sm bg-indigo-600 px-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit
                            </button>
                        )}
                        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b shrink-0 bg-white overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-sm font-medium">Fetching member details...</p>
                        </div>
                    ) : data ? (
                        <div className="animate-fadeIn">
                            {activeTab === 'identity' && (
                                <div className="space-y-1">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-white">
                                            {data.identity.full_name?.charAt(0)}
                                        </div>
                                    </div>
                                    <DetailRow label="Full Name" value={data.identity.full_name} icon={User} />
                                    <DetailRow label="Username" value={data.identity.username} icon={Hash} />
                                    <DetailRow label="Email" value={data.identity.email} icon={Mail} />
                                    <DetailRow label="Mobile" value={data.identity.mobile} icon={Smartphone} />
                                    <DetailRow label="Joining Date" value={data.identity.joining_date} icon={Calendar} />
                                </div>
                            )}

                            {activeTab === 'location' && (
                                <div className="space-y-1">
                                    <DetailRow label="Country" value={data.location.country_code} icon={MapPin} />
                                    <DetailRow label="State" value={data.location.state} icon={MapPin} />
                                    <DetailRow label="City" value={data.location.city} icon={MapPin} />
                                    <DetailRow label="Pincode" value={data.location.pincode} icon={Hash} />
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Full Address</p>
                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{data.location.address}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bank' && (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> KYC Documents</h4>
                                        <DetailRow label="PAN Number" value={data.kyc.pan_number} icon={CreditCard} />
                                        <DetailRow label="ID Number" value={data.kyc.id_number} icon={CreditCard} />
                                    </div>

                                    <div className="pt-2 border-t text-sm">
                                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 mt-2"><Building size={14} className="text-indigo-500" /> Bank Account</h4>
                                        {data.bank ? (
                                            <div className="space-y-1">
                                                <DetailRow label="Bank Name" value={data.bank.bank_name} />
                                                <DetailRow label="Account Holder" value={data.bank.account_holder} />
                                                <DetailRow label="Account Number" value={data.bank.account_number} />
                                                <DetailRow label="IFSC Code" value={data.bank.ifsc_code} />
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm text-center border border-yellow-100">
                                                No bank details available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'network' && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                        <p className="text-xs text-indigo-800 font-bold uppercase mb-1">Current Package</p>
                                        {data.package ? (
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold text-indigo-900">{data.package.name}</span>
                                                <span className="text-sm font-bold bg-white px-2 py-1 rounded text-indigo-600 border border-indigo-100">₹{parseFloat(data.package.price).toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-indigo-700">No active package</p>
                                        )}
                                    </div>

                                    <DetailRow label="Sponsor Name" value={data.network.sponsor_name} icon={User} />
                                    <DetailRow label="Sponsor ID" value={data.network.sponsor_code} icon={Hash} />
                                    <DetailRow label="Placement" value={data.network.placement_position} icon={Users} />

                                    <div className="mt-4 p-4 rounded-xl bg-gray-900 text-white text-center">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Status</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            <span className="font-bold">Active Member</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 border-t pt-4">
                                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-green-600" /> Earnings Info</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                <p className="text-[10px] uppercase font-bold text-green-700 tracking-wider mb-1">Total Earnings</p>
                                                <p className="text-lg font-bold text-green-800">₹ {(parseFloat(data.earnings?.total_earnings || 0)).toLocaleString()}</p>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider mb-1">Sponsor Amount</p>
                                                <p className="text-lg font-bold text-blue-800">₹ {(parseFloat(data.earnings?.sponsor_amount || 0)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <p>Failed to load data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MemberDetailsModal;
