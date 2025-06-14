import React, { useEffect, useState } from 'react'; // useEffect, useState ஐ சேர்க்கவும்
import { supabase } from '@/lib/supabaseClient'; // supabase ஐ சேர்க்கவும்
import * as LucideIcons from 'lucide-react'; // அனைத்து Lucide ஐகான்களையும் இறக்குமதி செய்யவும்
import { Loader2, AlertTriangle, Frown } from 'lucide-react'; // லோடிங்/பிழை ஐகான்களைச் சேர்க்கவும்

// Feature க்கான interface
interface Feature {
  id: string;
  title: string;
  description: string;
  icon_name: string; // டேட்டாபேஸிலிருந்து வரும் ஐகான் பெயர்
  order_index: number;
  is_active: boolean;
}

const HighlightFeatures: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('features')
          .select('*')
          .eq('is_active', true) // செயலில் உள்ள அம்சங்களை மட்டும் பெறவும்
          .order('order_index', { ascending: true }); // வரிசைப்படி பெறவும்

        if (fetchError) throw fetchError;

        setFeatures(data || []);
      } catch (err: any) {
        console.error('❌ Error fetching features:', err.message);
        setError(`Failed to load features: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  // Lucide ஐகான் பெயரை அதன் component ஆக map செய்யும் helper ஃபங்ஷன்
  const getLucideIcon = (iconName: string) => {
    // LucideIcons ஆப்ஜெக்ட்டில் இருந்து ஐகானைக் கண்டறியவும்
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={28} />;
    }
    // ஐகான் காணப்படவில்லை என்றால் ஒரு இயல்புநிலை ஐகானைத் திரும்பவும்
    return <LucideIcons.HelpCircle size={28} />; // ஒரு இயல்புநிலை ஐகான்
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading features...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Frown className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">No features defined yet.</p>
        <p className="text-sm">Add features in your admin panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feat) => (
        <div
          key={feat.id} // key ஐ id ஐப் பயன்படுத்துதல்
          className="flex items-start gap-4 bg-white dark:bg-zinc-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="text-blue-600 dark:text-blue-400">{getLucideIcon(feat.icon_name)}</div> {/* டைனமிக் ஐகான் */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-1">{feat.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{feat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HighlightFeatures;