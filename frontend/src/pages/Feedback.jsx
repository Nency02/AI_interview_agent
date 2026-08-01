/**
 * Feedback Page
 * Shown automatically after the interview results are viewed.
 *
 * URL params expected:
 *   ?session_id=<id>&topic=<topic>&difficulty=<difficulty>
 */
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import {
  CheckCircle2, MessageSquareHeart, X,
  Loader2, ChevronRight, ArrowRight, Sparkles
} from 'lucide-react';

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: 'bg-green-950/90 border-green-500/40 text-green-300',
    error:   'bg-red-950/90   border-red-500/40   text-red-300',
    loading: 'bg-dark-900/90 border-dark-700      text-dark-200',
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? X : Loader2;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md ${styles[type]}`}>
      <Icon className={`w-5 h-5 shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium max-w-sm">{message}</span>
      {type !== 'loading' && (
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ─── Feedback Page ────────────────────────────────────────────────────────────
const FeedbackPage = () => {
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const [params]       = useSearchParams();

  const sessionId  = params.get('session_id') || '';
  const topicParam = params.get('topic')       || '';
  const diffParam  = params.get('difficulty')  || '';

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:           user?.name        || '',
    email:          user?.email       || '',
    subject:        topicParam,
    difficulty:     diffParam,
    overall_rating: 0,
    ai_rating:      0,
    feedback:       '',
    recommend:      '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const MAX_CHARS = 2000;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name           = 'Name is required.';
    if (!form.email.trim())        e.email          = 'Email is required.';
    if (!form.subject.trim())      e.subject        = 'Subject is required.';
    if (!form.overall_rating)      e.overall_rating = 'Please rate your overall experience.';
    if (!form.ai_rating)           e.ai_rating      = 'Please rate the AI question quality.';
    if (!form.feedback.trim())     e.feedback       = 'Please share your thoughts.';
    if (!form.recommend)           e.recommend      = 'Please select an option.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setToast({ type: 'loading', message: 'Submitting your feedback…' });

    try {
      await api.post('/api/feedback', form);
      setToast({
        type:    'success',
        message: 'Thank you! Your feedback has been submitted successfully.',
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setToast({
        type:    'error',
        message: err.response?.data?.detail ||
                 'Failed to submit feedback. Please try again.',
      });
      setLoading(false);
    }
  };

  const handleSkip = () => navigate('/dashboard');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-4 py-12">

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl animate-fade-in">

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="glass-card rounded-3xl p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500" />

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/10 border border-brand-500/20 mb-5 mx-auto">
            <MessageSquareHeart className="w-9 h-9 text-brand-400" />
          </div>

          {/* Headline */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white">Interview Complete!</h1>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-dark-400 text-sm leading-relaxed max-w-md mx-auto">
            Great work finishing your mock interview. Help us improve by sharing
            your experience — it only takes 60 seconds.
          </p>
        </div>

        {/* ── Feedback form card ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="glass-card rounded-3xl p-8 space-y-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-dark-700 to-transparent" />

            {/* ── Section: candidate info (auto-filled, read-only) ─────────── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-4">
                Candidate Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Your name"
                    className={`w-full bg-dark-900/60 border rounded-xl py-3 px-4 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors ${
                      errors.name ? 'border-red-500/60' : 'border-dark-800'
                    }`}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full bg-dark-900/60 border rounded-xl py-3 px-4 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors ${
                      errors.email ? 'border-red-500/60' : 'border-dark-800'
                    }`}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Interview Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => set('subject', e.target.value)}
                    placeholder="e.g. DSA, System Design"
                    className={`w-full bg-dark-900/60 border rounded-xl py-3 px-4 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors ${
                      errors.subject ? 'border-red-500/60' : 'border-dark-800'
                    }`}
                  />
                  {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={e => set('difficulty', e.target.value)}
                    className="w-full bg-dark-900/60 border border-dark-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  >
                    <option value="">Select difficulty</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dark-850" />

            {/* ── Section: ratings ─────────────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-5">
                Rate Your Experience
              </h2>

              <div className="space-y-6">
                {/* Overall rating */}
                <div>
                  <StarRating
                    label="Overall Interview Rating"
                    value={form.overall_rating}
                    onChange={v => set('overall_rating', v)}
                    size="md"
                  />
                  {errors.overall_rating && (
                    <p className="text-red-400 text-xs mt-1">{errors.overall_rating}</p>
                  )}
                </div>

                {/* AI question quality */}
                <div>
                  <StarRating
                    label="AI Question Quality Rating"
                    value={form.ai_rating}
                    onChange={v => set('ai_rating', v)}
                    size="md"
                  />
                  {errors.ai_rating && (
                    <p className="text-red-400 text-xs mt-1">{errors.ai_rating}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dark-850" />

            {/* ── Section: written feedback ────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-4">
                Your Feedback
              </h2>

              <div className="relative">
                <textarea
                  rows={5}
                  maxLength={MAX_CHARS}
                  value={form.feedback}
                  onChange={e => set('feedback', e.target.value)}
                  placeholder="Share your thoughts about the interview experience, question relevance, platform usability…"
                  className={`w-full bg-dark-900/60 border rounded-xl py-3 px-4 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none ${
                    errors.feedback ? 'border-red-500/60' : 'border-dark-800'
                  }`}
                />
                <span className={`absolute bottom-3 right-4 text-[11px] ${
                  form.feedback.length > MAX_CHARS * 0.9
                    ? 'text-amber-400'
                    : 'text-dark-600'
                }`}>
                  {form.feedback.length}/{MAX_CHARS}
                </span>
              </div>
              {errors.feedback && (
                <p className="text-red-400 text-xs mt-1">{errors.feedback}</p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dark-850" />

            {/* ── Section: recommendation ──────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-4">
                Would You Recommend This Platform?
              </h2>

              <div className="flex gap-4">
                {['Yes', 'No'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('recommend', opt)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                      form.recommend === opt
                        ? opt === 'Yes'
                          ? 'bg-green-500/15 border-green-500/50 text-green-400'
                          : 'bg-red-500/15 border-red-500/50 text-red-400'
                        : 'bg-dark-900/60 border-dark-800 text-dark-400 hover:border-dark-600 hover:text-dark-200'
                    }`}
                  >
                    {opt === 'Yes' ? '👍  Yes, definitely!' : '👎  Not right now'}
                  </button>
                ))}
              </div>
              {errors.recommend && (
                <p className="text-red-400 text-xs mt-1">{errors.recommend}</p>
              )}
            </div>

            {/* ── Buttons ───────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3.5 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:text-white text-sm font-semibold transition-all duration-150"
              >
                Skip for now
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 glow-shadow-brand"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Feedback
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>{/* end glass-card */}
        </form>

      </div>
    </div>
  );
};

export default FeedbackPage;
