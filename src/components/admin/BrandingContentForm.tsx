import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import TextArea from '../ui/TextArea'; // TextArea ஐ நீக்கலாம் அல்லது மற்ற நோக்கங்களுக்கு வைத்திருக்கலாம்
import Button from '../ui/Button';
import { Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import ReactQuill from 'react-quill'; // NEW: ReactQuill ஐ இறக்குமதி செய்யவும்
import 'react-quill/dist/quill.snow.css'; // NEW: Quill இன் ஸ்டைல்களை இறக்குமதி செய்யவும்

interface SiteContent {
  id: string;
  section_name: string;
  content: string | null;
  last_updated_at: string;
}

interface BrandingContentFormProps {
  sectionName: string;
}

const BrandingContentForm: React.FC<BrandingContentFormProps> = ({ sectionName }) => {
  const { userProfile } = useUser();
  const [content, setContent] = useState<string>(''); // இது HTML உள்ளடக்கத்தை வைத்திருக்கப் போகிறது
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('site_content')
          .select('*')
          .eq('section_name', sectionName)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (data) {
          setContent(data.content || '');
          setContentId(data.id);
        } else {
          setContent('');
          setContentId(null);
        }
      } catch (err: any) {
        console.error(`❌ Error fetching content for ${sectionName}:`, err.message);
        setError(`Failed to load content for ${sectionName}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [sectionName]);

  const handleSave = async () => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can edit site content.');
      return;
    }

    setSaving(true);
    toast.loading('Saving content...', { id: 'saveContentToast' });
    try {
      // ReactQuill HTML ஸ்ட்ரிங்கைக் கொடுக்கும், எனவே அதை நேரடியாகச் சேமிக்கலாம்
      const dataToSave = {
        section_name: sectionName,
        content: content.trim() || null, 
      };

      if (contentId) {
        const { error: updateError } = await supabase
          .from('site_content')
          .update(dataToSave)
          .eq('id', contentId);
        if (updateError) throw updateError;
        toast.success('Content updated successfully!', { id: 'saveContentToast' });
      } else {
        const { error: insertError } = await supabase.from('site_content').insert(dataToSave);
        if (insertError) throw insertError;
        toast.success('Content added successfully!', { id: 'saveContentToast' });
        const { data: newContentData } = await supabase.from('site_content').select('id').eq('section_name', sectionName).single();
        if(newContentData) setContentId(newContentData.id);
      }
    } catch (err: any) {
      console.error('Failed to save content:', err.message);
      toast.error(`Failed to save content: ${err.message}`, { id: 'saveContentToast' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading content...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">Error Loading Content</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  // Quill இன் மாட்யூல்கள் மற்றும் வடிவங்கள்
  const modules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video'
  ];

  return (
    <Card title={`Manage ${sectionName} Content`}>
      <div className="mb-4"> {/* Quill editor க்காக சில ஸ்பேஸ் சேர்க்கவும் */}
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Content (HTML allowed)
        </label>
        <ReactQuill 
          theme="snow" // அல்லது 'bubble'
          value={content} 
          onChange={setContent} 
          modules={modules}
          formats={formats}
          placeholder="Enter your branding content here. HTML tags are allowed."
          readOnly={saving} // சேமிக்கும்போது எடிட்டரை முடக்கவும்
          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg" // டார்க் மோடு ஸ்டைல்கள்
          style={{ height: '250px' }} // Quill editor க்கான உயரம்
        />
      </div>
      <div className="flex justify-end mt-16"> {/* Quill editor உயரத்திற்குப் பிறகு பட்டன்களை நகர்த்தவும் */}
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...
            </>
          ) : (
            'Save Content'
          )}
        </Button>
      </div>
    </Card>
  );
};

export default BrandingContentForm;