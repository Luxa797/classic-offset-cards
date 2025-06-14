// src/components/admin/FeatureFormModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import * as LucideIcons from 'lucide-react'; // அனைத்து Lucide ஐகான்களையும் இறக்குமதி செய்யவும்
import { Loader2 } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  order_index: number;
  is_active: boolean;
}

interface FeatureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
  editingFeature?: Feature | null; // திருத்தப்படும் அம்சம், புதியதாக இருந்தால் null
}

const FeatureFormModal: React.FC<FeatureFormModalProps> = ({ isOpen, onClose, onSave, editingFeature }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon_name: '',
    order_index: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  // useEffect (feature ஐ எடிட் செய்யும்போது படிவத்தை நிரப்ப)
  useEffect(() => {
    if (editingFeature) {
      setFormData({
        title: editingFeature.title,
        description: editingFeature.description,
        icon_name: editingFeature.icon_name,
        order_index: editingFeature.order_index,
        is_active: editingFeature.is_active,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        icon_name: '',
        order_index: 0,
        is_active: true,
      });
    }
  }, [editingFeature, isOpen]);

  // handleChange ஃபங்ஷன்
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  // handleSubmit ஃபங்ஷன்
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can manage features.');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        icon_name: formData.icon_name.trim(),
        order_index: Number(formData.order_index),
        is_active: formData.is_active,
      };

      if (editingFeature) {
        const { error } = await supabase
          .from('features')
          .update(dataToSave)
          .eq('id', editingFeature.id);
        if (error) throw error;
        toast.success('Feature updated successfully!');
      } else {
        const { error } = await supabase.from('features').insert(dataToSave);
        if (error) throw error;
        toast.success('Feature added successfully!');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to save feature:', err.message);
      toast.error(`Failed to save feature: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lucide ஐகான் பெயர்களின் பட்டியல் (சரிசெய்யப்பட்டது)
  const lucideIconNames = useMemo(() => {
    const allKeys = Object.keys(LucideIcons);

    const names = allKeys.filter(name => 
      // 'createLucideIcon' helper function ஐ நீக்குதல்
      name !== 'createLucideIcon' && 
      // 'Icon' என்று முடிவடையும் பெயர்களை நீக்குதல் (Ex: 'ActivityIcon', 'AlertTriangleIcon')
      // 'Activity', 'AlertTriangle' போன்ற பிரதான பெயர்களை மட்டும் வைத்திருத்தல்
      !name.endsWith('Icon') 
    ).sort();

    console.log("Filtered Lucide Icon Names (for dropdown - FINAL CHECK):", names); // சரிசெய்யப்பட்ட லாக்
    return names;
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingFeature ? 'Edit Feature' : 'Add New Feature'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Title"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <TextArea
          id="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          disabled={loading}
        />
        <Select
          id="icon_name"
          label="Icon Name (Lucide Icons)"
          value={formData.icon_name}
          onChange={handleChange}
          options={lucideIconNames.map(icon => ({ value: icon, label: icon }))}
          placeholder="Select an icon or type"
          required
          disabled={loading}
        />
        <Input
          id="order_index"
          label="Order Index"
          type="number"
          value={formData.order_index}
          onChange={handleChange}
          min="0"
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
            disabled={loading}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Is Active (Show on Website)
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Feature'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FeatureFormModal;