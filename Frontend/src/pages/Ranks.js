import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Award, Lock, CheckCircle, Medal, Trophy, Crown, Star, Zap, Gift as GiftIcon, TrendingUp, Users, Package, X, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import useLockBodyScroll from '../utils/useLockBodyScroll';

const Ranks = () => {
  const [ranksData, setRanksData] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  const [claimedRewards, setClaimedRewards] = useState([]); // Track claimed rewards
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);

  useLockBodyScroll(showStatsModal || showCongrats);

  useEffect(() => {
    const fetchRanks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost/mlm/backend/api/user/ranks.php', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setRanksData({ ranks: data.ranks });
          setUserRank(data.user_rank);
        }
      } catch (error) {
        console.error("Failed to fetch ranks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanks();
  }, []);

  const handleClaimReward = (reward) => {
    setClaimedReward(reward);
    setShowCongrats(true);

    // Mark as claimed
    setClaimedRewards([...claimedRewards, reward.id]);

    // Auto close after 5 seconds
    setTimeout(() => {
      setShowCongrats(false);
    }, 5000);
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
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Rank & Rewards
          </h1>
          <p className="text-gray-600 text-lg">Achieve milestones and unlock exclusive rewards</p>
        </div>

        {/* Current Rank Banner */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-yellow-600 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                <Trophy size={48} strokeWidth={2} />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">Your Current Rank</p>
                <h2 className="text-5xl font-bold mb-2">{userRank?.current_rank}</h2>
                <p className="text-white/80 text-sm">Keep going to reach {userRank?.next_rank}!</p>
              </div>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <p className="text-white/90 text-sm font-medium mb-2">Next Milestone</p>
              <p className="text-3xl font-bold">{userRank?.next_rank}</p>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => {
              setSelectedStat({
                type: 'earnings',
                title: 'Total Earned',
                value: userRank?.user_stats?.total_earned,
                percentage: userRank?.progress?.earnings?.percentage,
                color: 'blue',
                icon: TrendingUp
              });
              setShowStatsModal(true);
            }}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-100 hover:shadow-2xl transition-all cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <TrendingUp className="text-blue-600" size={24} strokeWidth={2} />
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full">
                <span className="text-blue-700 text-xs font-bold">{userRank?.progress?.earnings?.percentage?.toFixed(1) || '0'}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-2">Total Earned</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">₹ {userRank?.user_stats?.total_earned?.toLocaleString('en-IN') || '0'}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(userRank?.progress?.earnings?.percentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedStat({
                type: 'team',
                title: 'Team Size',
                value: userRank?.user_stats?.team_size,
                percentage: userRank?.progress?.team_size?.percentage,
                color: 'green',
                icon: Users
              });
              setShowStatsModal(true);
            }}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-100 hover:shadow-2xl transition-all cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <Users className="text-green-600" size={24} strokeWidth={2} />
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full">
                <span className="text-green-700 text-xs font-bold">{userRank?.progress?.team_size?.percentage?.toFixed(1) || '0'}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-2">Team Size</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">{userRank?.user_stats?.team_size || '0'}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(userRank?.progress?.team_size?.percentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedStat({
                type: 'package',
                title: 'Package Value',
                value: userRank?.user_stats?.total_package_value,
                percentage: userRank?.progress?.package_value?.percentage,
                color: 'purple',
                icon: Package
              });
              setShowStatsModal(true);
            }}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-purple-100 hover:shadow-2xl transition-all cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Package className="text-purple-600" size={24} strokeWidth={2} />
              </div>
              <div className="bg-purple-50 px-3 py-1 rounded-full">
                <span className="text-purple-700 text-xs font-bold">{userRank?.progress?.package_value?.percentage?.toFixed(1) || '0'}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-2">Package Value</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">₹ {userRank?.user_stats?.total_package_value?.toLocaleString('en-IN') || '0'}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(userRank?.progress?.package_value?.percentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Rank Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Ranks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ranksData?.ranks?.map((rank) => {
              const getRankIcon = (name) => {
                if (name === 'Silver') return Medal;
                if (name === 'Gold') return Trophy;
                if (name === 'Platinum') return Crown;
                if (name === 'Diamond') return Star;
                if (name === 'Ruby') return Zap;
                return Award;
              };
              const Icon = getRankIcon(rank.name);

              return (
                <div
                  key={rank.id}
                  className={`rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${rank.achieved
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white hover:scale-105'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${rank.achieved ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
                      <Icon className={rank.achieved ? 'text-white' : 'text-gray-400'} size={40} strokeWidth={2} />
                    </div>
                    {rank.achieved ? (
                      <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full">
                        <CheckCircle size={28} className="text-white" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-2.5 rounded-full">
                        <Lock size={28} className="text-gray-400" strokeWidth={2} />
                      </div>
                    )}
                  </div>

                  <h3 className={`text-3xl font-bold mb-4 ${rank.achieved ? 'text-white' : 'text-gray-900'}`}>
                    {rank.name}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className={`flex justify-between items-center p-3 rounded-lg ${rank.achieved ? 'bg-white/10 backdrop-blur-sm' : 'bg-gray-50'}`}>
                      <span className={`text-sm font-medium ${rank.achieved ? 'text-white/90' : 'text-gray-600'}`}>Target Amount</span>
                      <span className={`font-bold ${rank.achieved ? 'text-white' : 'text-gray-900'}`}>₹ {rank.target_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${rank.achieved ? 'bg-white/10 backdrop-blur-sm' : 'bg-gray-50'}`}>
                      <span className={`text-sm font-medium ${rank.achieved ? 'text-white/90' : 'text-gray-600'}`}>Total Reward</span>
                      <span className={`font-bold ${rank.achieved ? 'text-white' : 'text-gray-900'}`}>₹ {rank.reward_amount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className={`space-y-2 mb-6 p-4 rounded-xl ${rank.achieved ? 'bg-white/10 backdrop-blur-sm' : 'bg-gray-50'}`}>
                    <div className={`text-xs font-semibold mb-3 ${rank.achieved ? 'text-white/80' : 'text-gray-500'}`}>
                      REQUIREMENTS
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${rank.achieved ? 'text-white' : 'text-gray-700'}`}>
                      <CheckCircle size={16} strokeWidth={2.5} />
                      <span>Min Earnings: ₹ {rank.min_earnings?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${rank.achieved ? 'text-white' : 'text-gray-700'}`}>
                      <CheckCircle size={16} strokeWidth={2.5} />
                      <span>Team Size: {rank.min_team_size}+ members</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${rank.achieved ? 'text-white' : 'text-gray-700'}`}>
                      <CheckCircle size={16} strokeWidth={2.5} />
                      <span>Package: ₹ {rank.min_package_value?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {rank.achieved && !rank.reward_claimed && (
                    <button className="w-full bg-white text-yellow-600 py-3.5 rounded-xl font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2">
                      <GiftIcon size={20} />
                      <span>Claim Reward</span>
                    </button>
                  )}

                  {rank.achieved && rank.reward_claimed && (
                    <div className="w-full bg-white/20 backdrop-blur-sm py-3.5 rounded-xl text-center font-bold flex items-center justify-center space-x-2">
                      <CheckCircle size={20} />
                      <span>Reward Claimed</span>
                    </div>
                  )}

                  {!rank.achieved && (
                    <div className="w-full bg-gray-100 py-3.5 rounded-xl text-center font-bold text-gray-500 flex items-center justify-center space-x-2">
                      <Lock size={20} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Awards & Recent Rewards Sections Removed to avoid demo data */}
      </div>

      {/* Stats Modal with Graph */}
      {showStatsModal && selectedStat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${selectedStat.color === 'blue' ? 'from-blue-500 to-indigo-600' :
              selectedStat.color === 'green' ? 'from-green-500 to-emerald-600' :
                'from-purple-500 to-violet-600'
              } p-5 text-white relative`}>
              <button
                onClick={() => setShowStatsModal(false)}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center space-x-3">
                {selectedStat.icon && <selectedStat.icon size={32} strokeWidth={2} />}
                <div>
                  <h2 className="text-xl font-bold">{selectedStat.title}</h2>
                  <p className="text-white/90 text-xs">Progress Overview</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Current Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className={`p-3 rounded-xl ${selectedStat.color === 'blue' ? 'bg-blue-50 border-2 border-blue-200' :
                  selectedStat.color === 'green' ? 'bg-green-50 border-2 border-green-200' :
                    'bg-purple-50 border-2 border-purple-200'
                  }`}>
                  <p className="text-xs text-gray-600 font-medium mb-1">Current Value</p>
                  <p className={`text-2xl font-bold ${selectedStat.color === 'blue' ? 'text-blue-600' :
                    selectedStat.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`}>
                    {selectedStat.type === 'team'
                      ? selectedStat.value
                      : `₹ ${selectedStat.value?.toLocaleString('en-IN')}`}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${selectedStat.color === 'blue' ? 'bg-blue-50 border-2 border-blue-200' :
                  selectedStat.color === 'green' ? 'bg-green-50 border-2 border-green-200' :
                    'bg-purple-50 border-2 border-purple-200'
                  }`}>
                  <p className="text-xs text-gray-600 font-medium mb-1">Progress</p>
                  <p className={`text-2xl font-bold ${selectedStat.color === 'blue' ? 'text-blue-600' :
                    selectedStat.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`}>
                    {selectedStat.percentage?.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Graph */}
              <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                <h3 className="text-base font-bold text-gray-800 mb-3">6-Month Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[
                    { month: 'Aug', value: selectedStat.type === 'team' ? 120 : 150000 },
                    { month: 'Sep', value: selectedStat.type === 'team' ? 180 : 220000 },
                    { month: 'Oct', value: selectedStat.type === 'team' ? 250 : 310000 },
                    { month: 'Nov', value: selectedStat.type === 'team' ? 320 : 380000 },
                    { month: 'Dec', value: selectedStat.type === 'team' ? 410 : 440000 },
                    { month: 'Jan', value: selectedStat.value || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => selectedStat.type === 'team' ? value : `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={
                        selectedStat.color === 'blue' ? '#3b82f6' :
                          selectedStat.color === 'green' ? '#10b981' :
                            '#a855f7'
                      }
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowStatsModal(false)}
                className="mt-5 w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2.5 rounded-xl font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongrats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-6 text-white relative overflow-hidden">
              {/* Confetti Animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="confetti"></div>
                <div className="confetti"></div>
                <div className="confetti"></div>
                <div className="confetti"></div>
                <div className="confetti"></div>
                <div className="confetti"></div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowCongrats(false)}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Trophy Icon */}
              <div className="flex justify-center mb-3 relative z-10">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full animate-bounce">
                  <Trophy size={40} strokeWidth={2} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-1 relative z-10">🎉 Congratulations! 🎉</h2>
              <p className="text-center text-white/90 text-sm relative z-10">You've claimed your reward!</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-4 mb-4 w-full">
                  <Sparkles className="text-yellow-600 mx-auto mb-2" size={36} strokeWidth={2} />
                  <p className="text-gray-600 text-xs font-medium mb-1">{claimedReward?.type}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{claimedReward?.name}</h3>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600 text-xs mb-1">Reward Amount</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      ₹{claimedReward?.amount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  Your reward has been credited to your wallet successfully!
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => setShowCongrats(false)}
                    className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Awesome! 🎊
                  </button>
                  <button
                    onClick={() => {
                      setShowCongrats(false);
                      // Navigate to bank/wallet page
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    View Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #fbbf24;
          animation: confetti-fall 3s linear infinite;
        }
        .confetti:nth-child(1) {
          left: 10%;
          animation-delay: 0s;
          background: #fbbf24;
        }
        .confetti:nth-child(2) {
          left: 20%;
          animation-delay: 0.3s;
          background: #f59e0b;
        }
        .confetti:nth-child(3) {
          left: 30%;
          animation-delay: 0.6s;
          background: #fbbf24;
        }
        .confetti:nth-child(4) {
          left: 50%;
          animation-delay: 0.9s;
          background: #f59e0b;
        }
        .confetti:nth-child(5) {
          left: 60%;
          animation-delay: 1.2s;
          background: #fbbf24;
        }
        .confetti:nth-child(6) {
          left: 70%;
          animation-delay: 1.5s;
          background: #f59e0b;
        }
        .confetti:nth-child(7) {
          left: 80%;
          animation-delay: 1.8s;
          background: #fbbf24;
        }
        .confetti:nth-child(8) {
          left: 90%;
          animation-delay: 2.1s;
          background: #f59e0b;
        }
      `}</style>
    </Layout>
  );
};

export default Ranks;
