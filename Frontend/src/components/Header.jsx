import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Header = () => {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState('loading');
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    api.get('/health')
      .then((response) => {
        if (!mounted) return;
        if (response.data?.status === 'ok') {
          setBackendStatus('ok');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(() => {
        if (mounted) {
          setBackendStatus('error');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const backendLabel =
    backendStatus === 'ok'
      ? 'Backend active'
      : backendStatus === 'loading'
      ? 'Checking backend...'
      : 'Backend unavailable';

  const backendDotClass =
    backendStatus === 'ok'
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
      : backendStatus === 'loading'
      ? 'bg-slate-300 animate-pulse'
      : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';

  const handleBadgeClick = () => {
    if (backendStatus === 'error') {
      setShowOfflineModal(true);
    }
  };

  return (
    <>
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-row items-center justify-between select-none">
        {/* Brand logo and backend status dot */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <BookOpen className="w-8 h-8 text-amber-600" />
            <span className="text-2xl font-bold font-diary tracking-tight text-amber-950">SlamBook</span>
          </Link>
          
          {/* Responsive Health Status Check Badge */}
          <div 
            onClick={handleBadgeClick}
            className={`hidden sm:inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 border border-slate-200/60 text-xs text-slate-700 font-sans font-medium select-none ${
              backendStatus === 'error' ? 'cursor-pointer hover:bg-amber-50 hover:border-amber-200/60 transition-all duration-200' : ''
            }`}
            title={backendStatus === 'error' ? 'Click to see details' : undefined}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${backendDotClass}`} />
            <span>{backendLabel}</span>
            {backendStatus === 'error' && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold ml-1 animate-pulse">Info</span>
            )}
          </div>
        </div>
        
        {/* Navigation and authentication controls */}
        <div className="flex items-center gap-6 font-sans">
          {user ? (
            <Link 
              to="/dashboard" 
              className="px-5 py-2.5 rounded-xl bg-amber-900 text-white font-medium hover:bg-amber-800 transition duration-150 shadow-scrapbook text-sm"
            >
              My Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-amber-950 hover:text-amber-800 hover:underline font-semibold text-sm transition-colors">
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-5 py-2.5 rounded-xl bg-amber-900 text-white font-medium hover:bg-amber-800 transition duration-150 shadow-scrapbook text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Beautiful Offline Information Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full theme-diary-parchment font-diary p-8 rounded-3xl shadow-2xl relative border border-[#d1ccc0] space-y-6">
            
            {/* Polaroid aesthetic tape decoration */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 polaroid-tape"></div>

            {/* Header info */}
            <div className="text-center space-y-3 pt-4 font-sans select-none">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800">
                <AlertTriangle className="w-6 h-6 animate-bounce text-amber-900" />
              </div>
              <h3 className="text-xl font-extrabold text-amber-950 tracking-tight">Backend is Locally Hosted</h3>
              <p className="text-xs text-stone-500 font-medium">Why are backend checks offline?</p>
            </div>

            {/* Explanatory Details */}
            <div className="font-sans text-xs text-stone-600 space-y-4 leading-relaxed bg-white/60 p-5 rounded-2xl border border-stone-200/40 shadow-inner">
              <p>
                This project features a fully engineered Django REST Framework backend API equipped with an <strong>asynchronous Celery worker system</strong>, <strong>Redis caches</strong>, and a <strong>PostgreSQL database</strong>.
              </p>
              <p>
                To keep this architecture secure, performant, and simple to run, <strong>it is hosted in a local environment</strong> (or a private developer cloud tunnel). 
              </p>
              <p className="font-semibold text-amber-900">
                🚀 If you are inspecting this demo, you can activate the API locally to unlock full account registrations, interactive scrapbook creation, and live submissions!
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowOfflineModal(false)}
              className="w-full py-3.5 bg-amber-900 text-white font-bold rounded-xl hover:bg-amber-800 transition duration-150 shadow-scrapbook font-sans text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Close Journal Info</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

