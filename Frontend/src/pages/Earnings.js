import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { DollarSign, Filter, ChevronLeft, ChevronRight, Gift, Repeat, Target } from 'lucide-react';

import { useAuth } from '../context/AuthContext'; // Import hook

const Earnings = () => {
  const { user } = useAuth(); // Get user
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost/mlm/backend/api/user/earnings.php?page=${currentPage}&limit=${itemsPerPage}&type=${filterType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setEarnings(data.data);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch earnings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [currentPage, filterType]);

  const getEarningIcon = (type) => {
    const iconMap = {
      direct_income: <DollarSign className="text-yellow-600" size={20} />,
      sponsor_income: <Gift className="text-purple-600" size={20} />,
      recharge_income: <Repeat className="text-blue-600" size={20} />,
      rewards: <Target className="text-pink-600" size={20} />
    };
    return iconMap[type] || <DollarSign className="text-gray-600" size={20} />;
  };
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Earnings</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">ID: {user?.user_id || ''}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Earnings Breakdown</h3>
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400 sm:w-5 sm:h-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All</option>
                <option value="direct_income">Direct Income</option>
                <option value="sponsor_income">Sponsor Income</option>
                <option value="recharge_income">Recharge Income</option>
                <option value="rewards">Rewards</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Income Type</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Referrals / Level</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning) => (
                      <tr key={earning.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(earning.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="bg-gray-100 p-2 rounded-lg">
                              {getEarningIcon(earning.type)}
                            </div>
                            <span className="text-sm font-medium text-gray-800 capitalize">
                              {earning.type.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {earning.referrals_count > 0
                            ? `${earning.referrals_count} Referrals`
                            : `Level ${earning.level}`}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-lg font-bold text-gray-800">₹ {parseFloat(earning.amount).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {earning.status === 'credited' ? 'Credit' : earning.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.total_pages}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {[...Array(Math.min(pagination.total_pages, 3))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg ${pagination.current_page === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Earnings;
