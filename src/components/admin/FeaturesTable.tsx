import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Loader2, AlertTriangle, Edit, Trash2, Check, X, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext'; // useUser ஐ இறக்குமதி செய்யவும்
import ConfirmationModal from '../ui/ConfirmationModal'; // ConfirmationModal ஐ இறக்குமதி செய்யவும்
import * as LucideIcons from 'lucide-react'; // அனைத்து Lucide ஐகான்களையும் இறக்குமதி செய்யவும்

interface Feature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

interface FeaturesTableProps {
  onEditFeature: (feature: Feature) => void; // எடிட் செய்ய அம்சத்தை அனுப்ப
  onDataChange: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
}

const FeaturesTable: React.FC<FeaturesTableProps> = ({ onEditFeature, onDataChange }) => {
  const { userProfile } = useUser(); // பயனரின் ரோலைப் பெற
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null); // நீக்கப்பட வேண்டிய அம்சம்
  const [showDeleteModal, setShowDeleteModal] = useState(false); // நீக்குதல் மோடலை கட்டுப்படுத்த

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('features')
        .select('*')
        .order('order_index', { ascending: true }); // வரிசைப்படி பெறவும்

      if (fetchError) throw fetchError;
      setFeatures(data || []);
    } catch (err: any) {
      console.error('Failed to fetch features:', err.message);
      setError(`Failed to load features: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures, onDataChange]); // onDataChange மாறும்போதும் தரவைப் புதுப்பிக்க

  const handleDelete = (feature: Feature) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can delete features.');
      return;
    }
    setFeatureToDelete(feature);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!featureToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', featureToDelete.id);

      if (error) throw error;
      toast.success('Feature deleted successfully!');
      onDataChange(); // parent ஐ புதுப்பிக்க
      setShowDeleteModal(false); // மோடலை மூடவும்
      setFeatureToDelete(null); // மீட்டமைக்கவும்
    } catch (err: any) {
      console.error('Failed to delete feature:', err.message);
      toast.error(`Failed to delete feature: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (feature: Feature) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can toggle feature status.');
      return;
    }
    setLoading(true); // தற்காலிகமாக loading ஐ அமைக்கவும்
    try {
      const { error } = await supabase
        .from('features')
        .update({ is_active: !feature.is_active })
        .eq('id', feature.id);

      if (error) throw error;
      toast.success(`Feature status changed to ${!feature.is_active ? 'Active' : 'Inactive'}!`);
      onDataChange(); // தரவைப் புதுப்பிக்க
    } catch (err: any) {
      console.error('Failed to toggle feature status:', err.message);
      toast.error(`Failed to toggle status: ${err.message}`);
    } finally {
      // setLoading(false); // தரவு புதுப்பிக்கப்படும்போது fetchFeatures ஆல் கையாளப்படுகிறது
    }
  };

  const handleReorder = async (feature: Feature, direction: 'up' | 'down') => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can reorder features.');
      return;
    }

    const currentIndex = features.findIndex(f => f.id === feature.id);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < features.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // Already at top/bottom
    }

    const featureToMove = features[currentIndex];
    const featureToSwap = features[newIndex];

    // Swap order_index values
    const originalOrderIndex1 = featureToMove.order_index;
    const originalOrderIndex2 = featureToSwap.order_index;

    // Use a transaction if possible, or update one by one
    setLoading(true); // தற்காலிகமாக loading ஐ அமைக்கவும்
    try {
      // Batch update the order_index for the two features
      const { error: error1 } = await supabase
        .from('features')
        .update({ order_index: originalOrderIndex2 })
        .eq('id', featureToMove.id);
      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('features')
        .update({ order_index: originalOrderIndex1 })
        .eq('id', featureToSwap.id);
      if (error2) throw error2;

      toast.success('Feature reordered successfully!');
      onDataChange(); // தரவைப் புதுப்பிக்க
    } catch (err: any) {
      console.error('Failed to reorder feature:', err.message);
      toast.error(`Failed to reorder feature: ${err.message}`);
    } finally {
      // setLoading(false); // fetchFeatures ஆல் கையாளப்படுகிறது
    }
  };


  // Lucide ஐகான் பெயரை அதன் component ஆக map செய்யும் helper ஃபங்ஷன்
  const getLucideIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={20} />; // டேபிளில் சிறிய ஐகான்
    }
    return <LucideIcons.HelpCircle size={20} className="text-gray-400" />;
  };

  if (loading && features.length === 0) { // ஆரம்ப loading க்காக
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading features...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">Error Loading Features</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card title="Manage Highlight Features">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
        <Button onClick={() => onEditFeature(null)} variant="primary" size="sm"> {/* புதிய அம்சத்தைச் சேர்க்க */}
          Add New Feature
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Icon</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-center font-medium">Active</th>
              <th className="px-4 py-3 text-center font-medium">Order</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {features.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No features found. Click "Add New Feature" to add one.
                </td>
              </tr>
            ) : (
              features.map((feature) => (
                <tr key={feature.id}>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {getLucideIcon(feature.icon_name)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{feature.title}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">{feature.description}</td>
                  <td className="px-4 py-3 text-center">
                    {feature.is_active ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{feature.order_index}</td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditFeature(feature)} title="Edit Feature">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(feature)} title="Toggle Active">
                      {feature.is_active ? <LucideIcons.EyeOff size={16} /> : <LucideIcons.Eye size={16} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(feature)} title="Delete Feature">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReorder(feature, 'up')} disabled={features.indexOf(feature) === 0} title="Move Up">
                      <ArrowUp size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReorder(feature, 'down')} disabled={features.indexOf(feature) === features.length - 1} title="Move Down">
                      <ArrowDown size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default FeaturesTable;