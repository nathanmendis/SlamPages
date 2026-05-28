import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Share2, Sparkles, Heart, Users, FileDown, ShieldAlert, Activity, Link2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

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


  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Decorative Scrapbook Elements */}
      <div className="absolute top-12 left-4 w-12 h-8 bg-yellow-200/50 -rotate-12 rounded-sm shadow-sm hidden md:block"></div>
      <div className="absolute top-24 right-8 w-16 h-8 bg-indigo-100/50 rotate-45 rounded-sm shadow-sm hidden md:block"></div>
      
      {/* Reusable Header */}
      <Header />

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center flex-1">
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
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white text-amber-950 font-bold rounded-2xl border-2 border-amber-900/10 hover:bg-amber-50/50 transition duration-150 text-lg flex items-center justify-center"
            >
              See Features
            </a>
          </div>
        </motion.div>
      </section>

      {/* Feature Showcase */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold font-diary text-stone-900">
            Engineered with Rich Features
          </h2>
          <p className="text-sm font-sans text-stone-500">
            A perfect balance of nostalgic design and modern, robust backend technologies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 - School Notebook theme (Share Anywhere) */}
          <div className="theme-notebook-paper font-notebook text-slate-800 p-8 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-between pl-16">
            <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-red-400/40" />
            <div className="space-y-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 border border-slate-200">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Share Your Link</h3>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Get a custom memory link (like a digital journal) to text your classmates, email school friends, or put in your social bio.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-4 select-none">Notebook Skin</span>
          </div>

          {/* Feature 2 - Y2K Cyber theme (Realistic Flipbook) */}
          <div className="theme-y2k-grid font-y2k text-pink-500 p-8 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-pink-950/30 rounded-xl flex items-center justify-center text-pink-500 border border-pink-500/30 y2k-neon-border">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold y2k-neon-glow">Interactive Flipbook</h3>
              <p className="text-xs text-pink-400/80 font-sans leading-relaxed">
                Flip through friends' entries inside a gorgeous, realistic animated book with page-curls, sound visuals, and nostalgic designs.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-pink-500/50 mt-4 select-none">Y2K Cyber Skin</span>
          </div>

          {/* Feature 3 - Polaroid Memory theme (Download/Print PDF) */}
          <div className="theme-polaroid-frame font-polaroid text-indigo-950 p-8 rounded-3xl relative overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-between pb-10">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-5 polaroid-tape"></div>
            <div className="space-y-3 mt-2">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-900 border border-indigo-100">
                <FileDown className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Print Your Book</h3>
              <p className="text-xs text-indigo-900/80 font-sans leading-relaxed">
                Keep your memories offline. Export your complete scrapbook into a high-quality PDF ready to print as a physical book.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-900/40 mt-4 select-none">Polaroid Skin</span>
          </div>

          {/* Feature 4 - Vintage Diary theme (Spam Protection / Safety) */}
          <div className="theme-diary-parchment font-diary text-amber-950 p-8 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-amber-100/50 rounded-xl flex items-center justify-center text-amber-900 border border-amber-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Safe & Spam-Free</h3>
              <p className="text-xs text-amber-950/80 font-sans leading-relaxed">
                Enjoy your scrapbook safely. Smart filters automatically block bad language, spam bots, and let you moderate offensive entries.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-900/50 mt-4 select-none">Vintage Diary Skin</span>
          </div>

          {/* Feature 5 - Dark Academia theme (Anonymous Scribbles) */}
          <div className="theme-academia-sepia font-academia text-[#3e2723] p-8 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-[#dfd6c0] rounded-xl flex items-center justify-center text-[#5d4037] border border-[#d4c5a9]">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Anonymous Scribbles</h3>
              <p className="text-xs text-[#5d4037]/80 font-sans leading-relaxed">
                Let your friends write under creative pen names, leave secret notes, or upload their favorite snapshot pictures.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037]/45 mt-4 select-none">Dark Academia Skin</span>
          </div>

          {/* Feature 6 - Doodle Sketchbook theme (Custom Scrapbook Themes) */}
          <div className="theme-doodle-sketch font-notebook text-stone-700 p-8 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 border border-stone-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Pick Nostalgic Skins</h3>
              <p className="text-xs text-stone-600/90 font-sans leading-relaxed">
                Express yourself by selecting from 6 childhood visual themes including notebook paper, Y2K neon, and hand-drawn doodles.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mt-4 select-none">Doodle Sketch Skin</span>
          </div>
        </div>


      </section>




      {/* Reusable Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;

