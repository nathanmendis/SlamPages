import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ResetPasswordConfirmPage = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');
  const [resetsRemaining, setResetsRemaining] = useState(null);

  React.useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        const response = await api.get('/auth/password-reset/confirm', {
          params: { uidb64: uid, token: token }
        });
        setResetsRemaining(response.data.resets_remaining);
      } catch (error) {
        setErr(error.response?.data?.error || 'Invalid or expired password reset link.');
      } finally {
        setCheckingToken(false);
      }
    };
    checkTokenValidity();
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErr('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/password-reset/confirm', {
        uidb64: uid,
        token: token,
        password: password
      });
      setResetsRemaining(response.data.resets_remaining);
      setSuccess(true);
    } catch (error) {
      setErr(error.response?.data?.error || 'Invalid or expired password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-6">
      {/* Notebook ruled page style for password confirmation reset */}
      <div className="max-w-md w-full theme-notebook-paper font-notebook p-8 rounded-3xl shadow-lg relative overflow-hidden">
        
        {/* Binder representation */}
        <div className="absolute top-0 bottom-0 left-4 flex flex-col justify-around py-8 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-slate-200 shadow-inner"></div>
          <div className="w-4 h-4 rounded-full bg-slate-200 shadow-inner"></div>
          <div className="w-4 h-4 rounded-full bg-slate-200 shadow-inner"></div>
        </div>

        <div className="pl-8 mt-2">
          <div className="text-center space-y-3 mb-8 select-none">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-amber-950">Reset Password</h2>
            <p className="text-sm font-sans text-stone-600">Enter a secure new password for your account</p>
          </div>

          {checkingToken ? (
            <div className="py-12 text-center space-y-3 font-sans">
              <div className="w-8 h-8 border-4 border-amber-950/20 border-t-amber-950 rounded-full animate-spin mx-auto"></div>
              <p className="text-stone-600 text-sm">Verifying reset token...</p>
            </div>
          ) : success ? (
            <div className="space-y-6 text-center font-sans">
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200/50 flex flex-col items-center gap-2">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
                <span className="font-bold">Password Reset Complete!</span>
                <p className="text-stone-600 text-xs">
                  Your password has been successfully updated and hashed.
                </p>
                {resetsRemaining !== null && (
                  <p className="text-stone-500 text-[11px] mt-1">
                    You have <strong className="text-stone-700">{resetsRemaining}</strong> remaining password reset attempts left today.
                  </p>
                )}
              </div>
              <Link
                to="/login"
                className="block w-full py-3.5 bg-amber-900 hover:bg-amber-800 text-white font-bold rounded-xl transition text-center shadow-scrapbook"
              >
                Sign In Now
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

              {resetsRemaining !== null && (
                <div className="mb-6 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center font-sans">
                  <span className="text-xs text-amber-950/80">
                    Daily attempts left: <strong className={`font-extrabold ${resetsRemaining === 0 ? 'text-rose-600' : 'text-amber-900'}`}>{resetsRemaining} / 3</strong>
                  </span>
                  <div className="w-full bg-stone-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${resetsRemaining === 0 ? 'bg-rose-500' : 'bg-amber-800'}`} 
                      style={{ width: `${(resetsRemaining / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-amber-950">New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-amber-950">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || resetsRemaining === 0}
                  className="w-full py-3.5 bg-amber-900 text-white font-bold rounded-xl hover:bg-amber-800 transition duration-150 shadow-scrapbook disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirmPage;
