import React from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../src/types';

interface ProviderDashboardProps {
  user: User;
  profile: UserProfile;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, profile }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 font-display mb-4">Provider Dashboard</h1>
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-gray-600">Welcome, {profile.name}! Your dashboard is under construction.</p>
      </div>
    </div>
  );
};
