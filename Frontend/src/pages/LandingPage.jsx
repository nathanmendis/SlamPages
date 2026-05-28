import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Share2, Sparkles, Heart, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LandingPage = () => {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState('loading');

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
      ? 'bg-emerald-500'
      : backendStatus === 'loading'
      ? 'bg-slate-300'
      : 'bg-amber-500';

  const themesShowcase = [
    { name: 'School Notebook', desc: 'Blue ruled lines, margins, handwriting style.', cls: 'theme-notebook-paper font-notebook text-slate-800 p-6', font: 'font-notebook' },
    { name: 'Y2K Cyber', desc: 'Neon pink grid, glowing fonts, retro sci-fi.', cls: 'theme-y2k-grid font-y2k text-pink-500 p-6', font: 'font-y2k' },
    { name: 'Polaroid Memory', desc: 'White snapshot borders, paper tapes, markers.', cls: 'theme-polaroid-frame font-polaroid text-indigo-900 p-6', font: 'font-polaroid' },
    { name: 'Vintage Diary', desc: 'Cream radial dots, elegant double-borders.', cls: 'theme-diary-parchment font-diary text-amber-950 p-6', font: 'font-diary' },
    { name: 'Dark Academia', desc: 'Sepia typewriter sheets, ink stamps, sepia tones.', cls: 'theme-academia-sepia font-academia text-[#3e2723] p-6', font: 'font-academia' }
  ];

  return (
    <div className="relative min-h-screen pb-16">
      {/* Decorative Scrapbook Elements */}
      <div className="absolute top-12 left-4 w-12 h-8 bg-yellow-200/50 -rotate-12 rounded-sm shadow-sm hidden md:block"></div>
      <div className="absolute top-24 right-8 w-16 h-8 bg-indigo-100/50 rotate-45 rounded-sm shadow-sm hidden md:block"></div>
      
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-amber-600" />
          <span className="text-2xl font-bold font-diary tracking-tight text-amber-950">SlamBook</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 border border-slate-200 text-sm text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${backendDotClass}`} />
            <span>{backendLabel}</span>
          </div>

          {user ? (
            <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-amber-900 text-white font-medium hover:bg-amber-800 transition duration-150 shadow-scrapbook">
              My Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-amber-950 hover:underline font-semibold">
                Login
              </Link>
              <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-amber-900 text-white font-medium hover:bg-amber-800 transition duration-150 shadow-scrapbook">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-sm font-semibold border border-amber-200/50">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Nostalgic digital memory books for friends</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-diary leading-tight text-amber-950 max-w-4xl mx-auto">
            Bring Back the Nostalgia of <span className="underline decoration-wavy decoration-amber-500 text-amber-900">Slam Books</span>
          </h1>

          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto font-sans leading-relaxed">
            Create beautifully styled memory books, share public links with friends, collect verified or anonymous answers, and flip through a gorgeous realistic scrapbook.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto px-8 py-4 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition duration-150 text-lg shadow-scrapbook flex items-center justify-center gap-3"
            >
              <span>Create Your Slam Book</span>
              <BookOpen className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-amber-950 font-bold rounded-2xl border-2 border-amber-900/10 hover:bg-amber-50/50 transition duration-150 text-lg flex items-center justify-center"
            >
              Explore Themes
            </a>
          </div>
        </motion.div>
      </section>

      {/* Feature Showcase */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-800">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-diary text-amber-950">Shareable Public URLs</h3>
          <p className="text-stone-600 font-sans">
            Generate your custom memory link (e.g. <code>slam.nathan/{`{username}`}</code>) and text it to school or college friends.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-800">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-diary text-amber-950">Scrapbook page-turner</h3>
          <p className="text-stone-600 font-sans">
            Flip through memory cards inside an animated book with responsive shadows, page curls, and nostalgic hand-drawn elements.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-800">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-diary text-amber-950">Anonymity & Safety</h3>
          <p className="text-stone-600 font-sans">
            Enables guests to write as anonymous users while using profanity checkers, rate limits, and report queues to keep it safe.
          </p>
        </div>
      </section>

      {/* Dynamic Themes Showcase Section */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-5xl font-bold font-diary text-center text-stone-900 mb-16">
          Choose A Nostalgic Theme
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {themesShowcase.map((t, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className={`rounded-3xl cursor-pointer min-h-[220px] flex flex-col justify-between shadow-sm relative overflow-hidden ${t.cls}`}
            >
              {idx === 2 && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 polaroid-tape"></div>
              )}
              
              <div>
                <h4 className="text-2xl font-bold mb-2">{t.name}</h4>
                <p className="text-sm opacity-80">{t.desc}</p>
              </div>

              <div className="pt-6 border-t border-current/10 mt-6 flex justify-between items-center text-sm font-semibold">
                <span>View Sample Draft</span>
                <span className="text-xs px-2 py-0.5 rounded border border-current">Aesthetic</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-stone-400 font-sans text-sm mt-16 max-w-md mx-auto">
        <p>&copy; {new Date().getFullYear()} SlamBook. All rights reserved.</p>
        <p className="mt-2 text-xs">A modern social scrapbooking project built for creators.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
