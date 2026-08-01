import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Award, CheckCircle, AlertTriangle, Lightbulb,
  ChevronDown, ChevronUp, ArrowLeft, Loader2,
  BookOpen, Download, Mail, X, CheckCircle2, MessageSquareHeart
} from 'lucide-react';

// ─── Toast notification component ────────────────────────────────────────────
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
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
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
      await api.post('/api/report/send-email', {
        interview_id: sessionId,
        email,
      });
      setToast({ type: 'success', message: 'Report emailed successfully!' });
      setTimeout(onClose, 2000);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Email failed. Check SMTP credentials in backend/.env.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm animate-fade-in px-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent rounded-t-2xl" />

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-400" /> Email Report
          </h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-dark-400 mb-5 leading-relaxed">
          A professional PDF report will be generated and sent to the email address below.
        </p>

        <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-2">
          Recipient Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="candidate@example.com"
          className="w-full bg-dark-900/60 border border-dark-800 rounded-xl py-3 px-4 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:text-white text-sm font-semibold transition-all duration-150">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !email}
            className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 glow-shadow-brand-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Results page ────────────────────────────────────────────────────────
const Results = () => {
  const [searchParams]   = useSearchParams();
  const sessionId        = searchParams.get('session_id');
  const navigate         = useNavigate();

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [showEmail,     setShowEmail]     = useState(false);
  const [dlLoading,     setDlLoading]     = useState(false);
  const [toast,         setToast]         = useState(null);

  useEffect(() => {
    if (!sessionId) { setError('Missing session ID.'); setLoading(false); return; }
    api.get(`/api/interview/report/${sessionId}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch report.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── PDF download ────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDlLoading(true);
    setToast({ type: 'loading', message: 'Generating PDF…' });
    try {
      const res = await api.get(`/api/report/download/${sessionId}`, {
        responseType: 'blob',
      });
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
      setDlLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-dark-400">
      <Loader2 className="w-10 h-10 animate-spin text-brand-400 mb-4" />
      <p className="font-medium">Compiling mock interview results…</p>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-md mx-auto px-6 py-20 text-center animate-fade-in">
      <div className="p-4 bg-red-950/20 border border-red-500/25 rounded-2xl text-red-400 mb-6 font-semibold">
        {error || 'An unexpected error occurred.'}
      </div>
      <button onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );

  const { report, topic, qa_history } = data;
  const score = report.overall_score || 0.0;

  const getScoreColor = v =>
    v >= 8 ? 'text-green-400 border-green-500/30 bg-green-500/5'
    : v >= 5 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
    : 'text-red-400 border-red-500/30 bg-red-500/5';

  const getScoreGlow = v =>
    v >= 8 ? 'shadow-[0_0_40px_-5px_rgba(34,197,94,0.25)] border-green-500/40'
    : v >= 5 ? 'shadow-[0_0_40px_-5px_rgba(234,179,8,0.20)] border-yellow-500/40'
    : 'shadow-[0_0_40px_-5px_rgba(239,68,68,0.25)] border-red-500/40';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in space-y-10">
      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Email modal */}
      {showEmail && <EmailModal sessionId={sessionId} onClose={() => setShowEmail(false)} />}

      {/* Top header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-850 pb-5">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-300 hover:text-white font-medium text-sm transition-all duration-150">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/feedback?session_id=${sessionId}&topic=${data?.topic || ''}&difficulty=${data?.report?.current_difficulty || 'Medium'}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-sm font-semibold transition-all duration-150"
          >
            <MessageSquareHeart className="w-4 h-4" />
            Give Feedback
          </button>
          <button
            onClick={handleDownload}
            disabled={dlLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-900 border border-dark-800 text-dark-200 hover:border-brand-500/40 hover:text-brand-300 text-sm font-semibold transition-all duration-150 disabled:opacity-50"
          >
            {dlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
          <button
            onClick={() => setShowEmail(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all duration-150 glow-shadow-brand-sm"
          >
            <Mail className="w-4 h-4" />
            Email Report
          </button>
        </div>
      </div>

      {/* Score + info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <div className={`glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center border ${getScoreGlow(score)}`}>
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-6">
            <Award className="w-7 h-7" />
          </div>
          <span className="block text-xs font-bold uppercase tracking-wider text-dark-400 mb-2">Overall Grade</span>
          <div className="flex items-end gap-1 mb-4">
            <span className="text-6xl font-extrabold tracking-tighter text-white">{score.toFixed(1)}</span>
            <span className="text-xl text-dark-500 font-bold mb-1">/ 10</span>
          </div>
          <span className="text-xs text-dark-500 max-w-xs leading-relaxed">
            Synthesized by the Report Agent across 5 adaptive questions.
          </span>
        </div>

        <div className="md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{topic} performance synthesis</h2>
              <p className="text-xs text-dark-500">Compiled from individual evaluations.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400">
                  <CheckCircle className="w-4 h-4" /> Key Strengths
                </span>
                <ul className="space-y-2">
                  {report.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-dark-300 pl-3 border-l border-green-500/30 py-0.5 leading-relaxed">{str}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                  <AlertTriangle className="w-4 h-4" /> Areas of Improvement
                </span>
                <ul className="space-y-2">
                  {report.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-dark-300 pl-3 border-l border-red-500/30 py-0.5 leading-relaxed">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-yellow-500 to-amber-500" />
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" /> Learning Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-xl bg-dark-900/40 border border-dark-850 flex gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-dark-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Q&A Breakdown */}
      <div className="space-y-5">
        <h3 className="text-xl font-bold text-white">Question-by-Question Transcript</h3>
        <div className="space-y-4">
          {qa_history.map((qa, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div key={index} className="glass-card rounded-2xl overflow-hidden border border-dark-800 transition-all duration-300">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-900/40 transition-colors duration-150"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-dark-900 border border-dark-850 text-dark-300 flex items-center justify-center text-xs font-bold">
                      Q{index + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(qa.score)}`}>
                      Grade: {qa.score}/10
                    </span>
                    <span className="text-xs text-dark-500">Difficulty: {qa.difficulty}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-dark-400" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-dark-850 bg-dark-900/10 space-y-5">
                    <div>
                      <span className="block text-xs uppercase tracking-wider font-bold text-brand-400 mb-2">Question</span>
                      <p className="text-white text-sm font-medium leading-relaxed bg-dark-950/80 border border-dark-900 p-4 rounded-xl whitespace-pre-line">{qa.question}</p>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider font-bold text-dark-400 mb-2">Your Response</span>
                      <pre className="text-dark-200 text-xs font-mono leading-relaxed bg-dark-950/40 border border-dark-900 p-4 rounded-xl whitespace-pre-wrap max-h-60 overflow-y-auto">{qa.answer}</pre>
                    </div>
                    <div className="p-5 rounded-xl bg-dark-900 border border-dark-850">
                      <span className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2">Evaluator Feedback</span>
                      <p className="text-dark-300 text-xs leading-relaxed">{qa.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Results;
