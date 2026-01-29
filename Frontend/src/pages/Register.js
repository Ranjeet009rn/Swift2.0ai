import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { CheckCircle, User, Mail, Phone, Lock, Users, ChevronRight, ChevronLeft } from 'lucide-react';

const Register = () => {
    const [currentStep, setCurrentStep] = useState(1);
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

    const { signup } = useAuth();
    const navigate = useNavigate();

    const steps = [
        { number: 1, title: 'Personal Info', icon: User },
        { number: 2, title: 'Account Details', icon: Lock },
        { number: 3, title: 'Sponsor Info', icon: Users }
    ];

    const handleNext = () => {
        setError('');

        // Validation for each step
        if (currentStep === 1) {
            if (!formData.full_name || !formData.email || !formData.mobile) {
                setError('Please fill in all required fields');
                return;
            }
            if (formData.mobile.length !== 10) {
                setError('Mobile number must be 10 digits');
                return;
            }
        }

        if (currentStep === 2) {
            if (!formData.username || !formData.password || !formData.confirmPassword) {
                setError('Please fill in all required fields');
                return;
            }
            if (formData.username.length < 3) {
                setError('Username must be at least 3 characters');
                return;
            }
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = {
                username: formData.username,
                fullName: formData.full_name,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                sponsorId: formData.sponsor_id || ''
            };

            const result = await signup(userData);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = formData.password.length >= 8 ? 'strong' : formData.password.length >= 6 ? 'medium' : 'weak';

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Register New Member</h1>
                    <p className="text-gray-500 mt-2">Create a new account by following the steps below</p>
                </div>

                {/* Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep === step.number;
                            const isCompleted = currentStep > step.number;

                            return (
                                <React.Fragment key={step.number}>
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                                                    : 'bg-gray-200 text-gray-400'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle size={24} />
                                            ) : (
                                                <StepIcon size={24} />
                                            )}
                                        </div>
                                        <p
                                            className={`mt-2 text-sm font-medium ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`flex-1 h-1 mx-4 rounded transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                                                }`}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Personal Info */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="tel"
                                            required
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="9876543210"
                                            minLength="10"
                                            maxLength="10"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">10 digit mobile number</p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Account Details */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Account Details</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Choose a username"
                                            minLength="3"
                                            maxLength="20"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Lowercase letters and numbers only, 3-20 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Create a password"
                                            minLength="8"
                                        />
                                    </div>
                                    {formData.password && (
                                        <div className="mt-2">
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${passwordStrength === 'strong'
                                                        ? 'bg-green-500 w-full'
                                                        : passwordStrength === 'medium'
                                                            ? 'bg-yellow-500 w-2/3'
                                                            : 'bg-red-500 w-1/3'
                                                        }`}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Password strength: {passwordStrength === 'strong' ? 'Strong' : passwordStrength === 'medium' ? 'Medium' : 'Weak'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Confirm your password"
                                        />
                                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Sponsor Info */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Sponsor Information</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Sponsor ID <span className="text-gray-400">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={formData.sponsor_id}
                                            onChange={(e) => setFormData({ ...formData, sponsor_id: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Enter sponsor username or ID"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Leave empty if you don't have a sponsor</p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Review Your Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-700"><span className="font-medium">Name:</span> {formData.full_name}</p>
                                        <p className="text-gray-700"><span className="font-medium">Email:</span> {formData.email}</p>
                                        <p className="text-gray-700"><span className="font-medium">Mobile:</span> {formData.mobile}</p>
                                        <p className="text-gray-700"><span className="font-medium">Username:</span> {formData.username}</p>
                                        {formData.sponsor_id && (
                                            <p className="text-gray-700"><span className="font-medium">Sponsor:</span> {formData.sponsor_id}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                                <span>Previous</span>
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            <span>Complete Registration</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Register;
