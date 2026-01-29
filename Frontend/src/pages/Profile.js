import React, { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
    Mail,
    Phone,
    Calendar,
    Shield,
    MapPin,
    CreditCard,
    Award,
    Save,
    X,
    Camera,
    Smartphone,
    Cloud,
    Briefcase,
    Clock,
    Hash,
    XCircle,
    User,
    ArrowUpCircle,
    CheckCircle,
    Package
} from 'lucide-react';

import useLockBodyScroll from '../utils/useLockBodyScroll';

const Profile = () => {
    const { user, updateUserProfile } = useAuth();

    const [isEditing, setIsEditing] = useState(false);

    // Image States
    const [profileImage, setProfileImage] = useState(null);
    const [coverImage, setCoverImage] = useState(null);

    // Dropdown States
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showCoverMenu, setShowCoverMenu] = useState(false);

    // Camera Modal State
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [activeCameraType, setActiveCameraType] = useState(null); // 'profile' or 'cover'

    useLockBodyScroll(showCameraModal);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Refs for file inputs
    const profileDeviceRef = useRef(null);
    const coverDeviceRef = useRef(null);

    // Initial Profile Data based on User Context
    const getInitialProfileData = (userData) => {
        return {
            full_name: userData?.full_name || userData?.name || '',
            username: userData?.username || '',
            email: userData?.email || '',
            mobile: userData?.mobile || '',
            join_date: userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A',
            registration_time: userData?.created_at ? new Date(userData.created_at).toLocaleTimeString() : '',
            status: userData?.status || 'Active',
            address: userData?.address || '',
            kyc_status: userData?.kyc_status || 'Pending',
            role_display: userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User',

            // Role specific fields - default to empty/N/A
            rank: userData?.rank || 'N/A',
            sponsor_id: userData?.sponsor_id || 'N/A',
            upline_id: userData?.upline_id || 'N/A',
            position: userData?.position || 'N/A',
            package: userData?.package || 'N/A',
            activation_date: userData?.activation_date ? new Date(userData.activation_date).toLocaleDateString() : 'N/A',

            account_number: userData?.account_number || '',
            ifsc: userData?.ifsc_code || '',
            bank_name: userData?.bank_name || '',
            branch_name: userData?.branch_name || '',
            account_holder: userData?.account_holder_name || '',
            country: userData?.country || '',

            // New Registration Fields
            dob: userData?.dob || '',
            nominee_name: userData?.nominee_name || '',
            nominee_relation: userData?.nominee_relation || '',
            pan_number: userData?.pan_number || '',
            city: userData?.city || '',
            state: userData?.state || '',
            pincode: userData?.pincode || '',

            // Admin/Franchise specific (if available in user object)
            access_level: userData?.access_level || '',
            department: userData?.department || '',
            franchise_id: userData?.franchise_id || '',
            region: userData?.region || '',

            last_active: 'Just now'
        };
    };

    const [profileDetails, setProfileDetails] = useState(getInitialProfileData(user));
    const [formData, setFormData] = useState(profileDetails);

    // Update if user context changes
    useEffect(() => {
        if (user) {
            const data = getInitialProfileData(user);
            setProfileDetails(data);
            setFormData(data);
            if (user.profile_image) setProfileImage(user.profile_image);
            if (user.cover_image) setCoverImage(user.cover_image);
        }
    }, [user]);


    // Camera Logic
    const streamRef = useRef(null);

    // Camera Logic
    const startCamera = useCallback(async () => {
        try {
            if (streamRef.current) return; // Prevent double start

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;


            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setShowCameraModal(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;

        }
    }, []);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get data URL
            const dataUrl = canvas.toDataURL('image/png');

            if (activeCameraType === 'profile') {
                setProfileImage(dataUrl);
            } else {
                setCoverImage(dataUrl);
            }

            setIsEditing(true); // Enable edit mode to allow saving
            closeCameraModal();
        }
    };

    const openCameraModal = (type) => {
        setActiveCameraType(type);
        setShowCameraModal(true);
        setShowProfileMenu(false);
        setShowCoverMenu(false);
    };

    const closeCameraModal = () => {
        stopCamera();
        setShowCameraModal(false);
        setActiveCameraType(null);
    };

    // Effect to start camera when modal opens
    useEffect(() => {
        if (showCameraModal) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [showCameraModal, startCamera, stopCamera]);


    const handleEditToggle = () => {
        if (isEditing) {
            setFormData(profileDetails);
        }
        setIsEditing(!isEditing);
    };

    const fetchBankDetails = async (ifscCode) => {
        try {
            const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    bank_name: data.BANK,
                    branch_name: data.BRANCH,
                    ifsc: ifscCode.toUpperCase()
                }));
            }
        } catch (error) {
            console.error("Failed to fetch bank details", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-fetch if IFSC code is entered (11 chars)
        if (name === 'ifsc' && value.length === 11) {
            fetchBankDetails(value);
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSave = async () => {
        console.log("Saving profile data:", formData);
        const updatedData = {
            ...formData,
            ...(profileImage && { profile_image: profileImage }),
            ...(coverImage && { cover_image: coverImage }),
            // Map frontend ifsc to backend ifsc_code
            ifsc_code: formData.ifsc
        };
        const result = await updateUserProfile(updatedData);
        if (result.success) {
            setProfileDetails(formData);
            setIsEditing(false);
        } else {
            alert('Failed to save profile: ' + result.message);
        }
    };

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'profile') {
                    setProfileImage(reader.result);
                    setShowProfileMenu(false);
                } else {
                    setCoverImage(reader.result);
                    setShowCoverMenu(false);
                }
                setIsEditing(true); // Enable edit mode to allow saving
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDriveUpload = () => {
        window.open('https://drive.google.com/drive/my-drive', '_blank');
    };

    const ImageOptionMenu = ({ type, onClose, align = 'right' }) => (
        <div className={`absolute top-full ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] overflow-hidden animation-fade-in text-left`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    openCameraModal(type);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
            >
                <Camera size={16} className="text-blue-600" />
                Take Photo
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDriveUpload();
                    onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors border-t border-gray-50"
            >
                <Cloud size={16} className="text-orange-500" />
                Upload from Drive
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (type === 'profile') profileDeviceRef.current.click();
                    else coverDeviceRef.current.click();
                    onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors border-t border-gray-50"
            >
                <Smartphone size={16} className="text-green-600" />
                Upload from Device
            </button>
        </div>
    );

    return (
        <Layout>
            {/* Camera Modal Overlay */}
            {showCameraModal && (
                <div className="fixed inset-0 z-[200] bg-black bg-opacity-80 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative">
                        <div className="p-4 bg-gray-900 flex justify-between items-center text-white">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Camera size={20} />
                                Take {activeCameraType === 'profile' ? 'Profile' : 'Cover'} Photo
                            </h3>
                            <button onClick={closeCameraModal} className="hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="bg-black aspect-video relative flex items-center justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="p-6 flex justify-center bg-gray-50">
                            <button
                                onClick={capturePhoto}
                                className="w-16 h-16 rounded-full border-4 border-blue-600 bg-white flex items-center justify-center hover:bg-gray-100 transition-all shadow-lg active:scale-95"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-600"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-8" onClick={() => { setShowProfileMenu(false); setShowCoverMenu(false); }}>
                {/* Hidden Inputs */}
                <input type="file" ref={profileDeviceRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
                <input type="file" ref={coverDeviceRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-500">Manage your {user?.role || 'account'} details and settings</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${profileDetails.kyc_status === 'Verified' ? 'bg-green-100 text-green-700' :
                        profileDetails.kyc_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                        {profileDetails.kyc_status === 'Verified' ? <Shield size={16} /> :
                            profileDetails.kyc_status === 'Rejected' ? <XCircle size={16} /> :
                                <Clock size={16} />}
                        <span>{
                            profileDetails.kyc_status === 'Verified' ? 'KYC Verified' :
                                profileDetails.kyc_status === 'Rejected' ? 'KYC Rejected' :
                                    'KYC Pending'
                        }</span>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible relative">
                    {/* Cover Image */}
                    <div
                        className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative bg-cover bg-center rounded-t-2xl"
                        style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
                    >
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowCoverMenu(!showCoverMenu); setShowProfileMenu(false); }}
                                className="bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 text-sm font-medium"
                            >
                                <Camera size={16} />
                                Edit Cover
                            </button>
                            {showCoverMenu && <ImageOptionMenu type="cover" onClose={() => setShowCoverMenu(false)} align="right" />}
                        </div>
                    </div>

                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-16 mb-8">
                            <div className="flex items-end gap-6">
                                {/* Profile Image */}
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-white rounded-2xl p-1 shadow-lg overflow-hidden relative">
                                        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-3xl font-bold text-blue-600 overflow-hidden relative">
                                            {profileImage ? (
                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-4xl uppercase">
                                                    {profileDetails.full_name?.split(' ').length > 1
                                                        ? `${profileDetails.full_name.split(' ')[0][0]}${profileDetails.full_name.split(' ').slice(-1)[0][0]}`
                                                        : profileDetails.full_name?.charAt(0)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Hover Overlay */}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); setShowCoverMenu(false); }}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
                                        >
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                    {showProfileMenu && (
                                        <div className="absolute top-full left-0 mt-2 z-[100]">
                                            <ImageOptionMenu type="profile" onClose={() => setShowProfileMenu(false)} align="left" />
                                        </div>
                                    )}
                                </div>

                                <div className="translate-y-2.5">
                                    <h2 className="text-2xl font-bold text-gray-900">{profileDetails.full_name}</h2>
                                    <p className="text-gray-500">ID: <span className="font-medium text-gray-900">{user?.user_id}</span> • @{profileDetails.username} • <span className="text-blue-600 font-medium">{profileDetails.role_display}</span></p>
                                </div>
                            </div>

                            <div className="flex gap-3 translate-y-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleEditToggle}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                                        >
                                            <X size={18} /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                        >
                                            <Save size={18} /> Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            {/* Personal Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Mail size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium uppercase">Email Address</p>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="font-medium">{profileDetails.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Phone size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium uppercase">Phone Number</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleChange}
                                                    className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="font-medium">{profileDetails.mobile}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium uppercase">Address</p>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleChange}
                                                        placeholder="Street"
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleChange}
                                                            placeholder="City"
                                                            className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="state"
                                                            value={formData.state}
                                                            onChange={handleChange}
                                                            placeholder="State"
                                                            className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="pincode"
                                                            value={formData.pincode}
                                                            onChange={handleChange}
                                                            placeholder="Pin"
                                                            className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="font-medium">
                                                    {profileDetails.address}<br />
                                                    <span className="text-sm text-gray-500">{profileDetails.city}, {profileDetails.state} - {profileDetails.pincode}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nominee Details */}
                                    {(!user?.role || user?.role === 'user') && (
                                        <div className="flex items-center gap-4 text-gray-700 pt-4 border-t border-gray-100">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium uppercase">Nominee</p>
                                                {isEditing ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            name="nominee_name"
                                                            value={formData.nominee_name}
                                                            onChange={handleChange}
                                                            placeholder="Nominee Name"
                                                            className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="nominee_relation"
                                                            value={formData.nominee_relation}
                                                            onChange={handleChange}
                                                            placeholder="Relation"
                                                            className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="font-medium">{profileDetails.nominee_name} <span className="text-gray-400">({profileDetails.nominee_relation})</span></p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Information Based on Role */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                    {user?.role === 'admin' ? 'System Details' : user?.role === 'franchise' ? 'Franchise Details' : 'Account Details'}
                                </h3>
                                <div className="space-y-4">
                                    {/* Common: Join Date & Registration Time */}
                                    <div className="flex items-center gap-4 text-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase">Registered On</p>
                                            <p className="font-medium">{profileDetails.join_date} <span className="text-gray-400 text-sm">• {profileDetails.registration_time}</span></p>
                                        </div>
                                    </div>

                                    {/* Sponsor Info */}
                                    {(!user?.role || user?.role === 'user') && (
                                        <div className="flex items-center gap-4 text-gray-700">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Sponsor ID</p>
                                                <p className="font-medium text-indigo-600">{profileDetails.sponsor_id}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Position Info */}
                                    {(!user?.role || user?.role === 'user') && (
                                        <div className="flex items-center gap-4 text-gray-700">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                <Hash size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Placement Position</p>
                                                <p className="font-medium text-gray-900">{profileDetails.position}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Account Data */}
                                    {(!user?.role || user?.role === 'user') && (
                                        <>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <ArrowUpCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Upline ID</p>
                                                    <p className="font-medium text-gray-900">{profileDetails.upline_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Package</p>
                                                    <p className="font-medium text-purple-600">{profileDetails.package}</p>
                                                </div>
                                            </div>
                                            {profileDetails.activation_date !== 'N/A' && (
                                                <div className="flex items-center gap-4 text-gray-700">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium uppercase">Activation Date</p>
                                                        <p className="font-medium text-green-600">{profileDetails.activation_date}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Role Specific Fields */}
                                    {user?.role === 'admin' && (
                                        <>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Access Level</p>
                                                    <p className="font-medium text-purple-600">{profileDetails.access_level}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Department</p>
                                                    <p className="font-medium">{profileDetails.department}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {user?.role === 'franchise' && (
                                        <>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Hash size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Franchise ID</p>
                                                    <p className="font-medium text-orange-600">{profileDetails.franchise_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Region</p>
                                                    <p className="font-medium">{profileDetails.region}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(!user?.role || user?.role === 'user') && (
                                        <>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Award size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Current Rank</p>
                                                    <p className="font-medium text-blue-600">{profileDetails.rank}</p>
                                                </div>
                                            </div>

                                            {/* Bank Details */}
                                            <div className="flex items-start gap-4 text-gray-700">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Bank Account</p>
                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                name="bank_name"
                                                                value={formData.bank_name}
                                                                onChange={handleChange}
                                                                placeholder="Bank Name"
                                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    name="branch_name"
                                                                    value={formData.branch_name}
                                                                    onChange={handleChange}
                                                                    placeholder="Branch"
                                                                    className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    name="ifsc"
                                                                    value={formData.ifsc}
                                                                    onChange={handleChange}
                                                                    placeholder="IFSC Code"
                                                                    className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    name="account_number"
                                                                    value={formData.account_number}
                                                                    onChange={handleChange}
                                                                    placeholder="Account Number"
                                                                    className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    name="account_holder"
                                                                    value={formData.account_holder}
                                                                    onChange={handleChange}
                                                                    placeholder="Holder Name"
                                                                    className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                name="pan_number"
                                                                value={formData.pan_number}
                                                                onChange={handleChange}
                                                                placeholder="PAN Number"
                                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="font-medium text-lg">{profileDetails.account_number || 'Not Set'}</p>
                                                            <p className="text-sm text-gray-600 font-medium">{profileDetails.bank_name} {profileDetails.branch_name ? `- ${profileDetails.branch_name}` : ''}</p>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1"><span className="uppercase">IFSC:</span> {profileDetails.ifsc}</span>
                                                                <span className="flex items-center gap-1"><span className="uppercase">PAN:</span> {profileDetails.pan_number}</span>
                                                                <span className="flex items-center gap-1"><span className="uppercase">Holder:</span> {profileDetails.account_holder}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Last Active - Common */}
                                    <div className="flex items-center gap-4 text-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase">Last Active</p>
                                            <p className="font-medium text-green-600">{profileDetails.last_active}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
