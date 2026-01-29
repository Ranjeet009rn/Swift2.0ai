import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAlert } from '../context/AlertContext';
import apiService from '../services/apiService';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  Landmark,
  Crown,
  Star,
  Gem,
  Rocket,
  Loader,
  ArrowRight,
  Trophy
} from 'lucide-react';
import { motion } from 'motion/react';
import ScrollVelocity from '../components/ScrollVelocity';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPackages();
        if (response.success && response.data) {
          setPackages(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
        showAlert('Failed to load packages', 'error', 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [showAlert]);



  const handlePurchase = async (packageId) => {
    setPurchasing(packageId);
    try {
      // Defaulting to 'wallet' as payment method for now
      const response = await apiService.purchasePackage(packageId, 'wallet');
      if (response.success) {
        showAlert('Package purchased successfully!', 'success', 'Success');
      } else {
        showAlert(response.message || 'Purchase failed', 'error', 'Error');
      }
    } catch (error) {
      showAlert(error.message || 'Purchase failed', 'error', 'Error');
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageStyle = (index) => {
    // 0: Basic, 1: Standard, 2: Popular (Gold/Premium), 3: Ultimate
    const styles = [
      {
        border: 'border-slate-200',
        bg: 'bg-white',
        header: 'text-slate-900',
        button: 'bg-slate-900 hover:bg-slate-800 text-white',
        accent: 'text-slate-900',
        icon: Star
      },
      {
        border: 'border-blue-100',
        bg: 'bg-white',
        header: 'text-blue-900',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        accent: 'text-blue-600',
        icon: Rocket
      },
      {
        border: 'border-violet-200',
        bg: 'bg-white',
        header: 'text-violet-900',
        button: 'bg-violet-600 hover:bg-violet-700 text-white',
        accent: 'text-violet-600',
        badge: 'Most Popular',
        icon: Crown
      },
      {
        border: 'border-emerald-100',
        bg: 'bg-white',
        header: 'text-emerald-900',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        accent: 'text-emerald-600',
        icon: Gem
      }
    ];
    return styles[index % styles.length];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Simple Pricing, <span className="text-blue-600">Powerful Earnings</span>
            </h1>
            <p className="mt-4 text-xl text-slate-500">
              Choose the package that fits your goals. Upgrade anytime as you grow.
            </p>
          </motion.div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packages.map((pkg, index) => {
            const style = getPackageStyle(index);
            const Icon = style.icon;
            const isPopular = index === 2; // Assuming the 3rd one is popular

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative flex flex-col p-6 rounded-3xl border-2 ${style.border} ${style.bg} shadow-sm hover:shadow-xl transition-all duration-300 ${isPopular ? 'ring-4 ring-violet-100' : ''}`}
              >
                {style.badge && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-violet-600 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg tracking-wider uppercase whitespace-nowrap">
                      {style.badge}
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className="mb-6 pt-2">
                  <div className={`inline-flex p-3 rounded-2xl ${style.bg === 'bg-slate-900' ? 'bg-slate-800' : 'bg-slate-50'} mb-4`}>
                    <Icon className={`w-8 h-8 ${style.accent}`} strokeWidth={1.5} />
                  </div>
                  <h3 className={`text-2xl font-bold ${style.header}`}>{pkg.package_name}</h3>
                  <div className="mt-4 flex flex-wrap items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      ₹{parseFloat(pkg.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-base font-medium text-slate-400 whitespace-nowrap">/one-time</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {(pkg.features ? (typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features) : []).map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircle2 className={`w-5 h-5 ${style.accent}`} />
                      </div>
                      <p className="ml-3 text-sm text-slate-600 font-medium">{feature}</p>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing === pkg.id}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-center transition-all shadow-lg hover:shadow-xl ${style.button} active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === pkg.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="animate-spin w-5 h-5" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center group">
                      <span>Get Started</span>
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Features Inclusion Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Everything you need to succeed</h2>
            <p className="text-slate-500 mt-2">All plans include these core benefits</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Full Income Access", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
              { title: "Rank Eligibility", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
              { title: "Secure Payments", icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
              { title: "Daily Payouts", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" }
            ].map((item, idx) => (
              <div key={idx} className="group flex items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-xl ${item.bg} group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
                </div>
                <span className="ml-4 font-semibold text-slate-700">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods - Kept Exactly as Requested */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden mt-12">
          <h4 className="text-center text-slate-500 text-sm font-semibold tracking-wider uppercase mb-8">
            Secure Payment Partners
          </h4>
          <div className="w-full">
            <ScrollVelocity
              velocity={30}
              className=""
              texts={[
                <div className="flex items-center gap-16 px-8 select-none">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm transition-all hover:scale-110">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm transition-all hover:scale-110">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm transition-all hover:scale-110">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm transition-all hover:scale-110">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2 px-4 transition-all hover:scale-110">
                    <Landmark className="text-blue-900" size={24} />
                    <span className="text-gray-800 font-bold text-sm whitespace-nowrap">Net Banking</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm transition-all hover:scale-110">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-6 w-auto object-contain" />
                  </div>
                </div>
              ]}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Packages;
