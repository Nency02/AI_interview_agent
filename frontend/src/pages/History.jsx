import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  History, Calendar, ClipboardList, Award,
  ChevronRight, Loader2, ArrowLeft,
  Download, Mail, X, CheckCircle2
} from 'lucide-react';

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  const bg   = type === 'success' ? 'bg-green-950/80 border-green-500/40 text-green-300'
             : type === 'error'   ? 'bg-red-950/80 border-red-500/40 text-red-300'
             :                      'bg-dark-900/80 border-dark-700 text-dark-200';
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? X : Loader2;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-up ${bg}`}>
      <Icon className={`w-5 h-5 shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">{message}</span>
      {type !== 'loading' && (
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
      )}
    </div>
  );
};

// ─── Email modal ──────────────────────────────────────────────────────────────
const EmailModal = ({ sessionId, onClose }) => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const handleSend = async () => {
    if (!email) return;
    setLoading(true);
    setToast({ type: 'loading', message: 'Generating PDF and sending email…' });
    try {
      await api.post('/api/report/send-email', { interview_id: sessionId, email });
      setToast({ type: 'success', message: 'Report emailed successfully!' });
      setTimeout(onClose, 2000);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Email failed. Check SMTP config.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm animate-fade-in px-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent rounded-t-2xl" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-400" /> Email Report
          </h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-dark-400 mb-4 leading-relaxed">
          A professional PDF will be generated and sent to the address below.
        </p>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="candidate@example.com"
          className="w-full bg-dark-900/60 border border-dark-800 rounded-xl py-3 px-4 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors mb-5"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:text-white text-sm font-semibold transition-all">Cancel</button>
          <button onClick={handleSend} disabled={loading || !email}
            className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 glow-shadow-brand-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── History Page ─────────────────────────────────────────────────────────────
const HistoryPage = () => {
  const navigate = useNavigate();
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);
  const [emailSession,  setEmailSession]  = useState(null);
  const [dlLoadingId,   setDlLoadingId]   = useState(null);

  useEffect(() => {
    api.get('/api/interview/history')
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (sessionId) => {
    setDlLoadingId(sessionId);
    setToast({ type: 'loading', message: 'Generating PDF…' });
    try {
      const res = await api.get(`/api/report/download/${sessionId}`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `interview_report_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToast({ type: 'success', message: 'PDF downloaded!' });
    } catch {
      setToast({ type: 'error', message: 'PDF download failed.' });
    } finally {
      setDlLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in space-y-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {emailSession && <EmailModal sessionId={emailSession} onClose={() => setEmailSession(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-850 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-dark-300 hover:text-white transition-all mr-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Interview Log</h1>
            <p className="text-xs text-dark-500">Track and review all previous mock sessions.</p>
          </div>
        </div>
        <span className="text-xs text-dark-400 font-semibold bg-dark-900 px-3 py-1.5 rounded-lg border border-dark-800">
          Total: {history.length}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-dark-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
          <p>Retrieving interview history…</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-dark-900/20 border border-dashed border-dark-800 rounded-3xl max-w-2xl mx-auto">
          <ClipboardList className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No interviews yet</h2>
          <p className="text-dark-500 text-sm max-w-sm mx-auto mb-8">
            You haven't conducted any mock interviews. Launch your first session to begin.
          </p>
          <button onClick={() => navigate('/start-interview')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-8 rounded-xl transition-all glow-shadow-brand">
            Start Practice Session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((row) => (
            <div key={row.interview_id}
              className="glass-card rounded-2xl p-5 border border-dark-800 hover:border-brand-500/25 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              {/* Left: info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-white text-base">{row.topic} Interview</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    row.status === 'completed'
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                  }`}>
                    {row.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(row.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{row.questions_count} questions</span>
                  {row.status === 'completed' && row.overall_score != null && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-green-400 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        {row.overall_score.toFixed(1)} / 10
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Report */}
                <button onClick={() => navigate(`/results?session_id=${row.interview_id}`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-900 border border-dark-800 text-xs font-semibold text-brand-400 hover:bg-brand-500 hover:border-brand-600 hover:text-white transition-all duration-150">
                  <ChevronRight className="w-3.5 h-3.5" />
                  View Report
                </button>

                {/* Download PDF – only for completed sessions */}
                {row.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(row.interview_id)}
                    disabled={dlLoadingId === row.interview_id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-900 border border-dark-800 text-xs font-semibold text-dark-200 hover:border-brand-500/40 hover:text-brand-300 transition-all disabled:opacity-50"
                  >
                    {dlLoadingId === row.interview_id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />}
                    Download PDF
                  </button>
                )}

                {/* Email Again – only for completed sessions */}
                {row.status === 'completed' && (
                  <button
                    onClick={() => setEmailSession(row.interview_id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-900 border border-dark-800 text-xs font-semibold text-dark-200 hover:border-brand-500/40 hover:text-brand-300 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
