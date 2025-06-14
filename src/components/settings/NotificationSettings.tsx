import React from 'react';

const NotificationSettings: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <form>
        <div className="flex items-center mb-4">
          <input
            id="email-notifications"
            name="email-notifications"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            defaultChecked
          />
          <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
            Email Notifications
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="sms-notifications"
            name="sms-notifications"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900">
            SMS Notifications
          </label>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;
