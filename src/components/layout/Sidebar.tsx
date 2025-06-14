// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
// ✅ framer-motion-லிருந்து AnimatePresence மற்றும் motion-ஐ இறக்குமதி செய்யவும்
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, DollarSign, Package, Users, UserCircle,
  AlertCircle, ActivitySquare, FileSignature, Boxes, X,
  Briefcase, BarChart3, ChevronDown, MessageCircle, Settings, MessageSquare
} from 'lucide-react';
// import { useUser } from '@/context/UserContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
}

interface NavGroup {
  name: string;
  icon: JSX.Element;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    name: 'Overview',
    icon: <BarChart3 size={20} />,
    items: [
      { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
      { name: 'Status Overview', path: '/status-overview', icon: <ActivitySquare size={18} /> },
      { name: 'Due Summary', path: '/due-summary', icon: <AlertCircle size={18} /> },
    ],
  },
  {
    name: 'Operations',
    icon: <Briefcase size={20} />,
    items: [
      { name: 'Orders', path: '/orders', icon: <FileText size={18} /> },
      { name: 'Expenses', path: '/expenses', icon: <DollarSign size={18} /> },
      { name: 'Materials', path: '/materials', icon: <Package size={18} /> },
      { name: 'Products', path: '/products', icon: <Boxes size={18} /> },
      { name: 'Invoices', path: '/invoices', icon: <FileSignature size={18} /> },
    ],
  },
  {
    name: 'Management',
    icon: <Users size={20} />,
    items: [
      { name: 'Customers', path: '/customers', icon: <UserCircle size={18} /> },
      { name: 'Staff', path: '/staff', icon: <Users size={18} /> },
      { name: 'Payments', path: '/payments', icon: <DollarSign size={18} /> },
      { name: 'Users', path: '/users', icon: <Users size={18} /> },
      { name: 'Stock', path: '/stock', icon: <Package size={18} /> },
      { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
    ],
  },
  {
    name: 'Communication',
    icon: <MessageCircle size={20} />,
    items: [
      { name: 'WhatsApp Dashboard', path: '/whatsapp', icon: <MessageCircle size={18} /> },
      { name: 'Team Chat', path: '/team-chat', icon: <MessageSquare size={18} /> },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(navGroups.map(g => g.name));

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  return (
    <aside className="h-full w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Classic Offset
        </h1>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.name} className="space-y-1">
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {group.icon}
              <span className="ml-3 flex-1 text-left">{group.name}</span>
              <ChevronDown
                size={16}
                className={`transform transition-transform duration-200 ${expandedGroups.includes(group.name) ? 'rotate-180' : ''}`}
              />
            </button>

            {/* ✅ AnimatePresence இங்கே பயன்படுத்தப்படுகிறது */}
            <AnimatePresence>
              {expandedGroups.includes(group.name) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 overflow-hidden"
                >
                  <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600 ml-3">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `
                          flex items-center px-3 py-2 my-1 rounded-lg text-sm
                          transition-colors duration-200
                          ${isActive
                            ? 'bg-primary-50 text-primary-600 font-semibold dark:bg-primary-900/50 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`
                        }
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span>{item.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
