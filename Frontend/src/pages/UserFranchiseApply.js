import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, MapPin, CreditCard,
    FileText, CheckCircle, AlertCircle, Briefcase, Lock
} from 'lucide-react';
import Layout from '../components/Layout';

const UserFranchiseApply = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const [formData, setFormData] = useState({
        // 1. Basic Details
        franchisee_name: '',
        contact_person_name: '',
        mobile_number: '',

        // 2. Business & Location
        franchise_type: 'district',
        area_territory: '',
        business_address: '',
        city: '',
        state: '',
        pincode: '',

        // 3. Legal & Identity
        pan_number: '',
        govt_id_type: 'aadhaar',
        govt_id_number: '',
        id_proof_file: null,
        gst_number: '',

        // 4. Bank Details
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',

        // 5. Agreement
        agreement_accepted: false
    });

    // Check if user already has an application
    useEffect(() => {
        fetch('http://localhost/mlm/backend/api/user/franchise_status.php', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setApplicationStatus(data.status);
                }
            })
            .catch(err => console.error('Failed to fetch status:', err))
            .finally(() => setCheckingStatus(false));
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
        }));
    };

    const validateStep = (step) => {
        setError('');

        switch (step) {
            case 1:
                if (!formData.franchisee_name || !formData.contact_person_name || !formData.mobile_number) {
                    setError('Please fill all basic details');
                    return false;
                }
                if (formData.mobile_number.length !== 10) {
                    setError('Mobile number must be 10 digits');
                    return false;
                }
                break;

            case 2:
                if (!formData.area_territory || !formData.business_address ||
                    !formData.city || !formData.state || !formData.pincode) {
                    setError('Please fill all business location details');
                    return false;
                }
                break;

            case 3:
                if (!formData.pan_number || !formData.govt_id_number || !formData.id_proof_file) {
                    setError('Please provide all legal documents');
                    return false;
                }
                break;

            case 4:
                if (!formData.bank_name || !formData.account_holder_name ||
                    !formData.account_number || !formData.ifsc_code) {
                    setError('Please fill all bank details');
                    return false;
                }
                break;

            case 5:
                if (!formData.agreement_accepted) {
                    setError('Please accept the franchise agreement');
                    return false;
                }
                break;

            default:
                break;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 5));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(5)) return;

        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'id_proof_file' && formData[key]) {
                    submitData.append(key, formData[key]);
                } else if (key !== 'id_proof_file') {
                    submitData.append(key, formData[key]);
                }
            });

            // Add user token for authentication
            submitData.append('token', localStorage.getItem('token'));

            const response = await fetch('http://localhost/mlm/backend/api/user/franchise_apply.php', {
                method: 'POST',
                body: submitData
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.message || 'Application submission failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Basic Details', icon: User },
        { num: 2, title: 'Business Location', icon: MapPin },
        { num: 3, title: 'Legal Documents', icon: FileText },
        { num: 4, title: 'Bank Details', icon: CreditCard },
        { num: 5, title: 'Agreement', icon: CheckCircle }
    ];

    if (checkingStatus) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Checking application status...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // If already approved
    if (applicationStatus === 'approved') {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Franchise Approved!</h2>
                        <p className="text-gray-600 mb-6">
                            Your franchise application has been approved. You now have access to all franchise features.
                        </p>
                        <button
                            onClick={() => navigate('/franchise/buy-epin')}
                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                        >
                            Go to Franchise Dashboard
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // If pending approval
    if (applicationStatus === 'pending') {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="text-yellow-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Pending</h2>
                        <p className="text-gray-600 mb-6">
                            Your franchise application is currently under review. Our team will contact you within 2-3 business days.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (success) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
                        <p className="text-gray-600 mb-6">
                            Your franchise application has been submitted successfully.
                            Our team will review it and contact you within 2-3 business days.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="text-orange-600" size={32} />
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Apply for Franchise
                        </h1>
                    </div>
                    <p className="text-gray-600">Join our growing network of successful franchisees</p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.num;
                            const isCompleted = currentStep > step.num;

                            return (
                                <React.Fragment key={step.num}>
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${isCompleted ? 'bg-green-500 text-white' :
                                            isActive ? 'bg-orange-600 text-white' :
                                                'bg-gray-200 text-gray-400'
                                            }`}>
                                            {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
                                        </div>
                                        <span className={`text-xs font-semibold text-center ${isActive ? 'text-orange-600' : 'text-gray-500'
                                            }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">

                    {/* Step 1: Basic Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="text-orange-600" size={24} />
                                Basic Details
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Franchisee Name / Business Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="franchisee_name"
                                        value={formData.franchisee_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="Enter business name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Contact Person Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person_name"
                                        value={formData.contact_person_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobile_number"
                                        value={formData.mobile_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        pattern="[0-9]{10}"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Business & Location */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <MapPin className="text-orange-600" size={24} />
                                Business & Location Details
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Franchise Type *
                                    </label>
                                    <select
                                        name="franchise_type"
                                        value={formData.franchise_type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        required
                                    >
                                        <option value="district">District Franchise</option>
                                        <option value="state">State Franchise</option>
                                        <option value="master">Master Franchise</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Area / Territory *
                                    </label>
                                    <input
                                        type="text"
                                        name="area_territory"
                                        value={formData.area_territory}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="e.g., North Delhi, Maharashtra"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Business Address *
                                    </label>
                                    <textarea
                                        name="business_address"
                                        value={formData.business_address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="Complete business address"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="City name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="State name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        PIN / ZIP Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="6-digit PIN code"
                                        maxLength="6"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Legal & Identity */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText className="text-orange-600" size={24} />
                                Legal & Identity Documents
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        PAN Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="pan_number"
                                        value={formData.pan_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors uppercase"
                                        placeholder="ABCDE1234F"
                                        maxLength="10"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Government ID Type *
                                    </label>
                                    <select
                                        name="govt_id_type"
                                        value={formData.govt_id_type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        required
                                    >
                                        <option value="aadhaar">Aadhaar Card</option>
                                        <option value="passport">Passport</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {formData.govt_id_type === 'aadhaar' ? 'Aadhaar' : 'Passport'} Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="govt_id_number"
                                        value={formData.govt_id_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder={formData.govt_id_type === 'aadhaar' ? '12-digit Aadhaar' : 'Passport number'}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ID Proof Upload *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            name="id_proof_file"
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:font-semibold hover:file:bg-orange-100"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        GST Number (if applicable)
                                    </label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={formData.gst_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors uppercase"
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength="15"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Bank Details */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CreditCard className="text-orange-600" size={24} />
                                Bank & Payment Details
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="e.g., HDFC Bank"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Account Holder Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="account_holder_name"
                                        value={formData.account_holder_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="As per bank records"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Account Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="account_number"
                                        value={formData.account_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                                        placeholder="Bank account number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        IFSC Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="ifsc_code"
                                        value={formData.ifsc_code}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors uppercase"
                                        placeholder="HDFC0001234"
                                        maxLength="11"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Agreement */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CheckCircle className="text-orange-600" size={24} />
                                Franchise Agreement & Compliance
                            </h3>

                            <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-y-auto border-2 border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-4">Franchise Agreement Terms</h4>
                                <div className="space-y-3 text-sm text-gray-700">
                                    <p><strong>1. Territory Rights:</strong> The franchisee will have exclusive rights to operate in the designated territory as specified in the application.</p>
                                    <p><strong>2. Initial Investment:</strong> The franchisee agrees to make the required initial investment as per the franchise type selected.</p>
                                    <p><strong>3. Operational Guidelines:</strong> The franchisee must adhere to all operational guidelines, branding standards, and quality protocols set by the company.</p>
                                    <p><strong>4. Commission Structure:</strong> Earnings will be based on the agreed commission structure for the franchise type.</p>
                                    <p><strong>5. Training & Support:</strong> The company will provide initial training and ongoing support to ensure franchise success.</p>
                                    <p><strong>6. Compliance:</strong> The franchisee must comply with all local laws, regulations, and company policies.</p>
                                    <p><strong>7. Termination:</strong> Either party may terminate this agreement with 30 days written notice, subject to settlement of all dues.</p>
                                    <p><strong>8. Confidentiality:</strong> All business information, customer data, and operational procedures must be kept confidential.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                                <input
                                    type="checkbox"
                                    name="agreement_accepted"
                                    checked={formData.agreement_accepted}
                                    onChange={handleInputChange}
                                    className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                    required
                                />
                                <label className="text-sm text-gray-700">
                                    <span className="font-semibold">I hereby accept</span> all the terms and conditions of the Franchise Agreement.
                                    I confirm that all information provided is accurate and I have the authority to enter into this agreement.
                                </label>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                                <p className="text-sm text-blue-900">
                                    <strong>Note:</strong> After submission, your application will be reviewed by our team.
                                    You will receive a confirmation email within 2-3 business days. Your franchise features will be
                                    activated only after admin approval.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-100">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handlePrevious}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Previous
                            </button>
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="ml-auto px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="ml-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Submit Application
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default UserFranchiseApply;
