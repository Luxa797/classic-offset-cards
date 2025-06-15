import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
// import { auth as firebaseAuth } from '@/lib/firebaseClient'; // Reverted
// import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Reverted

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };
  
  /*
  // Reverted Google Login functionality
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Sign in with Firebase
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;

      if (!user) {
        throw new Error("No user found after Google sign-in.");
      }

      // 2. Get Firebase ID token
      const idToken = await user.getIdToken();

      // 3. Call Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('firebase-auth', {
        body: { idToken },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }
      
      if (!data.access_token) {
        throw new Error(data.error || "Supabase session could not be created.");
      }

      // 4. Set Supabase session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }
      
      // 5. Navigate to dashboard
      navigate('/');

    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'An unexpected error occurred during Google sign-in.');
    } finally {
      setLoading(false);
    }
  };
  */

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white shadow-lg rounded-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Classic Offset</h1>
          <p className="mt-2 text-gray-500">Welcome back! Please sign in.</p>
        </div>

        {error && (
            <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-lg">
                {error}
            </div>
        )}

        {/* 
        // Reverted Google Login Button
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" width="48px" height="48px"><defs><path id="a" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></defs><clipPath id="b"><use xlinkHref="#a" overflow="visible"/></clipPath><path clipPath="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z"/><path clipPath="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z"/><path clipPath="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z"/><path clipPath="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z"/></svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
        </div>
        */}
        
        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="password-login" className="sr-only">Password</label>
            <input
              id="password-login"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login with Email'}
          </button>
        </form>
      </div>
    </div>
  );
}
