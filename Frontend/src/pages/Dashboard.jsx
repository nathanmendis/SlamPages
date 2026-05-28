import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, Plus, Clipboard, Trash2, Eye, FileText, 
  LogOut, ShieldAlert, Sparkles, Check, Download, Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [entries, setEntries] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  
  // State for PDF tasks
  const [pdfGenerating, setPdfGenerating] = useState({});
  const [pdfDownloadUrls, setPdfDownloadUrls] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlamBooks();
  }, []);

  const fetchSlamBooks = async () => {
    try {
      const response = await api.get('/slambooks/create');
      const userBooks = response.data.filter(b => b.owner === user.id);
      setBooks(userBooks);
      
      // Pre-populate already generated PDFs
      const urls = {};
      userBooks.forEach(book => {
        if (book.pdf_url) {
          const mediaBase = api.defaults.baseURL.replace('/api', '');
          urls[book.id] = `${mediaBase}${book.pdf_url}?t=${new Date().getTime()}`;
        }
      });
      setPdfDownloadUrls(urls);
    } catch (err) {
      console.error('Failed to fetch books', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = async (book) => {
    setSelectedBook(book);
    setEntries([]);
    try {
      const response = await api.get(`/entries/${book.id}`);
      setEntries(response.data);
    } catch (err) {
      console.error('Failed to fetch entries', err);
    }
  };

  const handleCopyLink = (slug, id) => {
    const publicUrl = `${window.location.origin}/slam/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteBook = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this slambook? This will delete all entries!')) return;
    try {
      await api.delete(`/slambooks/${id}`);
      setBooks(books.filter(b => b.id !== id));
      if (selectedBook?.id === id) {
        setSelectedBook(null);
        setEntries([]);
      }
    } catch (err) {
      console.error('Failed to delete book', err);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this friend\'s submission permanently?')) return;
    try {
      await api.delete(`/entries/delete/${entryId}`);
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  const handleGeneratePDF = async (bookId, e) => {
    e.stopPropagation();
    setPdfGenerating(prev => ({ ...prev, [bookId]: true }));
    try {
      const response = await api.post(`/pdf/generate/${bookId}`);
      const { download_url } = response.data;
      
      // Since it runs in Celery in the background, we poll or simply wait a moment.
      // For this MVP, since pdf compiles in <2 seconds, we wait 2 seconds, and then enable download!
      setTimeout(() => {
        setPdfGenerating(prev => ({ ...prev, [bookId]: false }));
        // Format link properly to hit local media static folder with cache-busting timestamp
        const mediaBase = api.defaults.baseURL.replace('/api', '');
        setPdfDownloadUrls(prev => ({ ...prev, [bookId]: `${mediaBase}${download_url}?t=${new Date().getTime()}` }));
      }, 2500);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setPdfGenerating(prev => ({ ...prev, [bookId]: false }));
    }
  };

  const getThemeClass = (theme) => {
    switch (theme) {
      case 'Y2K Cyber':
        return 'theme-y2k-grid font-y2k text-pink-500 hover:scale-[1.01] transition-transform duration-200';
      case 'Polaroid Memory':
        return 'theme-polaroid-frame font-polaroid text-indigo-950 hover:scale-[1.01] transition-transform duration-200';
      case 'Vintage Diary':
        return 'theme-diary-parchment font-diary text-amber-950 hover:scale-[1.01] transition-transform duration-200';
      case 'Dark Academia':
        return 'theme-academia-sepia font-academia text-[#3e2723] hover:scale-[1.01] transition-transform duration-200';
      default:
        return 'theme-notebook-paper font-notebook text-slate-800 hover:scale-[1.01] transition-transform duration-200 pl-6';
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Upper Navigation bar */}
      <nav className="bg-white border-b border-stone-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <BookOpen className="w-8 h-8 text-amber-900" />
            <span className="text-xl font-bold font-diary text-amber-950">SlamBook Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-900 text-sm">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-semibold text-stone-700 font-sans hidden sm:inline">
                {user?.username} {user?.verified && '🌟'}
              </span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2.5 rounded-xl hover:bg-stone-50 border border-stone-200 text-stone-600 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Panel */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: Slam Books List */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold font-diary text-stone-900">My Memory Books</h2>
              <p className="text-sm text-stone-500 font-sans">Click a card to inspect entries</p>
            </div>
            <div className="flex items-center gap-2">
              {user?.is_staff && (
                <Link
                  to="/admin/dashboard"
                  className="px-4 py-2.5 bg-red-950 hover:bg-red-900 border border-red-900/30 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-scrapbook transition"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Mod Panel</span>
                </Link>
              )}
              <Link
                to="/create-slambook"
                className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-scrapbook transition"
              >
                <Plus className="w-4 h-4" />
                <span>New SlamBook</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-900 mx-auto" />
              <p className="mt-4 text-stone-500 text-sm">Flipping through your memory cabinet...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-xl font-bold font-diary text-stone-800">Your Scrapbook cabinet is empty!</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto font-sans">
                Create a customized cover page, outline questions for school/college friends, and start collecting fun entries!
              </p>
              <Link
                to="/create-slambook"
                className="inline-flex px-6 py-3 bg-amber-900 text-white font-bold rounded-xl shadow-scrapbook hover:bg-amber-800 transition"
              >
                Assemble Cover Page
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className={`p-6 rounded-3xl shadow-sm cursor-pointer relative flex flex-col justify-between h-[260px] overflow-hidden group select-none border border-stone-200/50 ${getThemeClass(book.theme)} ${
                    selectedBook?.id === book.id ? 'ring-4 ring-amber-950/20' : ''
                  }`}
                >
                  {/* Binder holes visual overlay for notebook */}
                  {book.theme === 'School Notebook' && (
                    <div className="absolute top-0 bottom-0 left-2 flex flex-col justify-around py-4 pointer-events-none">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shadow-inner"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shadow-inner"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shadow-inner"></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold line-clamp-1">{book.title}</h3>
                    <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">{book.description || 'No description'}</p>
                    <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-current/10 border border-current font-bold font-sans mt-2">
                      Theme: {book.theme}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-current/10 space-y-4 font-sans text-xs">
                    <div className="flex justify-between font-semibold">
                      <span>Questions: {book.questions?.length || 0}</span>
                      <span>Created: {new Date(book.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(book.slug, book.id); }}
                        className="flex-1 py-2 bg-white/70 backdrop-blur border border-stone-300 hover:bg-white text-stone-700 font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedId === book.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                        <span>{copiedId === book.id ? 'Copied' : 'Share'}</span>
                      </button>

                      {pdfDownloadUrls[book.id] && (
                        <a
                          href={pdfDownloadUrls[book.id]}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition"
                          title="PDF Already Generated! Click to Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={(e) => handleGeneratePDF(book.id, e)}
                        disabled={pdfGenerating[book.id]}
                        className={`px-3 py-2 rounded-lg flex items-center justify-center transition border ${
                          pdfDownloadUrls[book.id]
                            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                            : 'bg-white/70 backdrop-blur border-stone-300 hover:bg-white text-stone-700'
                        }`}
                        title={pdfDownloadUrls[book.id] ? "Regenerate New PDF (Deletes and replaces old one)" : "Generate PDF"}
                      >
                        {pdfGenerating[book.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-900" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDeleteBook(book.id, e)}
                        className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Responses Viewer Panel */}
        <section className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm min-h-[500px]">
          {selectedBook ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold font-diary text-stone-900">{selectedBook.title}</h3>
                  <p className="text-xs text-stone-500 font-sans">{entries.length} friend entries collected</p>
                </div>
                <Link
                  to={`/flipbook/${selectedBook.slug}`}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>Open Flipbook</span>
                </Link>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-20 text-stone-400 font-sans space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto opacity-40 text-stone-500" />
                  <p className="text-sm font-semibold">No entries yet</p>
                  <p className="text-xs max-w-xs mx-auto">
                    Share this book's public URL with friends to collect their memories.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
                  {entries.map((entry) => {
                    const writer = entry.author_username || (entry.anonymous_name || 'Anonymous Guest');
                    return (
                      <div key={entry.id} className="border border-stone-200/80 rounded-2xl p-5 space-y-3 font-sans relative group">
                        
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs uppercase">
                            {writer[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-stone-800 flex items-center gap-1">
                              {writer}
                              {(entry.author_verified || entry.author) && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white font-extrabold text-[8px] shadow-sm select-none" title="Verified Member">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {new Date(entry.created_at).toLocaleDateString()} | Theme: {entry.theme}
                            </div>
                          </div>
                        </div>

                        {/* List Answers */}
                        <div className="space-y-2 pt-2 text-sm border-t border-stone-50">
                          {Object.entries(entry.answers || {}).map(([q_id, ans]) => {
                            // Find corresponding question text
                            const matchQ = selectedBook.questions?.find(q => q.id === q_id);
                            const qText = matchQ ? matchQ.question : q_id;
                            return (
                              <div key={q_id} className="space-y-0.5">
                                <div className="text-xs font-semibold text-stone-500">Q: {qText}</div>
                                <div className="text-stone-800 italic bg-stone-50/50 p-2 rounded-lg border border-stone-100/50">
                                  "{ans}"
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-stone-400 font-sans space-y-4">
              <ShieldAlert className="w-12 h-12 opacity-30 text-stone-500" />
              <div>
                <h4 className="font-bold text-stone-700">No Book Selected</h4>
                <p className="text-xs max-w-[240px] mx-auto mt-1">
                  Select one of your Slam Books from the list on the left to inspect responses and manage entries.
                </p>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
