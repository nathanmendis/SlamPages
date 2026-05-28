import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle, Heart, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SlamSubmissionPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  
  const [book, setBook] = useState(null);
  const [anonymous, setAnonymous] = useState(true);
  const [anonymousName, setAnonymousName] = useState('');
  const [answers, setAnswers] = useState({});
  const [imageFile, setImageFile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  // Theme is always the book owner's choice — no per-entry override
  const theme = book?.theme || 'School Notebook';

  useEffect(() => {
    fetchBookDetails();
  }, [slug]);

  const fetchBookDetails = async () => {
    try {
      const response = await api.get(`/slambooks/slug/${slug}`);
      setBook(response.data);
      // theme is always the book owner's theme — no per-entry override
      
      // Initialize answers object
      const initialAnswers = {};
      response.data.questions?.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      setErr('Memory Book not found. Make sure the link is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    // Check if at least one question is answered
    const hasAnswers = Object.values(answers).some(a => a.trim() !== '');
    if (!hasAnswers) {
      setErr('Please answer at least one question card before publishing.');
      return;
    }

    if (anonymous && !anonymousName.trim()) {
      setErr('Please enter a guest name or write "Anonymous".');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('slam_book', book.id);
      formData.append('theme', book.theme);
      
      if (anonymous) {
        formData.append('anonymous_name', anonymousName.trim());
      } else {
        // Authenticated user session handles owner mapping on backend automatically
        formData.append('anonymous_name', user.username);
      }

      // Stringify answers map
      formData.append('answers', JSON.stringify(answers));

      if (imageFile) {
        formData.append('image_url', imageFile);
      }

      await api.post('/entries/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
    } catch (error) {
      if (error.response?.status === 429) {
        setErr('Slow down! You have hit the submission limit. Please wait 10 minutes.');
      } else {
        setErr(error.response?.data?.detail || 'Failed to submit entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getContainerClass = (th) => {
    switch (th) {
      case 'Y2K Cyber':
        return 'theme-y2k-grid font-y2k text-pink-500 p-8 rounded-3xl';
      case 'Polaroid Memory':
        return 'theme-polaroid-frame font-polaroid text-indigo-950 p-8 rounded-3xl shadow-lg';
      case 'Vintage Diary':
        return 'theme-diary-parchment font-diary text-amber-950 p-8 rounded-3xl';
      case 'Dark Academia':
        return 'theme-academia-sepia font-academia text-[#3e2723] p-8 rounded-3xl';
      default:
        return 'theme-notebook-paper font-notebook text-slate-800 p-8 pl-12 rounded-3xl shadow-sm';
    }
  };

  const getCardClass = (th) => {
    switch (th) {
      case 'Y2K Cyber':
        return 'bg-black/40 border border-pink-500/50 p-6 rounded-2xl y2k-neon-border';
      case 'Polaroid Memory':
        return 'bg-white border border-stone-200 p-6 rounded-xl shadow-sm relative';
      case 'Vintage Diary':
        return 'bg-amber-50/50 border border-amber-900/10 p-6 rounded-2xl';
      case 'Dark Academia':
        return 'bg-stone-50/50 border border-[#3e2723]/20 p-6 rounded-xl';
      default:
        return 'bg-white border border-stone-200/80 p-6 rounded-2xl shadow-sm';
    }
  };

  const getButtonClass = (th) => {
    switch (th) {
      case 'Y2K Cyber':
        return 'w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl border border-pink-400 y2k-neon-border font-y2k';
      case 'Polaroid Memory':
        return 'w-full py-4 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-xl shadow-md font-polaroid';
      case 'Vintage Diary':
        return 'w-full py-4 bg-amber-950 hover:bg-amber-900 text-white font-bold rounded-xl shadow-md border border-amber-900/25 font-diary';
      case 'Dark Academia':
        return 'w-full py-4 bg-[#4e342e] hover:bg-[#3e2723] text-white font-bold rounded-xl shadow-md font-academia border border-[#3e2723]';
      default:
        return 'w-full py-4 bg-amber-900 hover:bg-amber-800 text-white font-bold rounded-xl shadow-scrapbook font-notebook';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center font-sans space-y-4">
          <BookOpen className="w-8 h-8 animate-pulse text-amber-900 mx-auto" />
          <p className="text-stone-500 text-sm">Opening the friend registry...</p>
        </div>
      </div>
    );
  }

  if (err && !book) {
    return (
      <div className="min-h-screen py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h3 className="text-2xl font-bold font-diary text-stone-800">SlamBook Not Found</h3>
          <p className="text-sm font-sans text-stone-500">{err}</p>
          <Link to="/" className="inline-block px-5 py-2.5 bg-stone-100 hover:bg-stone-200 font-bold rounded-xl text-sm transition font-sans text-stone-800">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen py-24 px-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-6 shadow-sm font-sans relative overflow-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 polaroid-tape"></div>
          
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mt-4" />
          
          <div className="space-y-2">
            <h3 className="text-3xl font-bold font-diary text-stone-800">Published Successfully!</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto">
              Your memory page has been bounded inside <strong className="text-stone-800">{book.title}</strong>!
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-stone-600 text-sm max-w-xs mx-auto">
            Thank you for creating lifelong memories. 💖
          </div>

          <div className="pt-4">
            <Link
              to={`/flipbook/${book.slug}`}
              className="px-6 py-3 bg-amber-900 text-white font-bold rounded-xl shadow-scrapbook hover:bg-amber-800 transition"
            >
              Open Flipbook
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6 max-w-3xl mx-auto">
      
      {/* Back button if logged in */}
      {user && (
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-6 font-semibold font-sans">
          <span>&larr; Back to Dashboard</span>
        </Link>
      )}

      {/* Book Cover Header */}
      <div className="bg-white border border-stone-200 rounded-t-3xl p-6 md:p-8 shadow-sm space-y-4 text-center relative overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 polaroid-tape"></div>
        <div className="space-y-2 mt-4">
          <h2 className="text-4xl font-bold font-diary text-stone-900">{book.title}</h2>
          <p className="text-sm text-stone-500 font-sans max-w-md mx-auto">
            Memory book created by <strong className="text-amber-900">{book.owner_username}</strong> {book.owner_verified && '🌟'}
          </p>
        </div>
        {book.description && (
          <p className="text-sm italic font-sans text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-100 max-w-xl mx-auto leading-relaxed">
            "{book.description}"
          </p>
        )}
      </div>


      <div className={`rounded-b-3xl border-x border-b border-stone-200 shadow-lg ${getContainerClass(theme)}`}>
        
        {theme === 'School Notebook' && (
          <div className="absolute top-0 bottom-0 left-3 flex flex-col justify-around py-12 pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-slate-300/80 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-slate-300/80 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-slate-300/80 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-slate-300/80 shadow-inner"></div>
          </div>
        )}

        {err && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-sm font-sans flex items-center gap-2 border border-red-200/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Identity Picker */}
          <div className={`${getCardClass(theme)} space-y-4`}>
            <h4 className="text-lg font-bold mb-2">1. Your Scrapbook Identity</h4>
            
            <div className="flex gap-4 items-center flex-wrap font-sans text-xs">
              {user ? (
                <button
                  type="button"
                  onClick={() => setAnonymous(false)}
                  className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-semibold ${
                    !anonymous ? 'bg-amber-900 text-white border-amber-950' : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Verified User ({user.username})</span>
                </button>
              ) : (
                <span className="text-stone-500 italic">
                  <Link to="/login" className="underline hover:text-amber-900 font-bold transition">Sign in</Link> to publish as a verified creator.
                </span>
              )}
              
              <button
                type="button"
                onClick={() => setAnonymous(true)}
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-semibold ${
                  anonymous ? 'bg-amber-900 text-white border-amber-950' : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                <span>Write as Guest Friend</span>
              </button>
            </div>

            {anonymous && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold font-sans opacity-85">What is your nickname?</label>
                <input
                  type="text"
                  required
                  value={anonymousName}
                  onChange={(e) => setAnonymousName(e.target.value)}
                  placeholder="e.g. Nathan Mendis"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900 bg-white text-sm text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Cards questions mapper */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold">2. Fill Out the Slam Cards</h4>
            
            {book.questions?.map((q, idx) => (
              <div key={q.id} className={`${getCardClass(theme)} space-y-2`}>
                
                {theme === 'Polaroid Memory' && (
                  <div className="absolute top-2 right-2 w-10 h-4 polaroid-tape"></div>
                )}
                
                <label className="block text-md font-bold">
                  {idx + 1}. {q.question}
                </label>
                
                <textarea
                  required
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Write your response here..."
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900 bg-white text-sm text-slate-800 font-sans leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* Picture Sticker upload */}
          <div className={`${getCardClass(theme)} space-y-3`}>
            <h4 className="text-lg font-bold">3. Add a Polaroid Photo Upload (Optional)</h4>
            <p className="text-xs opacity-75 font-sans leading-relaxed">
              Upload a sticker graphic or photo. It will scale beautifully and be taped into the scrapbook page.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-950 hover:file:bg-amber-200 cursor-pointer text-xs text-stone-500 font-sans"
            />
          </div>

          {/* Submitting button */}
          <button
            type="submit"
            disabled={submitting}
            className={getButtonClass(theme)}
          >
            {submitting ? 'Binding Page...' : 'Publish Memory Page 💖'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SlamSubmissionPage;
