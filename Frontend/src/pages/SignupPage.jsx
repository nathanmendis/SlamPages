import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErr(result.error);
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-6">
      {/* Notebook styled paper for Signup */}
      <div className="max-w-md w-full theme-notebook-paper font-notebook p-8 rounded-3xl shadow-lg relative overflow-hidden">
        
        {/* Binder Holes representation in CSS */}
        <div className="absolute top-0 bottom-0 left-4 flex flex-col justify-around py-8 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-slate-200 border-inner shadow-inner"></div>
          <div className="w-4 h-4 rounded-full bg-slate-200 border-inner shadow-inner"></div>
          <div className="w-4 h-4 rounded-full bg-slate-200 border-inner shadow-inner"></div>
          <div className="w-4 h-4 rounded-full bg-slate-200 border-inner shadow-inner"></div>
        </div>

        <div className="pl-8 mt-2">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-amber-950">Create Scrapbook</h2>
            <p className="text-sm font-sans text-stone-600">Register to capture lifelong memories</p>
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
              <label className="text-sm font-bold text-amber-950">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. test@mail.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-amber-950">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-900 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-900 text-white font-bold rounded-xl hover:bg-amber-800 transition duration-150 shadow-scrapbook"
            >
              {loading ? 'Creating...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-sans text-stone-600">
            Already have a book?{' '}
            <Link to="/login" className="text-amber-900 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
