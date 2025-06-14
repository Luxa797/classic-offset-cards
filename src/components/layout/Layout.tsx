// src/components/layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { useTheme } from '@/lib/ThemeProvider';

interface LayoutProps {
  children: React.ReactNode;
}

// பக்கம் மாறும்போது மேலே ஸ்க்ரோல் செய்ய
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelector('.main-content')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  // பெரிய திரைகளுக்கு பக்கப் பட்டியை தானாகத் திறக்கவும்
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // ஆரம்பத்தில் சரிபார்க்க
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`min-h-screen flex bg-gray-100 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      <ScrollToTop />
      
      {/* Sidebar for Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Sidebar for Mobile (Slide-over) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            />
            {/* Mobile Sidebar Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-40 lg:hidden"
            >
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar main-content">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <motion.div
                key={useLocation().pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;