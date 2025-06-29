import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
  orientation?: 'horizontal' | 'vertical';
  persist?: boolean;
  persistKey?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  className = '',
  tabsClassName = '',
  contentClassName = '',
  orientation = 'horizontal',
  persist = false,
  persistKey = 'app-tab-state',
}) => {
  // Initialize active tab, checking localStorage if persist is true
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (persist) {
      try {
        const savedTab = localStorage.getItem(persistKey);
        // Check if the saved tab exists in the current tabs
        if (savedTab && tabs.some(tab => tab.id === savedTab)) {
          return savedTab;
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
    return defaultTab || tabs[0]?.id || '';
  });

  // Update localStorage when active tab changes
  useEffect(() => {
    if (persist) {
      try {
        localStorage.setItem(persistKey, activeTab);
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
  }, [activeTab, persist, persistKey]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  // Get variant-specific styles
  const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
    const baseStyles = 'flex items-center gap-2 transition-all duration-200 focus:outline-none';
    
    if (isDisabled) {
      return `${baseStyles} cursor-not-allowed opacity-50`;
    }
    
    switch (variant) {
      case 'pills':
        return twMerge(
          baseStyles,
          'px-4 py-2 rounded-full font-medium text-sm',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        );
      case 'underline':
        return twMerge(
          baseStyles,
          'px-4 py-2 font-medium text-sm border-b-2',
          isActive 
            ? 'border-primary text-primary' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
        );
      default:
        return twMerge(
          baseStyles,
          'px-4 py-2 rounded-lg font-medium text-sm',
          isActive 
            ? 'bg-muted text-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        );
    }
  };

  // Get the active tab content
  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={twMerge(
      'w-full',
      orientation === 'vertical' ? 'flex gap-4' : 'flex flex-col',
      className
    )}>
      {/* Tabs */}
      <div className={twMerge(
        orientation === 'horizontal' 
          ? 'flex overflow-x-auto scrollbar-hide' 
          : 'flex flex-col',
        tabsClassName
      )}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            className={getTabStyles(tab.id === activeTab, !!tab.disabled)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div 
        className={twMerge(
          'mt-4 flex-1',
          orientation === 'vertical' ? 'border-l pl-4' : '',
          contentClassName
        )}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeContent}
        </motion.div>
      </div>
    </div>
  );
};

export default Tabs;