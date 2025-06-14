import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const userId = data.user?.id;

      if (userId) {
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: userId,
            email,
            name,
            role: 'Staff',
          },
        ]);

        if (insertError) {
          console.error('Insert error:', insertError.message);
          setError('Signup succeeded but failed to save user info.');
          return;
        }
      }

      alert('✅ Signup successful! Please check your email to confirm.');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white shadow p-6 rounded">
      <h2 className="text-xl font-bold mb-4">
        {isSignup ? 'Sign Up for Classic Offset' : 'Login to Classic Offset'}
      </h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit}>
        {isSignup && (
          <input
            className="w-full mb-3 p-2 border rounded"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="w-full mb-3 p-2 border rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full mb-3 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="text-blue-600 underline"
        >
          {isSignup ? 'Login here' : 'Sign up here'}
        </button>
      </p>
    </div>
  );
}
