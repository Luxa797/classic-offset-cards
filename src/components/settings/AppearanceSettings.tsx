import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useTheme } from '@/lib/ThemeProvider';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');
  const [reducedMotion, setReducedMotion] = useLocalStorage('reducedMotion', false);
  const [highContrast, setHighContrast] = useLocalStorage('highContrast', false);
  const [colorScheme, setColorScheme] = useLocalStorage('colorScheme', 'blue');
  
  const handleSaveAppearance = () => {
    // Apply font size
    document.documentElement.style.fontSize = 
      fontSize === 'small' ? '14px' : 
      fontSize === 'large' ? '18px' : '16px';
    
    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    toast.success('Appearance settings saved');
  };

  // Apply settings on initial load
  useEffect(() => {
    document.documentElement.style.fontSize = 
      fontSize === 'small' ? '14px' : 
      fontSize === 'large' ? '18px' : '16px';
    
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }, [fontSize, reducedMotion, highContrast]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sun className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Appearance Settings</h2>
      </div>
      
      <div className="space-y-8">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-medium mb-4">Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setTheme('light')}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium">Light</h4>
                </div>
                {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="h-20 bg-white border rounded-md flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setTheme('dark')}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-400" />
                  <h4 className="font-medium">Dark</h4>
                </div>
                {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="h-20 bg-gray-900 border border-gray-700 rounded-md flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setTheme('system')}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium">System</h4>
                </div>
                {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="h-20 bg-gradient-to-r from-white to-gray-900 border rounded-md flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Font Size */}
        <div>
          <h3 className="text-lg font-medium mb-4">Font Size</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${fontSize === 'small' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setFontSize('small')}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">Small</h4>
                {fontSize === 'small' && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${fontSize === 'medium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setFontSize('medium')}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Medium</h4>
                {fontSize === 'medium' && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${fontSize === 'large' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setFontSize('large')}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-lg">Large</h4>
                {fontSize === 'large' && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Accessibility */}
        <div>
          <h3 className="text-lg font-medium mb-4">Accessibility</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reduced Motion</p>
                <p className="text-sm text-muted-foreground">Minimize animations throughout the interface</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={reducedMotion}
                  onChange={() => setReducedMotion(!reducedMotion)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Contrast</p>
                <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={highContrast}
                  onChange={() => setHighContrast(!highContrast)}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Color Scheme */}
        <div>
          <h3 className="text-lg font-medium mb-4">Color Scheme</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'red', 'gray'].map((color) => (
              <div 
                key={color}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${colorScheme === color ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => setColorScheme(color)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium capitalize">{color}</h4>
                  {colorScheme === color && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className={`h-6 rounded-md bg-${color}-500`}></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSaveAppearance}>
            Save Appearance Settings
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AppearanceSettings;