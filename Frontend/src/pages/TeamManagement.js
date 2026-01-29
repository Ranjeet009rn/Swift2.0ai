import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Users, TrendingUp, UserPlus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Country, State, City } from 'country-state-city';

import useLockBodyScroll from '../utils/useLockBodyScroll';

const TeamManagement = () => {
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('A');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useLockBodyScroll(showCreateModal);

    const [formData, setFormData] = useState({
        teamName: '',
        teamLetter: '',
        description: '',
        country: 'IN',
        state: '',
        city: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        // Load countries
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);

        // Load team data
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/teams.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setTeamData(data.teams);
                }
            } catch (error) {
                console.error("Failed to fetch teams", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    // Load states when country changes
    useEffect(() => {
        if (formData.country) {
            const countryStates = State.getStatesOfCountry(formData.country);
            setStates(countryStates);
            setFormData(prev => ({ ...prev, state: '', city: '' }));
            setCities([]);
        }
    }, [formData.country]);

    // Load cities when state changes
    useEffect(() => {
        if (formData.country && formData.state) {
            const stateCities = City.getCitiesOfState(formData.country, formData.state);
            setCities(stateCities);
            setFormData(prev => ({ ...prev, city: '' }));
        }
    }, [formData.state]);

    const validateForm = () => {
        const errors = {};

        if (!formData.teamName.trim()) {
            errors.teamName = 'Team name is required';
        } else if (formData.teamName.trim().length < 3) {
            errors.teamName = 'Team name must be at least 3 characters';
        }

        if (!formData.teamLetter.trim()) {
            errors.teamLetter = 'Team letter is required';
        } else if (formData.teamLetter.trim().length !== 1) {
            errors.teamLetter = 'Team letter must be a single character (A-Z)';
        }

        if (!formData.country) {
            errors.country = 'Country is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost/mlm/backend/api/user/create_team.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                setSubmitMessage({
                    type: 'success',
                    text: data.message || `Team "${formData.teamName}" created successfully!`
                });

                // Refresh teams
                const refreshResponse = await fetch('http://localhost/mlm/backend/api/user/teams.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const refreshData = await refreshResponse.json();
                if (refreshData.success) {
                    setTeamData(refreshData.teams);
                }

                setTimeout(() => {
                    setShowCreateModal(false);
                    setFormData({
                        teamName: '',
                        teamLetter: '',
                        description: '',
                        country: 'IN',
                        state: '',
                        city: ''
                    });
                    setSubmitMessage({ type: '', text: '' });
                }, 2000);
            } else {
                setSubmitMessage({
                    type: 'error',
                    text: data.message || 'Failed to create team.'
                });
            }
        } catch (error) {
            console.error("Create team error:", error);
            setSubmitMessage({
                type: 'error',
                text: 'An error occurred while creating the team.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentTeam = activeTab === 'A' ? teamData?.team_a : teamData?.team_b;

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Team Management</h1>
                        <p className="text-gray-600 mt-1">Manage your teams and view team structures</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('A')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'A'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Team A
                        </button>
                        <button
                            onClick={() => setActiveTab('B')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'B'
                                ? 'bg-orange-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Team B
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            <UserPlus size={20} />
                            <span>Create Team</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Users size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium mb-2">Total Team</p>
                        <h2 className="text-4xl font-bold mb-3">{teamData?.total_team}</h2>
                        <div className="flex items-center justify-between text-sm bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                            <span className="font-medium">Team A: {teamData?.team_a?.count}</span>
                            <span className="text-white/60">|</span>
                            <span className="font-medium">Team B: {teamData?.team_b?.count}</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <TrendingUp size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium mb-2">Total Earnings</p>
                        <h2 className="text-4xl font-bold mb-3">₹ {teamData?.total_earnings?.toLocaleString('en-IN')}</h2>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Users size={28} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium mb-2">Active Teams</p>
                        <h2 className="text-4xl font-bold mb-3">
                            {(teamData?.team_a?.count > 0 ? 1 : 0) + (teamData?.team_b?.count > 0 ? 1 : 0)}
                        </h2>
                        <p className="text-white/80 text-sm">Team A & Team B</p>
                    </div>
                </div>

                {/* Create Team Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <UserPlus className="text-white" size={28} />
                                    <h2 className="text-2xl font-bold text-white">Create New Team</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormErrors({});
                                        setSubmitMessage({ type: '', text: '' });
                                    }}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                                {/* Success/Error Message */}
                                {submitMessage.text && (
                                    <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${submitMessage.type === 'success'
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-red-50 border border-red-200'
                                        }`}>
                                        {submitMessage.type === 'success' ? (
                                            <CheckCircle className="text-green-600" size={24} />
                                        ) : (
                                            <AlertCircle className="text-red-600" size={24} />
                                        )}
                                        <p className={`font-medium ${submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                                            }`}>
                                            {submitMessage.text}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Team Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Team Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="teamName"
                                            value={formData.teamName}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.teamName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., Marketing Team, Sales Team"
                                        />
                                        {formErrors.teamName && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.teamName}</p>
                                        )}
                                    </div>

                                    {/* Team Letter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Team Letter <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="teamLetter"
                                            value={formData.teamLetter}
                                            onChange={handleInputChange}
                                            maxLength="1"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.teamLetter ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="A, B, C, D..."
                                        />
                                        {formErrors.teamLetter && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.teamLetter}</p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Brief description of the team..."
                                        />
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.country ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map((country) => (
                                                <option key={country.isoCode} value={country.isoCode}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.country && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.country}</p>
                                        )}
                                    </div>

                                    {/* State */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State (Optional)
                                        </label>
                                        <select
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            disabled={!formData.country}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select State</option>
                                            {states.map((state) => (
                                                <option key={state.isoCode} value={state.isoCode}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City (Optional)
                                        </label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            disabled={!formData.state}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select City</option>
                                            {cities.map((city) => (
                                                <option key={city.name} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </form>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-200 p-6 flex items-center justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormErrors({});
                                        setSubmitMessage({ type: '', text: '' });
                                    }}
                                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={20} />
                                            <span>Create Team</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TeamManagement;
