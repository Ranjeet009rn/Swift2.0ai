import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { Save, Settings as SettingsIcon, Shield, Percent, User, Lock } from 'lucide-react';

const Settings = () => {
    const { settings, updateSettings } = useAdmin();
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [localSettings, setLocalSettings] = useState(settings);
    const [adminProfile, setAdminProfile] = useState({
        name: user?.name || 'Admin',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        setAdminProfile(prev => ({
            ...prev,
            name: user?.name || 'Admin',
            email: user?.email || ''
        }));
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLocalSettings({
            ...localSettings,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setAdminProfile({
            ...adminProfile,
            [name]: value
        });
    };

    const handleSaveProfile = async () => {
        if (adminProfile.newPassword) {
            if (adminProfile.newPassword !== adminProfile.confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            if (adminProfile.newPassword.length < 6) {
                showAlert('Password must be at least 6 characters', 'error');
                return;
            }
        }

        setSavingProfile(true);
        try {
            const token = localStorage.getItem('authToken');
            const updateData = {
                name: adminProfile.name
            };

            if (adminProfile.newPassword) {
                updateData.currentPassword = adminProfile.currentPassword;
                updateData.newPassword = adminProfile.newPassword;
            }

            const response = await fetch('http://localhost/mlm/backend/api/admin/update_profile.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Profile updated successfully!', 'success');

                // FORCE UPDATE LOCAL STORAGE
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = {
                    ...currentUser,
                    name: adminProfile.name,
                    // If backend sends specific user data, use that, otherwise trust frontend state
                    user_id: adminProfile.name // Since we are using user_id as name for admin
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                setAdminProfile(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));

                // Reload to refresh context with new localStorage data
                window.location.reload();
            } else {
                showAlert(data.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showAlert('Failed to update profile', 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveGeneral = () => {
        updateSettings(localSettings);
        showAlert('General settings saved successfully', 'success');
    };

    const handleSaveFinancial = () => {
        updateSettings(localSettings);
        showAlert('Financial settings updated', 'success');
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure global application parameters</p>
                </div>

                {/* Admin Profile Section */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <User size={28} />
                        <div>
                            <h2 className="text-xl font-bold">Admin Profile</h2>
                            <p className="text-purple-100 text-sm">Update your name and password</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-purple-100 mb-2">Admin Name</label>
                            <input
                                type="text"
                                name="name"
                                value={adminProfile.name}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-200 focus:ring-2 focus:ring-white/50 focus:outline-none"
                                placeholder="Enter your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-purple-100 mb-2">Email (Read-only)</label>
                            <input
                                type="email"
                                value={adminProfile.email}
                                disabled
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-purple-200 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock size={20} />
                            <h3 className="font-bold">Change Password</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-purple-100 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={adminProfile.currentPassword}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-200 focus:ring-2 focus:ring-white/50 focus:outline-none"
                                    placeholder="••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-purple-100 mb-2">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={adminProfile.newPassword}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-200 focus:ring-2 focus:ring-white/50 focus:outline-none"
                                    placeholder="••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-purple-100 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={adminProfile.confirmPassword}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-200 focus:ring-2 focus:ring-white/50 focus:outline-none"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <SettingsIcon className="text-blue-600" size={24} />
                            <h3 className="text-lg font-bold text-gray-900">General Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={localSettings.companyName || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                                <input
                                    type="email"
                                    name="supportEmail"
                                    value={localSettings.supportEmail || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Currency Symbol</label>
                                <select
                                    name="currency"
                                    value={localSettings.currency || 'INR'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                >
                                    <option value="INR">₹ (INR)</option>
                                    <option value="USD">$ (USD)</option>
                                    <option value="EUR">€ (EUR)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                                <select
                                    name="timezone"
                                    value={localSettings.timezone || 'IST'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                >
                                    <option value="IST">Asia/Kolkata (GMT+5:30)</option>
                                    <option value="UTC">UTC (GMT+0)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveGeneral}
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Financial Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <Percent className="text-green-600" size={24} />
                            <h3 className="text-lg font-bold text-gray-900">Commissions & Tax</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Fee (%)</label>
                                <input
                                    type="number"
                                    name="adminFee"
                                    value={localSettings.adminFee || 0}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">TDS / Tax Deduction (%)</label>
                                <input
                                    type="number"
                                    name="tds"
                                    value={localSettings.tds || 0}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Withdrawal Limit</label>
                                <input
                                    type="number"
                                    name="minWithdrawal"
                                    value={localSettings.minWithdrawal || 0}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveFinancial}
                            className="w-full px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                        >
                            Update Financials
                        </button>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-3 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <Shield className="text-purple-600" size={24} />
                            <h3 className="text-lg font-bold text-gray-900">Security & Access</h3>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">Two-Factor Authentication (2FA)</h4>
                                <p className="text-sm text-gray-500">Enforce 2FA for all admin accounts</p>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300" />
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">New User Registration</h4>
                                <p className="text-sm text-gray-500">Allow new users to register on the platform</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
