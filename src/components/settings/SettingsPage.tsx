import React from 'react';
import UserProfileSettings from './UserProfileSettings';
import NotificationSettings from './NotificationSettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="space-y-8">
        <UserProfileSettings />
        <NotificationSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
