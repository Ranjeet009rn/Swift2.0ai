import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning', // success, danger, warning
        onConfirm: null,
        onCancel: null,
    });

    const showConfirm = useCallback((title, message, type = 'warning') => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                type,
                onConfirm: () => {
                    setConfirmState((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState((prev) => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    const hideConfirm = useCallback(() => {
        if (confirmState.onCancel) {
            confirmState.onCancel();
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
    }, [confirmState]);

    return (
        <ConfirmContext.Provider value={{ showConfirm, hideConfirm }}>
            {children}
            {/* Global Confirmation Modal */}
            {confirmState.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity"
                        onClick={hideConfirm}
                    />

                    {/* Confirmation Modal */}
                    <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-[380px] overflow-hidden transform transition-all animate-scaleIn p-6 text-center">

                        {/* Logo */}
                        <div className="mb-6 flex justify-center">
                            <img src="/logo.png" alt="Nexway Logo" className="h-16 w-auto object-contain" />
                        </div>

                        {/* Icon */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmState.type === 'danger' ? 'bg-red-50 text-red-500' :
                                confirmState.type === 'success' ? 'bg-green-50 text-green-500' :
                                    'bg-yellow-50 text-yellow-500'
                            }`}>
                            {confirmState.type === 'danger' ? <XCircle size={32} strokeWidth={2.5} /> :
                                confirmState.type === 'success' ? <CheckCircle size={32} strokeWidth={2.5} /> :
                                    <AlertTriangle size={32} strokeWidth={2.5} />}
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {confirmState.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            {confirmState.message}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={confirmState.onCancel}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all transform active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmState.onConfirm}
                                className={`flex-1 px-4 py-3 text-white font-bold rounded-2xl shadow-lg shadow-gray-200 transition-all transform active:scale-[0.98] hover:-translate-y-0.5 ${confirmState.type === 'danger' ? 'bg-red-500 hover:bg-red-600' :
                                        confirmState.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                            'bg-yellow-500 hover:bg-yellow-600'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </ConfirmContext.Provider>
    );
};

export default ConfirmContext;
