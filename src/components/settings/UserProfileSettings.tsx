import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

const UserProfileSettings: React.FC = () => {
  return (
    <Card title="User Profile">
      <form>
        <div className="space-y-4">
          <Input
            label="Name"
            id="name"
            type="text"
            defaultValue="John Doe"
          />
          <Input
            label="Email"
            id="email"
            type="email"
            defaultValue="john.doe@example.com"
          />
        </div>
        <div className="mt-6">
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UserProfileSettings;
