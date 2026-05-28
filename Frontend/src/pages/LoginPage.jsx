import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErr(result.error);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setErr('');
    const result = await googleLogin(response.credential);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErr(result.error);
    }
  };

  useEffect(() => {
    // 1. Check if Google script is already loaded
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        const btnContainer = document.getElementById('googleSignInBtn');
        const parentWidth = btnContainer?.parentElement?.offsetWidth || 384;

        window.google.accounts.id.initialize({
          client_id: '401552929527-pks7ai5n5e8grqaknnfo61i1lm5860p7.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(
          btnContainer,
          { 
            theme: 'outline', 
            size: 'large', 
            text: 'continue_with',
            shape: 'rectangular',
            width: parentWidth
          }
        );
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
      } else {
        const existingOnload = script.onload;
        script.onload = () => {
          if (existingOnload) existingOnload();
          initializeGoogleSignIn();
        };
      }
    }
  }, []);

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-6">
      {/* Diary Styled Parchment Form Box */}
      <div className="max-w-md w-full theme-diary-parchment font-diary p-8 rounded-3xl shadow-lg relative overflow-hidden">
        
        {/* Decorative Tape */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 polaroid-tape"></div>

        <div className="text-center space-y-3 mb-8 mt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-amber-950">Welcome Back</h2>
          <p className="text-sm font-sans text-stone-600">Open your digital scrapbook dashboard</p>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-sm font-sans flex items-center gap-2 border border-red-200/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-amber-950">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. nathan"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-amber-950">Password</label>
              <Link to="/forgot-password" className="text-xs text-amber-800 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-900 text-white font-bold rounded-xl hover:bg-amber-800 transition duration-150 shadow-scrapbook"
          >
            {loading ? 'Opening Book...' : 'Login with Password'}
          </button>
        </form>

        <div className="relative my-6 text-center font-sans">
          <hr className="border-stone-200" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#f7f1e3] text-stone-500 text-xs uppercase font-semibold">
            Or
          </span>
        </div>

        {/* Real Google Sign-In Button */}
        <div id="googleSignInBtnParent" className="w-full flex justify-center font-sans">
          <div id="googleSignInBtn" className="w-full"></div>
        </div>

        <p className="mt-8 text-center text-sm font-sans text-stone-600">
          Don't have a book yet?{' '}
          <Link to="/signup" className="text-amber-900 font-bold hover:underline">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
