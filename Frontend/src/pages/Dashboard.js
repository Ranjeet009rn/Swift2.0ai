import React from 'react';
import { useAuth } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import FranchiseDashboard from './FranchiseDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  // Default to 'user' if role is missing, ensuring a fallback view is always shown
  const role = user?.role?.toLowerCase() || 'user';

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'franchise') {
    return <FranchiseDashboard />;
  }

  // Default Dashboard for 'user' and any other roles
  return <UserDashboard />;
};

export default Dashboard;
