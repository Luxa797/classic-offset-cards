import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Bell, Mail, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const NotificationSettings: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Use local storage for notification preferences
  const [emailNotifications, setEmailNotifications] = useLocalStorage('emailNotifications', true);
  const [pushNotifications, setPushNotifications] = useLocalStorage('pushNotifications', true);
  const [smsNotifications, setSmsNotifications] = useLocalStorage('smsNotifications', false);
  const [whatsappNotifications, setWhatsappNotifications] = useLocalStorage('whatsappNotifications', false);
  
  // Notification types
  const [orderUpdates, setOrderUpdates] = useLocalStorage('orderUpdates', true);
  const [paymentAlerts, setPaymentAlerts] = useLocalStorage('paymentAlerts', true);
  const [stockAlerts, setStockAlerts] = useLocalStorage('stockAlerts', true);
  const [systemAnnouncements, setSystemAnnouncements] = useLocalStorage('systemAnnouncements', true);
  
  // Notification frequency
  const [notificationFrequency, setNotificationFrequency] = useLocalStorage('notificationFrequency', 'realtime');

  const saveNotificationSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // In a real app, you would save these to the database
      // For now, we're just using localStorage and showing a success message
      
      toast.success('Notification preferences saved');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Notification Settings</h2>
      </div>
      
      <div className="space-y-8">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications in the app</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={pushNotifications}
                  onChange={() => setPushNotifications(!pushNotifications)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={smsNotifications}
                  onChange={() => setSmsNotifications(!smsNotifications)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">WhatsApp Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={whatsappNotifications}
                  onChange={() => setWhatsappNotifications(!whatsappNotifications)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-muted-foreground">Notifications about order status changes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={orderUpdates}
                  onChange={() => setOrderUpdates(!orderUpdates)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Payment Alerts</p>
                  <p className="text-sm text-muted-foreground">Notifications about payments and invoices</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={paymentAlerts}
                  onChange={() => setPaymentAlerts(!paymentAlerts)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Notifications about low stock and inventory</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={stockAlerts}
                  onChange={() => setStockAlerts(!stockAlerts)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">System Announcements</p>
                  <p className="text-sm text-muted-foreground">Important system updates and announcements</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={systemAnnouncements}
                  onChange={() => setSystemAnnouncements(!systemAnnouncements)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Notification Frequency */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Frequency</h3>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Delivery Frequency</p>
              <p className="text-sm text-muted-foreground">How often you want to receive notifications</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${notificationFrequency === 'realtime' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setNotificationFrequency('realtime')}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Real-time</h4>
                <div className={`w-4 h-4 rounded-full ${notificationFrequency === 'realtime' ? 'bg-primary' : 'border border-muted-foreground'}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">Receive notifications as events happen</p>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${notificationFrequency === 'daily' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setNotificationFrequency('daily')}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Daily Digest</h4>
                <div className={`w-4 h-4 rounded-full ${notificationFrequency === 'daily' ? 'bg-primary' : 'border border-muted-foreground'}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">Receive a daily summary of all notifications</p>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${notificationFrequency === 'weekly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setNotificationFrequency('weekly')}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Weekly Digest</h4>
                <div className={`w-4 h-4 rounded-full ${notificationFrequency === 'weekly' ? 'bg-primary' : 'border border-muted-foreground'}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">Receive a weekly summary of all notifications</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={saveNotificationSettings} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;