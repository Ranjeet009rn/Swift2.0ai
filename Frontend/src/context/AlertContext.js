import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({
        isOpen: false,
        message: '',
        type: 'success', // success, error, info
        title: 'Nexway',
        onConfirm: null,
    });

    const showAlert = useCallback((message, type = 'success', title = 'Nexway') => {
        setAlertState({
            isOpen: true,
            message,
            type,
            title,
            onConfirm: null,
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {/* Global Alert Component */}
            {alertState.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity"
                        onClick={hideAlert}
                    />

                    {/* Alert Modal */}
                    <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-[340px] overflow-hidden transform transition-all animate-scaleIn p-6 text-center">

                        {/* Logo */}
                        <div className="mb-6 flex justify-center">
                            <img src="/logo.png" alt="Nexway Logo" className="h-16 w-auto object-contain" />
                        </div>

                        {/* Icon */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${alertState.type === 'error' ? 'bg-red-50 text-red-500' :
                                alertState.type === 'info' ? 'bg-blue-50 text-blue-500' :
                                    'bg-green-50 text-green-500'
                            }`}>
                            {alertState.type === 'error' ? <AlertCircle size={32} strokeWidth={2.5} /> :
                                alertState.type === 'info' ? <Info size={32} strokeWidth={2.5} /> :
                                    <CheckCircle size={32} strokeWidth={2.5} />}
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {alertState.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            {alertState.message}
                        </p>

                        {/* Action Button */}
                        <button
                            onClick={hideAlert}
                            className={`w-full py-3 rounded-2xl text-sm font-bold text-white shadow-lg shadow-gray-200 transition-all transform active:scale-[0.98] hover:-translate-y-0.5 ${alertState.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                                alertState.type === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                                    'bg-gray-900 hover:bg-black'
                                }`}
                        >
                            Okay, Got it
                        </button>
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
        </AlertContext.Provider>
    );
};

export default AlertContext;
