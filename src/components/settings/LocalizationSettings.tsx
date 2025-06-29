import React, { useState } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { Globe, Loader2, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const LocalizationSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useLocalStorage('language', 'en');
  const [dateFormat, setDateFormat] = useLocalStorage('dateFormat', 'DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useLocalStorage('timeFormat', '24h');
  const [currency, setCurrency] = useLocalStorage('currency', 'INR');
  const [timezone, setTimezone] = useLocalStorage('timezone', 'Asia/Kolkata');
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' }
  ];
  
  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
    { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (31-Dec-2025)' }
  ];
  
  const timeFormats = [
    { value: '12h', label: '12-hour (1:30 PM)' },
    { value: '24h', label: '24-hour (13:30)' }
  ];
  
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];
  
  const timezones = [
    { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
    { value: 'America/New_York', label: 'New York (GMT-5:00)' },
    { value: 'Europe/London', label: 'London (GMT+0:00)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8:00)' }
  ];

  const handleSaveSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Localization settings saved successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Localization Settings</h2>
      </div>
      
      <div className="space-y-8">
        {/* Language */}
        <div>
          <h3 className="text-lg font-medium mb-4">Language</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {languages.map(lang => (
              <div 
                key={lang.code}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => setLanguage(lang.code)}
              >
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lang.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Date & Time Format */}
        <div>
          <h3 className="text-lg font-medium mb-4">Date & Time Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {dateFormats.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Time Format</label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timeFormats.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Currency & Timezone */}
        <div>
          <h3 className="text-lg font-medium mb-4">Currency & Timezone</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.symbol} - {curr.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div>
          <h3 className="text-lg font-medium mb-4">Preview</h3>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Date & Time</p>
                <p className="text-muted-foreground">
                  {new Date().toLocaleDateString(
                    language === 'en' ? 'en-US' : language === 'ta' ? 'ta-IN' : 'en-IN', 
                    { 
                      year: 'numeric', 
                      month: dateFormat.includes('MMM') ? 'short' : 'numeric', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: timeFormat === '12h'
                    }
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Currency</p>
                <p className="text-muted-foreground">
                  {new Intl.NumberFormat(
                    language === 'en' ? 'en-US' : language === 'ta' ? 'ta-IN' : 'en-IN', 
                    { 
                      style: 'currency', 
                      currency: currency 
                    }
                  ).format(1234.56)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Localization Settings'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LocalizationSettings;