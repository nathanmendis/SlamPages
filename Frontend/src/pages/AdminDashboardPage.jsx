import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Eye, Trash2, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null); // id of actioned report
  const [activeReportDetails, setActiveReportDetails] = useState(null); // Modal viewing details

  // Add Admin state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminSuccess, setAddAdminSuccess] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');

  useEffect(() => {
    // Redirection if not staff/admin user
    if (!user || !user.is_staff) {
      navigate('/dashboard');
      return;
    }
    fetchReports();
  }, [filter, user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports', {
        params: { status: filter }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Failed to retrieve moderation reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    setActioning(reportId);
    try {
      await api.patch(`/admin/reports/${reportId}`, {
        status: newStatus
      });
      // Refresh current listing
      fetchReports();
      if (activeReportDetails && activeReportDetails.id === reportId) {
        setActiveReportDetails(null);
      }
    } catch (error) {
      alert('Failed to update report status.');
    } finally {
      setActioning(null);
    }
  };

  const handleDeleteEntry = async (entryId, reportId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this flagged entry? This action is permanent and cannot be undone.')) {
      return;
    }
    setActioning(reportId);
    try {
      await api.delete(`/admin/entries/${entryId}`);
      // Refresh list
      fetchReports();
      setActiveReportDetails(null);
    } catch (error) {
      alert('Failed to delete flagged entry.');
    } finally {
      setActioning(null);
    }
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    setAddAdminError('');
    setAddingAdmin(true);

    try {
      await api.post('/admin/create-admin', {
        username: newAdminUsername,
        email: newAdminEmail,
        password: newAdminPassword
      });
      setAddAdminSuccess(true);
      setTimeout(() => {
        setShowAddAdminModal(false);
        setAddAdminSuccess(false);
        setNewAdminUsername('');
        setNewAdminEmail('');
        setNewAdminPassword('');
      }, 2000);
    } catch (error) {
      setAddAdminError(error.response?.data?.error || 'Failed to create new admin user.');
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f0] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8 font-sans">

        {/* Admin Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6 select-none">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm">
              <ArrowLeft className="w-5 h-5 text-stone-700" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-600 animate-pulse" />
                <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight font-diary">Moderation Center</h1>
              </div>
              <p className="text-xs text-stone-500 font-semibold mt-1">Admin Dashboard for Flagged Posts, Logs, and Abuse Prevention</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2.5 bg-red-900 hover:bg-red-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <span>+ Add Admin</span>
            </button>
            <button
              onClick={fetchReports}
              className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </header>

        {/* Filters and Counters */}
        <div className="flex items-center justify-between flex-wrap gap-4 select-none">
          <div className="flex gap-2">
            {['pending', 'resolved', 'dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === status
                    ? 'bg-amber-900 text-white shadow-md'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-stone-500">
            Total Flagged Sheets: {reports.length}
          </span>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="py-24 text-center space-y-4 bg-white border border-stone-200 rounded-3xl shadow-sm">
            <div className="w-8 h-8 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-stone-500 font-semibold">Reading flagged entries ledger...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-24 text-center space-y-4 bg-white border border-stone-200 rounded-3xl shadow-sm select-none">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold text-stone-800">Clear Ledger!</h3>
            <p className="text-xs text-stone-500">No reports found for the status: <strong className="text-stone-700">{filter}</strong>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reports.map((report) => {
              const entry = report.entry_detail || {};
              const author = entry.author_username || entry.anonymous_name || 'Anonymous Submitter';

              return (
                <div
                  key={report.id}
                  className={`bg-white border rounded-3xl p-6 transition-all duration-300 relative shadow-sm hover:shadow-md ${report.status === 'pending' ? 'border-l-4 border-l-red-500' : ''
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${report.status === 'pending'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : report.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}>
                          {report.status}
                        </span>
                        <span className="text-[11px] text-stone-400 font-semibold">
                          Reported: {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-stone-900">
                          SlamBook: <span className="font-semibold text-amber-950 font-diary">{entry.slam_book_title || 'N/A'}</span>
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Written By: <strong className="text-stone-700">{author}</strong>
                        </p>
                      </div>

                      <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                        <span className="text-[10px] font-extrabold text-red-800 uppercase tracking-widest block mb-1">Flag Reason</span>
                        <p className="text-xs text-stone-700 italic">"{report.reason}"</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center md:flex-col gap-2 self-end md:self-start">
                      <button
                        onClick={() => setActiveReportDetails(report)}
                        className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        title="View Full Entry & Network Logs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect</span>
                      </button>

                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            disabled={actioning === report.id}
                            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <span>Dismiss</span>
                          </button>

                          <button
                            onClick={() => handleDeleteEntry(entry.id, report.id)}
                            disabled={actioning === report.id}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Purge Entry</span>
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Detailed Inspection Modal with IP details and Answers */}
      {activeReportDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl font-sans relative border border-stone-200 space-y-6">

            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Abuse Log Details</h3>
                <p className="text-xs text-stone-500">Full audit log including submission contents and metadata</p>
              </div>
              <button
                onClick={() => setActiveReportDetails(null)}
                className="text-stone-400 hover:text-stone-600 font-extrabold text-sm p-1.5 hover:bg-stone-50 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Core Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl space-y-2">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Logged Metadata</span>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-stone-500">Client IP Address:</span> <strong className="text-red-700 font-mono select-all bg-red-50 px-1 rounded">{activeReportDetails.entry_detail?.ip_address || 'No IP Captured'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">Browser User-Agent:</span>
                    <div className="text-[10px] font-mono mt-1 text-stone-600 bg-stone-100 p-2 rounded max-h-[60px] overflow-y-auto break-all select-all">
                      {activeReportDetails.entry_detail?.user_agent || 'Unknown UA'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl space-y-2">
                <span className="text-[10px] font-extrabold text-red-800 uppercase tracking-widest block">Report Reason</span>
                <p className="text-xs text-stone-800 italic">"{activeReportDetails.reason}"</p>
                <div className="text-[10px] text-red-700 mt-2 font-semibold">
                  Status: {activeReportDetails.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Flagged Answers Display */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Flagged Page Answers</span>
              <div className="border border-stone-200/50 rounded-2xl p-4 bg-white space-y-4">
                {Object.entries(activeReportDetails.entry_detail?.answers || {}).map(([q_id, ans]) => (
                  <div key={q_id} className="space-y-1 border-b border-stone-50 pb-3 last:border-0 last:pb-0">
                    <div className="text-[11px] font-bold text-stone-500">Q ID / Text: {q_id}</div>
                    <p className="text-xs text-stone-800 italic bg-amber-50/45 p-2 rounded border border-amber-100/50">"{ans}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Footer inside Inspect modal */}
            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setActiveReportDetails(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
              >
                Close Inspector
              </button>

              {activeReportDetails.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(activeReportDetails.id, 'dismissed')}
                    className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(activeReportDetails.entry_detail?.id, activeReportDetails.id)}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Purge Entry From Scrapbook
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
      {/* Create New Admin Staff Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl font-sans relative border border-stone-200 space-y-4">

            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Add New Admin</h3>
                <p className="text-xs text-stone-500">Register a new colleague with Staff privileges</p>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-stone-400 hover:text-stone-600 font-extrabold text-sm p-1.5 hover:bg-stone-50 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {addAdminSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-900">Admin Registered!</h3>
                <p className="text-sm text-stone-500">
                  New admin user has been successfully added to the staff cabinet.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                {addAdminError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                    {addAdminError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Username</label>
                  <input
                    type="text"
                    required
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    placeholder="e.g. admin_clara"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="e.g. clara@slambook.com"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Password</label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-900 bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(false)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="flex-1 py-2.5 bg-amber-900 hover:bg-amber-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {addingAdmin ? 'Creating account...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
