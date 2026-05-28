import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    
    try {
      await api.post('/auth/password-reset', { email });
      setSuccess(true);
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-6">
      <div className="max-w-md w-full theme-diary-parchment font-diary p-8 rounded-3xl shadow-lg relative overflow-hidden">
        
        {/* Decorative Tape */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 polaroid-tape"></div>

        <div className="text-center space-y-3 mb-8 mt-4 select-none">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-amber-950">Recover Book</h2>
          <p className="text-sm font-sans text-stone-600">We will mail a reset link using Google Gmail</p>
        </div>

        {success ? (
          <div className="space-y-6 text-center font-sans">
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200/50 flex flex-col items-center gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-600 mb-1" />
              <span className="font-bold">Email Sent Successfully!</span>
              <p className="text-stone-600 text-xs">
                If an account with <strong>{email}</strong> exists, a password reset link has been dispatched via Gmail API.
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full py-3.5 bg-amber-900 hover:bg-amber-800 text-white font-bold rounded-xl transition text-center shadow-scrapbook"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            {err && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-sm font-sans flex items-center gap-2 border border-red-200/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 font-sans">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-amber-950">Registered Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. your-email@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-amber-900 text-white font-bold rounded-xl hover:bg-amber-800 transition duration-150 shadow-scrapbook"
              >
                {loading ? 'Transmitting...' : 'Send Recovery Email'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-sans text-stone-600 select-none">
              Remember your password?{' '}
              <Link to="/login" className="text-amber-900 font-bold hover:underline">
                Log In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
