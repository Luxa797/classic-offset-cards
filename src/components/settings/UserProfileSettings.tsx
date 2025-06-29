import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, User, Mail, Phone, MapPin, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfileSettings: React.FC = () => {
  const { user, userProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    bio: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile?.phone || '',
        address: userProfile?.address || '',
        company: userProfile?.company || '',
        bio: userProfile?.bio || '',
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          company: formData.company || null,
          bio: formData.bio || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">User Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            icon={<User className="h-4 w-4" />}
            required
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="h-4 w-4" />}
            disabled
            helperText="Email cannot be changed"
          />
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            icon={<Phone className="h-4 w-4" />}
          />
          <Input
            id="company"
            label="Company"
            value={formData.company}
            onChange={handleChange}
            icon={<Building className="h-4 w-4" />}
          />
        </div>

        <TextArea
          id="address"
          label="Address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
        />

        <TextArea
          id="bio"
          label="Bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          helperText="Tell us a little about yourself"
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UserProfileSettings;