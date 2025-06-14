console.log("Supabase URL from env:", import.meta.env.VITE_SUPABASE_URL);
console.log("All Env Variables:", import.meta.env);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
