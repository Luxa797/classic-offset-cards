// src/components/ui/ProfileDropdown.tsx

import { useState, useEffect, useRef } from 'react'; // ✅ useRef-ஐ இறக்குமதி செய்யவும்
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '@/hooks/useClickOutside'; // ✅ நமது புதிய hook-ஐ இறக்குமதி செய்யவும்

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string; role?: string }>({});
  const navigate = useNavigate();

  // ✅ డ్రాప్-డౌన్ கூறின் ref-ஐ உருவாக்கவும்
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ வெளியே கிளிக் செய்தால், డ్రాప్-డౌன்-ஐ மூடவும்
  useClickOutside(dropdownRef, () => setOpen(false));

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('name, email, role').eq('id', user.id).maybeSingle();
        if (data) setUserInfo(data);
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    setOpen(false); // லாக்-அவுட் செய்வதற்கு முன் డ్రాప్-డౌన్-ஐ மூடவும்
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/login');
    else alert('Logout failed: ' + error.message);
  };

  return (
    // ✅ ref-ஐ ಮುಖ್ಯ div-உடன் இணைக்கவும்
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center focus:outline-none"
      >
        {userInfo?.name?.[0] || 'CO'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b dark:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{userInfo?.name || 'Logged In'}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{userInfo?.email}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Role: {userInfo?.role || 'Unknown'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;