import React from 'react';
import UserProfileSettings from './UserProfileSettings';
import NotificationSettings from './NotificationSettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>
      <div className="space-y-8">
        <UserProfileSettings />
        <NotificationSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
