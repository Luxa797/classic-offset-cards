import React from 'react';
import Card from '../ui/Card';

const NotificationSettings: React.FC = () => {
  return (
    <Card title="Notifications">
      <form>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="email-notifications"
              name="email-notifications"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              defaultChecked
            />
            <label htmlFor="email-notifications" className="ml-3 block text-sm font-medium text-foreground">
              Email Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sms-notifications"
              name="sms-notifications"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <label htmlFor="sms-notifications" className="ml-3 block text-sm font-medium text-foreground">
              SMS Notifications
            </label>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default NotificationSettings;
