import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowLeft, ArrowRight, Maximize2, Minimize2, Users, FileText } from 'lucide-react';
import api from '../services/api';

const FlipbookViewer = () => {
  const { slug } = useParams();
  
  const [book, setBook] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1 = Entry 1, etc.
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  
  // Sidebar state for jumping index
  const [showIndex, setShowIndex] = useState(false);

  useEffect(() => {
    fetchBookAndEntries();
  }, [slug]);

  const fetchBookAndEntries = async () => {
    try {
      // Fetch slambook
      const bookResponse = await api.get(`/slambooks/slug/${slug}`);
      const bookData = bookResponse.data;
      setBook(bookData);
      
      // Fetch submissions
      const entriesResponse = await api.get(`/entries/${bookData.id}`);
      setEntries(entriesResponse.data);
    } catch (error) {
      setErr('Memory Book not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentPage < entries.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Helper styles based on theme
  const getThemeClass = (theme) => {
    switch (theme) {
      case 'Y2K Cyber':
        return 'theme-y2k-grid font-y2k text-pink-500 min-h-[500px] flex flex-col justify-between p-8 rounded-3xl select-none';
      case 'Polaroid Memory':
        return 'theme-polaroid-frame font-polaroid text-indigo-950 min-h-[500px] flex flex-col justify-between p-8 rounded-3xl shadow-lg border border-stone-200 select-none';
      case 'Vintage Diary':
        return 'theme-diary-parchment font-diary text-amber-950 min-h-[500px] flex flex-col justify-between p-8 rounded-3xl border-4 double select-none';
      case 'Dark Academia':
        return 'theme-academia-sepia font-academia text-[#3e2723] min-h-[500px] flex flex-col justify-between p-8 rounded-3xl select-none';
      default:
        return 'theme-notebook-paper font-notebook text-slate-800 min-h-[500px] flex flex-col justify-between p-8 pl-12 rounded-3xl shadow-sm border border-stone-200 select-none';
    }
  };

  const getAnswersContainerClass = (theme) => {
    switch (theme) {
      case 'Y2K Cyber':
        return 'bg-black/30 border border-pink-500/30 p-4 rounded-xl space-y-3';
      case 'Polaroid Memory':
        return 'bg-stone-50 border border-stone-100 p-4 rounded-xl space-y-3';
      case 'Vintage Diary':
        return 'bg-amber-50/30 border border-amber-900/10 p-4 rounded-xl space-y-3';
      case 'Dark Academia':
        return 'bg-stone-100/50 border border-[#3e2723]/10 p-4 rounded-xl space-y-3';
      default:
        return 'bg-white border border-stone-100 p-4 rounded-xl space-y-3';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center font-sans space-y-4">
          <BookOpen className="w-8 h-8 animate-pulse text-amber-900 mx-auto" />
          <p className="text-stone-500 text-sm font-semibold">Binding album sheets...</p>
        </div>
      </div>
    );
  }

  if (err || !book) {
    return (
      <div className="min-h-screen py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-2xl font-bold font-diary text-stone-800">Scrapbook Not Found</h3>
          <p className="text-sm font-sans text-stone-500">{err || 'Memory book could not be loaded.'}</p>
          <Link to="/" className="inline-block px-5 py-2.5 bg-stone-100 hover:bg-stone-200 font-bold rounded-xl text-sm transition font-sans text-stone-800">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Cover Page Render
  const renderCover = () => {
    // Resolve dynamic media URL if covers exist
    const mediaBase = api.defaults.baseURL.replace('/api', '');
    const coverPath = book.cover_image ? `${mediaBase}${book.cover_image}` : null;
    
    return (
      <div className={`${getThemeClass(book.theme)} text-center relative`}>
        
        {/* Binder details mockup */}
        {book.theme === 'School Notebook' && (
          <div className="absolute top-0 bottom-0 left-3 flex flex-col justify-around py-8 pointer-events-none">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shadow-inner"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shadow-inner"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shadow-inner"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shadow-inner"></div>
          </div>
        )}

        <div className="pt-16 space-y-4">
          <span className="text-xs uppercase tracking-widest bg-current/10 border border-current px-3 py-1 rounded-full font-sans font-bold">
            Scrapbook Album
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-diary leading-snug break-words">
            {book.title}
          </h1>
          <p className="text-xs opacity-75 max-w-sm mx-auto font-sans leading-relaxed">
            Curated with love by <strong className="text-amber-900">{book.owner_username}</strong>
          </p>
        </div>

        {coverPath && (
          <div className="my-6 max-w-xs mx-auto flex items-center justify-center p-2 bg-white shadow border border-stone-200 rotate-1 rounded">
            <img
              src={coverPath}
              alt="Scrapbook Cover"
              className="max-h-[220px] rounded object-cover w-full"
            />
          </div>
        )}

        <div className="pb-12 space-y-2">
          {book.description && (
            <p className="text-sm italic font-sans max-w-md mx-auto line-clamp-3 px-4">
              "{book.description}"
            </p>
          )}
          <span className="text-xs font-semibold font-sans block opacity-60">
            Total pages inside: {entries.length + 1} sheets
          </span>
        </div>
      </div>
    );
  };

  // Entry Page Render
  const renderEntryPage = (entry, index) => {
    const writer = entry.author_username || (entry.anonymous_name || 'Anonymous Guest');
    const verified_tag = entry.author_verified ? ' 🌟' : '';
    
    // Resolve guest photo uploads
    const mediaBase = api.defaults.baseURL.replace('/api', '');
    const entryImagePath = entry.image_url ? `${mediaBase}${entry.image_url}` : null;

    return (
      <div className={getThemeClass(entry.theme)}>
        
        {/* Entry Sheet Header */}
        <div className="flex justify-between items-center border-b border-current/10 pb-4 mb-4 select-none">
          <div>
            <h3 className="text-2xl font-bold tracking-wide">
              {index + 1}. Page by {writer}{verified_tag}
            </h3>
            <span className="text-[10px] font-sans opacity-70 font-semibold block">
              Logged: {new Date(entry.created_at).toLocaleDateString()}
            </span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-current font-bold font-sans opacity-75">
            Page {index + 2}
          </span>
        </div>

        {/* Answers and layouts grid */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          
          <div className={getAnswersContainerClass(entry.theme)}>
            {Object.entries(entry.answers || {}).map(([q_id, ans]) => {
              // Find matching question text
              const matchQ = book.questions?.find(q => q.id === q_id);
              const qText = matchQ ? matchQ.question : q_id;
              
              if (!ans.trim()) return null;

              return (
                <div key={q_id} className="space-y-1">
                  <div className="text-xs font-bold opacity-75 select-none">Q: {qText}</div>
                  <div className="italic leading-relaxed">
                    "{ans}"
                  </div>
                </div>
              );
            })}
          </div>

          {/* Polaroid image embedded physically */}
          {entryImagePath && (
            <div className="max-w-[240px] mx-auto border-8 border-white shadow-polaroid rotate-2 rounded bg-white p-2 text-center text-xs text-indigo-900 font-polaroid mt-4">
              <img
                src={entryImagePath}
                alt="Memory snapshot"
                className="max-h-[160px] w-full object-cover rounded mb-2"
              />
              <span className="opacity-80 block select-none">Captured Moment</span>
            </div>
          )}
        </div>

        {/* Entry Sheet Footer */}
        <div className="pt-4 border-t border-current/10 mt-4 flex justify-between text-xs font-semibold select-none">
          <span>Theme Style: {entry.theme}</span>
          <span className="italic font-normal">SlamBook Keepsake</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f2ee] flex flex-col justify-between overflow-x-hidden">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm z-30 select-none">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 transition" title="Go Home">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h2 className="text-lg font-bold font-diary text-stone-900">{book.title}</h2>
            <p className="text-[10px] text-stone-500 font-sans hidden sm:block">Digital Album Flipbook View</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIndex(!showIndex)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700 flex items-center gap-1.5 transition"
          >
            <Users className="w-4 h-4" />
            <span>Index ({entries.length + 1})</span>
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition"
            title="Toggle Fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-5 h-5 text-stone-600" /> : <Maximize2 className="w-5 h-5 text-stone-600" />}
          </button>
        </div>
      </header>

      {/* Main Flipbook Box */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        
        {/* Index Sidebar Drawer */}
        <AnimatePresence>
          {showIndex && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 bottom-0 left-0 w-[280px] bg-white border-r border-stone-200 shadow-2xl z-40 p-6 flex flex-col justify-between font-sans"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Album Index</h3>
                  <p className="text-xs text-stone-500">Jump directly to any friend sheet</p>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[450px] pr-1">
                  <button
                    onClick={() => { setCurrentPage(0); setShowIndex(false); }}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-semibold transition ${
                      currentPage === 0 ? 'bg-amber-900 border-amber-950 text-white' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    Cover Page
                  </button>

                  {entries.map((entry, idx) => {
                    const writer = entry.author_username || (entry.anonymous_name || 'Anonymous Guest');
                    return (
                      <button
                        key={entry.id}
                        onClick={() => { setCurrentPage(idx + 1); setShowIndex(false); }}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition ${
                          currentPage === idx + 1 ? 'bg-amber-900 border-amber-950 text-white' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-800'
                        }`}
                      >
                        {idx + 1}. {writer}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button
                onClick={() => setShowIndex(false)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 rounded-xl text-xs transition"
              >
                Close Drawer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Realistic paper flipper container */}
        <div className="w-full max-w-xl relative">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ rotateY: -90, opacity: 0, transformOrigin: 'left' }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0, transformOrigin: 'right' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="w-full"
            >
              {currentPage === 0 
                ? renderCover() 
                : renderEntryPage(entries[currentPage - 1], currentPage - 1)
              }
            </motion.div>
          </AnimatePresence>
          
        </div>

      </main>

      {/* Footer Navigation Overlay */}
      <footer className="bg-white border-t border-stone-200 py-5 px-6 flex items-center justify-between select-none z-10">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold font-sans text-xs text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Sheet</span>
        </button>

        <span className="text-xs font-bold text-stone-500 font-sans">
          Sheet {currentPage + 1} of {entries.length + 1}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === entries.length}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-white font-bold font-sans text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
        >
          <span>Next Sheet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};

export default FlipbookViewer;
