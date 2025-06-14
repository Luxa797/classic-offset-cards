// src/components/layout/TopHeader.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// ✅ மாற்றம்: NotificationBell இறக்குமதி செய்யப்பட்டது, பழைய Bell ஐகான் நீக்கப்பட்டது
import { Menu, Sun, Moon, GalleryHorizontal, MessageCircle, Settings } from 'lucide-react'; 
import { useTheme } from '@/lib/ThemeProvider';
import ProfileDropdown from '../ui/ProfileDropdown';
import WhatsAppModal from '../WhatsAppModal';
import { useUser } from '@/context/UserContext'; 
import NotificationBell from './NotificationBell'; // ✅ புதிய NotificationBell கூறு இறக்குமதி செய்யப்பட்டது

interface TopHeaderProps {
  onMenuClick: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const { userProfile } = useUser();
  const isAdminOrOwner = userProfile?.role === 'Owner' || userProfile?.role === 'Manager';

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left Side - Sidebar toggle for mobile */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Showcase Shortcut */}
            <Link
              to="/showcase"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors duration-200 group"
            >
              <GalleryHorizontal
                size={16}
                className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
              />
              Showcase
            </Link>

            {/* WhatsApp Quick Send */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>

            {/* Admin Content Management Shortcut */}
            {isAdminOrOwner && (
              <Link
                to="/admin/content"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 group"
              >
                <Settings
                  size={16}
                  className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                />
                Admin
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* ✅ மாற்றம்: பழைய பட்டன் நீக்கப்பட்டு, புதிய NotificationBell கூறு சேர்க்கப்பட்டது */}
            <NotificationBell />

            {/* Profile */}
            <div className="border-l border-gray-200 dark:border-gray-700 pl-2 sm:pl-4">
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* WhatsApp Modal */}
      <WhatsAppModal isOpen={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} />
    </>
  );
};

export default TopHeader;