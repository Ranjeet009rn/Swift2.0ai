import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, X, RefreshCw, User, Shield } from 'lucide-react';

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-gray-100 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-600 text-sm max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [activeTab, setActiveTab] = useState('user'); // user, admin, franchise

  // Using email instead of username as per request
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  useEffect(() => {
    generateCaptcha();
    setCaptchaInput('');
    setError('');
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Verify Captcha (Enabled)
    if (captchaInput.toUpperCase() !== captchaCode) {
      setError('Invalid Verification Code. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Pass role/type based on active tab
      const result = await login(formData.email, formData.password, activeTab);
      if (!result.success) {
        setError(result.message || 'Login failed. Please try again.');
        generateCaptcha(); // Refresh captcha on failure
        setCaptchaInput('');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex overflow-hidden font-sans bg-gray-50 relative">
      {/* Mobile Background Image (visible only on mobile) */}
      <div className="lg:hidden absolute inset-0 z-0">
        <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-500 ${activeTab === 'user' ? 'from-blue-100/20 to-indigo-100/20' : 'from-purple-100/20 to-pink-100/20'}`}></div>
        <img
          src={process.env.PUBLIC_URL + (activeTab === 'user' ? "/login_visual_user.png" : "/login_visual_admin.png")}
          alt="Background"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Left Side - Login Form - Full White Background on Desktop */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 lg:bg-white">
        <div className="w-full max-w-sm space-y-5 bg-white/25 backdrop-blur-md lg:bg-transparent p-5 sm:p-6 lg:p-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-white/50 lg:border-0">

          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {activeTab === 'user' ? 'User Login' : 'Admin Login'}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">Welcome back! Please enter your details.</p>
          </div>

          {/* Custom Tab Switcher - User & Admin Only */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => { setActiveTab('user'); setFormData({ email: '', password: '' }); setError(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={16} className="hidden sm:block" /> User
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setFormData({ email: '', password: '' }); setError(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'admin' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Shield size={16} className="hidden sm:block" /> Admin
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center animate-shake">
              <span className="font-medium mr-1">Error:</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                placeholder={`Enter ${activeTab} email`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Captcha Section */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Verification Code</label>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 bg-gray-100 border-2 border-gray-200 rounded-lg px-4 py-3 text-lg font-mono font-bold text-gray-700 tracking-widest select-none relative overflow-hidden text-center"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)' }}
                >
                  <span className="relative z-10">{captchaCode}</span>
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} /> <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium mt-2"
                placeholder="Enter code shown above"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-3.5 rounded-xl hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center space-x-2 text-base ${activeTab === 'user' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'}`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Login as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
              )}
            </button>
          </form>

          {/* Register Link (Only for User Tab) */}
          {activeTab === 'user' && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Register Now
                </button>
              </p>
            </div>
          )}



          {/* Footer Links */}
          <div className="text-center pt-4 border-t border-gray-100 mt-6">
            <p className="text-xs text-gray-400">
              <button onClick={() => setActiveModal('terms')} className="hover:text-gray-600">Terms</button>
              {' • '}
              <button onClick={() => setActiveModal('privacy')} className="hover:text-gray-600">Privacy Policy</button>
            </p>
          </div>


        </div>
      </div>

      {/* Right Side - Visual (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-50 items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-500 ${activeTab === 'user' ? 'from-blue-100/30 to-indigo-100/30' : 'from-purple-100/30 to-pink-100/30'}`}></div>

        {/* Main Image */}
        <div className="relative z-10 w-full h-full">
          <img
            src={process.env.PUBLIC_URL + (activeTab === 'user' ? "/login_visual_user.png" : "/login_visual_admin.png")}
            alt="Network Growth"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>


      {/* Modals */}
      <Modal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
      >
        <div className="space-y-4">
          <p><strong>Last Updated: January 2026</strong></p>
          <p>Welcome to SwiftMLM. By accessing our website, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

          <h4 className="text-gray-900 font-bold mt-4">1. Acceptance of Terms</h4>
          <p>By registering an account, you agree to become an independent distributor/franchise of SwiftMLM and agree to abide by the company's policies and procedures.</p>

          <h4 className="text-gray-900 font-bold mt-4">2. Use License</h4>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on SwiftMLM's website for personal, non-commercial transitory viewing only.</p>

          <h4 className="text-gray-900 font-bold mt-4">3. Disclaimer</h4>
          <p>The materials on SwiftMLM's website are provided on an 'as is' basis. SwiftMLM makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement.</p>

          <h4 className="text-gray-900 font-bold mt-4">4. Limitations</h4>
          <p>In no event shall SwiftMLM or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SwiftMLM's website.</p>

          <h4 className="text-gray-900 font-bold mt-4">5. Governing Law</h4>
          <p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
      >
        <div className="space-y-4">
          <p><strong>Effective Date: January 25, 2025</strong></p>
          <p>Your privacy is important to us. It is SwiftMLM's policy to respect your privacy regarding any information we may collect from you across our website.</p>

          <h4 className="text-gray-900 font-bold mt-4">1. Information We Collect</h4>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.</p>

          <h4 className="text-gray-900 font-bold mt-4">2. Usage of Information</h4>
          <p>We use the collected data to provide, maintain, and improve our services, to communicate with you, and to comply with legal obligations. We do not share your personal information publicly or with third-parties, except when required to by law.</p>

          <h4 className="text-gray-900 font-bold mt-4">3. Data Retention</h4>
          <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we'll protect within commercially acceptable means to prevent loss and theft.</p>

          <h4 className="text-gray-900 font-bold mt-4">4. Security</h4>
          <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure.</p>
        </div>
      </Modal>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default Login;
