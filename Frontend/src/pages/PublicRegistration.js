import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';

const PublicRegistration = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <RegistrationForm onBackToLogin={() => navigate('/login')} />
        </div>
    );
};

export default PublicRegistration;
