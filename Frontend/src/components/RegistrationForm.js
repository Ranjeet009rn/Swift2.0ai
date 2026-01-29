import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Hash, Shield, Briefcase, CreditCard, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Country, State, City } from 'country-state-city';

// Helper for input styling - Defined outside to prevent re-renders losing focus
const InputField = ({ label, name, value, onChange, type = "text", placeholder, icon: Icon, required = false, className, ...props }) => (
    <div className={`space-y-1.5 font-medium ${className || ''}`}>
        <label className="block text-sm text-gray-700">{label}</label>
        <div className="relative group">
            {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full bg-white border border-gray-300 text-gray-900 rounded-lg ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400`}
                {...props}
            />
        </div>
    </div>
);

const RegistrationForm = ({ onBackToLogin }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showTransPassword, setShowTransPassword] = useState(false);
    const [sponsorIsFull, setSponsorIsFull] = useState(false);
    const [availablePositions, setAvailablePositions] = useState(['left', 'right']);
    const [sponsorMessage, setSponsorMessage] = useState({ text: '', type: '' }); // type: 'success', 'error', 'warning'

    // Cascading dropdown states
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState('IN'); // India by default
    const [selectedStateCode, setSelectedStateCode] = useState('');
    const [packages, setPackages] = useState([]); // Store packages from API

    const [formData, setFormData] = useState({
        // 1. Basic User Details
        fullName: '',
        username: '',
        email: '',
        mobile: '',
        password: '',
        dateOfBirth: '',

        // 2. Address Details
        country: 'India',
        state: '',
        city: '',
        pinCode: '',
        fullAddress: '',

        // 3. KYC & Identity
        govIdType: 'aadhaar', // aadhaar, pan, passport, voter_id
        govIdNumber: '',
        panNumber: '',
        kycDocument: null,

        // 4. MLM Network Details
        sponsorId: '',
        sponsorName: '',
        placement: 'left', // left or right
        uplineId: '',

        // 5. Bank & Payout Details
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        accountType: 'savings',

        // 6. Nominee
        nomineeName: '',
        nomineeRelation: '',

        // 7. Security
        transactionPassword: '',

        // 8. Package Selection
        selectedPackage: '',

        // Declaration
        agreeTerms: false
    });

    // Load Initial Data (Countries)
    useEffect(() => {
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
        // Set default state/cities for India (default country)
        const indiaStates = State.getStatesOfCountry('IN');
        setStates(indiaStates);

        // Fetch Packages
        fetch('http://localhost/mlm/backend/api/packages.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setPackages(data.packages);
                }
            })
            .catch(err => console.error("Failed to load packages", err));
    }, []);

    // Handle Country Change
    const handleCountryChange = (e) => {
        const countryCode = e.target.value;
        const countryName = e.target.options[e.target.selectedIndex].text;

        setSelectedCountryCode(countryCode);
        setFormData(prev => ({ ...prev, country: countryName, state: '', city: '' })); // Reset state/city

        // Update States
        const countryStates = State.getStatesOfCountry(countryCode);
        setStates(countryStates);
        setCities([]); // Clear cities
        setSelectedStateCode('');
    };

    // Handle State Change
    const handleStateChange = (e) => {
        const stateCode = e.target.value;
        const stateName = e.target.options[e.target.selectedIndex].text;

        setSelectedStateCode(stateCode);
        setFormData(prev => ({ ...prev, state: stateName, city: '' })); // Reset city

        // Update Cities
        const stateCities = City.getCitiesOfState(selectedCountryCode, stateCode);
        setCities(stateCities);
    };

    // Handle City Change
    const handleCityChange = (e) => {
        setFormData(prev => ({ ...prev, city: e.target.value }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreeTerms) {
            alert("Please accept the Declaration terms.");
            return;
        }

        try {
            // Create FormData for file upload
            const formDataToSend = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'kycDocument' && formData[key]) {
                    formDataToSend.append(key, formData[key]);
                } else if (key !== 'agreeTerms') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Send to backend
            const response = await fetch('http://localhost/mlm/backend/api/auth/register.php', {
                method: 'POST',
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                alert(`Registration Successful!\n\nUser ID: ${data.data.user_id}\nUsername: ${data.data.username}\nReferral Code: ${data.data.referral_code}\n\nYour account is pending activation.`);
                onBackToLogin();
            } else {
                alert(`Registration Failed: ${data.message}`);
            }
        } catch (error) {
            console.error("Registration Error:", error);
            alert("An error occurred during registration. Please try again.");
        }
    };



    const handleSponsorBlur = async () => {
        if (!formData.sponsorId) {
            setSponsorIsFull(false);
            setAvailablePositions(['left', 'right']);
            setSponsorMessage({ text: '', type: '' });
            return;
        }

        try {
            // Check sponsor and available positions
            const response = await fetch(`http://localhost/mlm/backend/api/user/check_sponsor_positions.php?sponsor_id=${formData.sponsorId}`);
            const data = await response.json();

            if (data.success) {
                setFormData(prev => ({ ...prev, sponsorName: data.sponsor.name }));
                setAvailablePositions(data.available_positions);

                // Check if sponsor is full
                if (data.is_full) {
                    setSponsorIsFull(true);
                    setSponsorMessage({
                        text: '⚠️ This sponsor is FULL! Both left and right positions are occupied. Please choose a different sponsor.',
                        type: 'error'
                    });
                    // Keep sponsor name, just reset placement
                    setFormData(prev => ({ ...prev, placement: 'left' }));
                } else {
                    setSponsorIsFull(false);
                    // Auto-select if only one position available
                    if (data.available_positions.length === 1) {
                        const position = data.available_positions[0];
                        setFormData(prev => ({ ...prev, placement: position }));
                        setSponsorMessage({
                            text: `✓ Sponsor found: ${data.sponsor.name}. Only ${position.toUpperCase()} position is available and has been auto-selected.`,
                            type: 'success'
                        });
                    } else {
                        setSponsorMessage({
                            text: `✓ Sponsor found: ${data.sponsor.name}. Both LEFT and RIGHT positions are available.`,
                            type: 'success'
                        });
                    }
                }
            } else {
                setFormData(prev => ({ ...prev, sponsorName: '' }));
                setSponsorIsFull(false);
                setAvailablePositions(['left', 'right']);
                setSponsorMessage({
                    text: '❌ Invalid Sponsor ID. ' + (data.message || 'Sponsor not found in the system.'),
                    type: 'error'
                });
            }
        } catch (e) {
            console.error("Sponsor check failed", e);
            setSponsorIsFull(false);
            setAvailablePositions(['left', 'right']);
            setSponsorMessage({
                text: '❌ Failed to verify sponsor. Please check your internet connection and try again.',
                type: 'error'
            });
        }
    };



    const handleIfscBlur = async () => {
        if (!formData.ifscCode) return;
        try {
            const response = await fetch(`https://ifsc.razorpay.com/${formData.ifscCode}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    bankName: data.BANK,
                    branchName: data.BRANCH
                }));
            } else {
                console.warn("Invalid IFSC Code");
                // Optional: clear fields or show error
            }
        } catch (e) {
            console.warn("IFSC Fetch failed", e);
        }
    };

    const renderInput = (props) => (
        <InputField
            {...props}
            value={formData[props.name]}
            onChange={handleChange}
        />
    );

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Background Image - Full Screen */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20"></div>
                <img
                    src={process.env.PUBLIC_URL + "/registration_visual.png"}
                    alt="Registration Background"
                    className="w-full h-full object-cover object-center"
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="max-w-5xl mx-auto pb-8 px-3 sm:px-4 lg:px-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between py-4 sm:py-6 gap-3">
                        <button
                            onClick={onBackToLogin}
                            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors font-semibold group px-4 py-2 rounded-xl bg-white/80 backdrop-blur-md hover:bg-white/95 shadow-sm border border-white/60 text-xs sm:text-sm"
                        >
                            <ArrowLeft className="mr-1.5 group-hover:-translate-x-1 transition-transform" size={16} />
                            Back to Login
                        </button>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight bg-white/80 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-white/60 shadow-sm">Create Account</h2>
                        <div className="w-24 hidden sm:block"></div> {/* Spacer for centering */}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-slideUp">

                        {/* 1. Sponsor Details */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-blue-50/50 px-3 sm:px-6 py-3 sm:py-4 border-b border-blue-100 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                    <Briefcase size={16} className="sm:hidden" />
                                    <Briefcase size={20} className="hidden sm:block" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Sponsor Information</h3>
                                    <p className="text-xs text-gray-500 hidden sm:block">Enter details of your sponsor</p>
                                </div>
                            </div>
                            <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                {renderInput({ label: "Sponsor ID", name: "sponsorId", placeholder: "Enter Sponsor ID", icon: Hash, onBlur: handleSponsorBlur, required: true })}
                                {renderInput({ label: "Sponsor Name", name: "sponsorName", placeholder: "Auto-filled Sponsor Name", readOnly: true, icon: User, className: "w-full bg-transparent border border-gray-200 text-gray-700 rounded-lg cursor-not-allowed" })}



                                {!sponsorIsFull ? (
                                    <div className="space-y-1.5 font-medium">
                                        <label className="block text-sm text-gray-700">Placement Position <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-2 gap-4 h-[50px]">
                                            {availablePositions.includes('left') && (
                                                <label className={`cursor-pointer rounded-lg border-2 flex items-center justify-center gap-2 transition-all 
                                                    ${formData.placement === 'left' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200 text-gray-600'}`}>
                                                    <input type="radio" name="placement" value="left" checked={formData.placement === 'left'} onChange={handleChange} className="hidden" />
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.placement === 'left' ? 'border-blue-600' : 'border-gray-400'}`}>
                                                        {formData.placement === 'left' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                    </div>
                                                    Left
                                                </label>
                                            )}
                                            {availablePositions.includes('right') && (
                                                <label className={`cursor-pointer rounded-lg border-2 flex items-center justify-center gap-2 transition-all 
                                                    ${formData.placement === 'right' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200 text-gray-600'}`}>
                                                    <input type="radio" name="placement" value="right" checked={formData.placement === 'right'} onChange={handleChange} className="hidden" />
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.placement === 'right' ? 'border-blue-600' : 'border-gray-400'}`}>
                                                        {formData.placement === 'right' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                    </div>
                                                    Right
                                                </label>
                                            )}
                                            {availablePositions.length === 0 && (
                                                <div className="col-span-2 text-center py-3 text-red-600 font-medium">
                                                    ⚠️ No positions available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 font-medium md:col-span-2">
                                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                                            <p className="text-red-700 font-bold text-sm">⚠️ Sponsor is FULL!</p>
                                            <p className="text-red-600 text-xs mt-1">Both left and right positions are occupied. Please enter a different sponsor ID.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Sponsor Status Message */}
                                {sponsorMessage.text && (
                                    <div className="md:col-span-2 lg:col-span-4">
                                        <div className={`rounded-lg p-3 text-sm ${sponsorMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                                            sponsorMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                                                'bg-yellow-50 border border-yellow-200 text-yellow-700'
                                            }`}>
                                            {sponsorMessage.text}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Personal Information */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-green-50/50 px-4 sm:px-8 py-4 sm:py-5 border-b border-green-100 flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg text-green-600">
                                    <User size={18} className="sm:hidden" />
                                    <User size={22} className="hidden sm:block" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Personal Details</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Your basic personal information</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                                {renderInput({ label: "Full Name", name: "fullName", placeholder: "As per Government ID", icon: User, required: true })}
                                {renderInput({ label: "Username / Member ID", name: "username", placeholder: "Choose unique username", icon: User, required: true })}
                                {renderInput({ label: "Email Address", name: "email", type: "email", placeholder: "example@gmail.com", icon: Mail, required: true })}
                                {renderInput({ label: "Mobile Number", name: "mobile", placeholder: "10 Digit Mobile No.", icon: Phone, required: true })}
                                {renderInput({ label: "Date of Birth", name: "dateOfBirth", type: "date", icon: User, required: true })}
                                {renderInput({ label: "PAN Number", name: "panNumber", placeholder: "Permanent Account Number", icon: CreditCard, required: true })}

                                {/* Address Fields */}
                                {/* Cascading Address Fields */}
                                {/* Country Dropdown */}
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">Country <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            name="country"
                                            value={selectedCountryCode}
                                            onChange={handleCountryChange}
                                            required
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-11 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map((country) => (
                                                <option key={country.isoCode} value={country.isoCode}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* State Dropdown */}
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">State <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            name="state"
                                            value={selectedStateCode}
                                            onChange={handleStateChange}
                                            disabled={!selectedCountryCode}
                                            required
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-11 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">Select State</option>
                                            {states.map((state) => (
                                                <option key={state.isoCode} value={state.isoCode}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* City Dropdown */}
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">City <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleCityChange}
                                            disabled={!selectedStateCode}
                                            required
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-11 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">Select City</option>
                                            {cities.map((city) => (
                                                <option key={city.name} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                                {renderInput({ label: "PIN / ZIP Code", name: "pinCode", placeholder: "6 Digit PIN", icon: Hash, required: true })}
                                {renderInput({ label: "Full Address", name: "fullAddress", placeholder: "Street, Area, Landmark", icon: MapPin, className: "md:col-span-2", required: true })}
                            </div>
                        </div>

                        {/* 3. Nominee Details */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-purple-50/50 px-8 py-5 border-b border-purple-100 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <User size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Nominee Information</h3>
                                    <p className="text-sm text-gray-500"> for account inheritance</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {renderInput({ label: "Nominee Name", name: "nomineeName", placeholder: "Full Name of Nominee", icon: User, required: true })}
                                {renderInput({ label: "Nominee Relation", name: "nomineeRelation", placeholder: "e.g. Spouse, Father, Mother", icon: User, required: true })}
                            </div>
                        </div>

                        {/* 4. KYC & Identity Verification */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-orange-50/50 px-8 py-5 border-b border-orange-100 flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">KYC & Identity Verification</h3>
                                    <p className="text-sm text-gray-500"> for payout processing</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">Government ID Type <span className="text-red-500">*</span></label>
                                    <select
                                        name="govIdType"
                                        value={formData.govIdType}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    >
                                        <option value="aadhaar">Aadhaar Card</option>
                                        <option value="pan">PAN Card</option>
                                        <option value="passport">Passport</option>
                                        <option value="voter_id">Voter ID</option>
                                        <option value="driving_license">Driving License</option>
                                    </select>
                                </div>
                                {renderInput({ label: "Government ID Number", name: "govIdNumber", placeholder: "Enter ID Number", icon: CreditCard, required: true })}
                                <div className="space-y-1.5 font-medium md:col-span-2">
                                    <label className="block text-sm text-gray-700">Upload ID Proof <span className="text-red-500">*</span></label>
                                    <input
                                        type="file"
                                        name="kycDocument"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setFormData({ ...formData, kycDocument: e.target.files[0] })}
                                        required
                                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload clear image or PDF (Max 5MB)</p>
                                </div>
                            </div>
                        </div>

                        {/* 5. Security Details */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-red-50/50 px-8 py-5 border-b border-red-100 flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Security Setup</h3>
                                    <p className="text-sm text-gray-500">Secure your account access</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">Login Password <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            placeholder="Create strong password"
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">Transaction Password <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <input
                                            type={showTransPassword ? "text" : "password"}
                                            name="transactionPassword"
                                            value={formData.transactionPassword}
                                            onChange={handleChange}
                                            required
                                            placeholder="Different from login password"
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                                        />
                                        <button type="button" onClick={() => setShowTransPassword(!showTransPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showTransPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Package Selection */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-indigo-50/50 px-8 py-5 border-b border-indigo-100 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <Briefcase size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Select Package</h3>
                                    <p className="text-sm text-gray-500">Choose your membership plan</p>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">Membership Package <span className="text-red-500">*</span></label>
                                    <select
                                        name="selectedPackage"
                                        value={formData.selectedPackage}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Select Package</option>
                                        {packages.map((pkg) => (
                                            <option key={pkg.id} value={pkg.name}>
                                                {pkg.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Selected Package Description Card */}
                            {formData.selectedPackage && (
                                <div className="px-8 pb-8 animate-fadeIn">
                                    {packages.filter(p => p.name === formData.selectedPackage).map(pkg => (
                                        <div key={pkg.id} className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mt-2">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-indigo-900">{pkg.name}</h4>
                                                    <div className="flex gap-3 text-sm mt-1">
                                                        <span className="text-indigo-700 font-semibold">₹{pkg.price}</span>
                                                        <span className="text-gray-500">|</span>
                                                        <span className="text-green-600 font-semibold">{pkg.pv} PV</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white px-2 py-1 rounded text-xs font-bold text-indigo-600 border border-indigo-200 uppercase tracking-wider">
                                                    Selected
                                                </div>
                                            </div>

                                            {pkg.products && pkg.products.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Includes:</p>
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {pkg.products.map((prod, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                                <span>
                                                                    {prod.product_name}
                                                                    {prod.type === 'choiceable' && <span className="text-gray-400 text-xs ml-1">(Choice)</span>}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 7. Bank Details */}
                        <div className="bg-white/35 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="bg-yellow-50/50 px-8 py-5 border-b border-yellow-100 flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                    <CreditCard size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Banking Details</h3>
                                    <p className="text-sm text-gray-500">For payout withdrawals</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {renderInput({ label: "Bank Name", name: "bankName", placeholder: "Bank Name", icon: Briefcase, required: true })}
                                {renderInput({ label: "Account Holder", name: "accountHolderName", placeholder: "As per Bank Records", icon: User, required: true })}
                                {renderInput({ label: "Account Number", name: "accountNumber", placeholder: "Account Number", icon: CreditCard, required: true })}
                                {renderInput({ label: "IFSC Code", name: "ifscCode", placeholder: "IFSC Code", icon: Hash, required: true, onBlur: handleIfscBlur })}
                                {renderInput({ label: "Branch Name", name: "branchName", placeholder: "Branch Location", icon: MapPin, required: true })}
                                <div className="space-y-1.5 font-medium">
                                    <label className="block text-sm text-gray-700">Account Type <span className="text-red-500">*</span></label>
                                    <select
                                        name="accountType"
                                        value={formData.accountType}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option value="savings">Savings Account</option>
                                        <option value="current">Current Account</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Declaration */}
                        <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-8 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="agreeTerms"
                                        checked={formData.agreeTerms}
                                        onChange={handleChange}
                                        className="peer h-6 w-6 cursor-pointer opacity-0"
                                    />
                                    <div className="pointer-events-none absolute left-0 top-0 h-6 w-6 rounded border-2 border-gray-300 bg-white peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all">
                                        <CheckCircle2 className="h-full w-full text-white opacity-0 peer-checked:opacity-100" size={16} />
                                    </div>
                                </div>
                                <div className="text-base text-gray-600 leading-relaxed select-none">
                                    <span className="font-bold text-gray-900">Declaration:</span> I hereby accept all Terms & Conditions. I declare that the details furnished above are true and correct to the best of my knowledge and belief. I understand that my account can be suspended if any information is found to be false.
                                </div>
                            </label>
                        </div>

                        <div className="pt-4 pb-8">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                            >
                                Complete Registration <ChevronRight size={24} />
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default RegistrationForm;




