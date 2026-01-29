import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { generateProtectedWithdrawalPDF } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';

import useLockBodyScroll from '../utils/useLockBodyScroll';

const Bank = () => {
  const { user } = useAuth();
  const [bankDetails, setBankDetails] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', content: '', password: '' });
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useLockBodyScroll(showModal || showPasswordPrompt);

  useEffect(() => {
    const fetchBankData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        // Using direct fetch for now, but API endpoint should be consistent with config
        const response = await fetch('http://localhost/mlm/backend/api/user/withdrawals.php', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setBankDetails(data.bank_details);
          setWithdrawals(data.withdrawals);
        }
      } catch (error) {
        console.error("Failed to fetch bank data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBankData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'processing':
        return <Clock className="text-blue-600" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      default:
        return <AlertCircle className="text-red-600" size={20} />;
    }
  };

  const downloadWithdrawalHistory = () => {
    // Show password prompt first
    setShowPasswordPrompt(true);
  };

  const handlePasswordSubmit = async () => {
    const validUserId = user?.user_id || 'DEMO';

    // Verify password (using User ID as verification as per previous logic)
    if (passwordInput !== validUserId) {
      setPasswordError('Incorrect User ID. Please try again.');
      return;
    }

    // Password correct, generate PDF
    setShowPasswordPrompt(false);
    setPasswordInput('');
    setPasswordError('');

    const userName = user?.name || 'User';

    // Generate PDF
    await generateProtectedWithdrawalPDF(withdrawals, bankDetails, validUserId, userName);

    // Show success modal
    setModalMessage({
      title: 'Receipt Downloaded Successfully!',
      content: 'PDF file has been downloaded to your device',
      password: ''
    });
    setShowModal(true);
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Transaction History</h1>
          <p className="text-gray-600 mt-1">View your withdrawal transaction records</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Withdrawal History</h3>
            <button
              onClick={downloadWithdrawalHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Download size={18} />
              <span className="font-semibold">Download PDF Receipt</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Deductions</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Net Amount</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800">₹ {parseFloat(withdrawal.amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-red-600">
                      ₹ {(parseFloat(withdrawal.admin_fee) + parseFloat(withdrawal.tds)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-green-600">₹ {parseFloat(withdrawal.net_amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className="text-sm font-medium capitalize">{withdrawal.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {withdrawal.transaction_id || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative animate-scaleIn">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-8">
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">localhost:3000 says</p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                    <p className="text-white font-medium">{modalMessage.title}</p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-500 text-xl flex-shrink-0">🔒</span>
                    <p className="text-white font-medium">{modalMessage.content}</p>
                  </div>

                  {modalMessage.password && (
                    <>
                      <div className="flex items-start space-x-3">
                        <span className="text-yellow-500 text-xl flex-shrink-0">🔑</span>
                        <p className="text-white font-medium">Password: {modalMessage.password}</p>
                      </div>

                      <div className="pt-2">
                        <p className="text-gray-300 text-sm">
                          Open the HTML file in your browser and enter your User ID to view the receipt.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-8 py-2 bg-pink-400 hover:bg-pink-500 text-gray-900 rounded-full font-semibold transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative animate-scaleIn">
            {/* Close button */}
            <button
              onClick={() => {
                setShowPasswordPrompt(false);
                setPasswordInput('');
                setPasswordError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-8">
              <div className="mb-6">
                <div className="text-center mb-4">
                  <span className="text-6xl">🔐</span>
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Password Protected</h3>
                <p className="text-gray-400 text-sm text-center">Enter your User ID to download the receipt</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your User ID"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-400">{passwordError}</p>
                  )}
                </div>

                <button
                  onClick={handlePasswordSubmit}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default Bank;
