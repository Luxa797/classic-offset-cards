import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Database, Loader2, HardDrive, Server, RefreshCw, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [cacheSize, setCacheSize] = useLocalStorage('cacheSize', '100');
  const [autoBackup, setAutoBackup] = useLocalStorage('autoBackup', true);
  const [backupFrequency, setBackupFrequency] = useLocalStorage('backupFrequency', 'weekly');
  const [logLevel, setLogLevel] = useLocalStorage('logLevel', 'error');
  const [analyticsEnabled, setAnalyticsEnabled] = useLocalStorage('analyticsEnabled', true);

  const handleSaveSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('System settings saved successfully');
      setLoading(false);
    }, 1000);
  };

  const handleClearCache = () => {
    setLoading(true);
    
    // Simulate clearing cache
    setTimeout(() => {
      toast.success('Cache cleared successfully');
      setLoading(false);
    }, 1500);
  };

  const handleBackup = () => {
    setBackupLoading(true);
    
    // Simulate backup process
    setTimeout(() => {
      const date = new Date().toISOString().split('T')[0];
      const fileName = `classic_offset_backup_${date}.json`;
      
      // Create a dummy backup file
      const dummyData = { timestamp: new Date().toISOString(), type: 'backup' };
      const dataStr = JSON.stringify(dummyData);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Backup created successfully');
      setBackupLoading(false);
    }, 2000);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setRestoreLoading(true);
    
    // Simulate restore process
    setTimeout(() => {
      toast.success(`Restored from ${file.name}`);
      setRestoreLoading(false);
      
      // Reset the file input
      e.target.value = '';
    }, 2000);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">System Settings</h2>
      </div>
      
      <div className="space-y-8">
        {/* Cache Settings */}
        <div>
          <h3 className="text-lg font-medium mb-4">Cache Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                id="cacheSize"
                label="Cache Size (MB)"
                type="number"
                value={cacheSize}
                onChange={(e) => setCacheSize(e.target.value)}
                icon={<HardDrive className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum size of local cache storage
              </p>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleClearCache} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Clear Cache
              </Button>
            </div>
          </div>
        </div>
        
        {/* Backup & Restore */}
        <div>
          <h3 className="text-lg font-medium mb-4">Backup & Restore</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Automatic Backups</p>
                <p className="text-sm text-muted-foreground">Regularly backup your data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={autoBackup}
                  onChange={() => setAutoBackup(!autoBackup)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {autoBackup && (
              <div className="ml-6">
                <label className="block text-sm font-medium mb-1">Backup Frequency</label>
                <select
                  value={backupFrequency}
                  onChange={(e) => setBackupFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Button 
                variant="outline" 
                onClick={handleBackup} 
                disabled={backupLoading}
                className="flex items-center gap-2"
              >
                {backupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Create Backup
              </Button>
              
              <div className="relative">
                <Button 
                  variant="outline" 
                  disabled={restoreLoading}
                  className="flex items-center gap-2 w-full"
                  onClick={() => document.getElementById('restore-file')?.click()}
                >
                  {restoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Restore from Backup
                </Button>
                <input 
                  id="restore-file" 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleRestore}
                  disabled={restoreLoading}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Logging & Analytics */}
        <div>
          <h3 className="text-lg font-medium mb-4">Logging & Analytics</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Log Level</label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="error">Error Only</option>
                <option value="warn">Warnings & Errors</option>
                <option value="info">Info & Above</option>
                <option value="debug">Debug (Verbose)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Control the level of detail in application logs
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Usage Analytics</p>
                <p className="text-sm text-muted-foreground">Help us improve by sharing anonymous usage data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={analyticsEnabled}
                  onChange={() => setAnalyticsEnabled(!analyticsEnabled)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Server Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">System Information</h3>
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">App Version</span>
              <span className="text-sm">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Database</span>
              <span className="text-sm">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Storage</span>
              <span className="text-sm">Supabase Storage</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm">{new Date().toLocaleDateString()}</span>
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
              'Save System Settings'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SystemSettings;