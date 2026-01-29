import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle } from 'lucide-react';

// Reusing the Simple Modal Component - Light Theme Adapted
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

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    sponsor_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        sponsor_id: formData.sponsor_id || null
      };

      const result = await signup(userData);

      if (result.success) {
        // Show success message
        setError('');
        // Redirect to login page
        navigate('/login');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = formData.password.length >= 8 ? 'strong' : formData.password.length >= 6 ? 'medium' : 'weak';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background Decoration */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="MLM Logo" className="h-20 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">Join MLM and start your journey.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
              placeholder="Choose a username"
              minLength="3"
              maxLength="20"
            />
            <p className="text-xs text-gray-500 ml-1">Lowercase letters and numbers only, 3-20 characters</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
              placeholder="Enter your full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mobile</label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
                placeholder="9876543210"
                minLength="10"
                maxLength="10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
              placeholder="Create a password"
            />
            {formData.password && (
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div className={`h-full transition-all duration-300 ${passwordStrength === 'strong' ? 'bg-green-500 w-full' :
                  passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-1/3'
                  }`}></div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
                placeholder="Confirm password"
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Sponsor ID <span className="normal-case text-gray-400 font-normal">(Optional)</span></label>
            <input
              type="text"
              value={formData.sponsor_id}
              onChange={(e) => setFormData({ ...formData, sponsor_id: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold shadow-sm hover:border-gray-300"
              placeholder="Enter sponsor username"
            />
            <p className="text-xs text-gray-500 ml-1">Leave empty if you don't have a sponsor</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-500 text-xs text-center font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline underline-offset-4">Sign in</Link>
        </p>

        {/* Terms & Privacy Links */}
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={() => setActiveModal('terms')}
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors font-medium"
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveModal('privacy')}
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors font-medium"
          >
            Privacy Policy
          </button>
        </div>

      </div>

      {/* Reused Modals for Signup Page as well */}
      <Modal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
      >
        <p>Welcome to MLM. By accessing our website, you agree to be bound by these terms of service.</p>
        <p className="mt-2 text-xs text-gray-500">Full terms would be displayed here...</p>
      </Modal>

      <Modal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
      >
        <p>Your privacy is important to us. It is MLM's policy to respect your privacy regarding any information we may collect from you.</p>
        <p className="mt-2 text-xs text-gray-500">Full privacy policy would be displayed here...</p>
      </Modal>

    </div>
  );
};

export default Signup;
