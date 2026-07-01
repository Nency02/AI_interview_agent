import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Send, AlertCircle, Sparkles, MessageSquare, Terminal, HelpCircle, Loader2 } from 'lucide-react';

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Local state initialized from navigation state
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Evaluating your response...');
  const [error, setError] = useState('');

  useEffect(() => {
    // If we refresh or navigate directly without state, redirect to start page
    if (!location.state?.interviewData) {
      navigate('/start-interview');
      return;
    }
    
    setSession(location.state.interviewData);
  }, [location, navigate]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-dark-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
        <p>Loading interview environment...</p>
      </div>
    );
  }

  const { interview_id, topic, difficulty, question, questions_count } = session;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please type an answer before submitting.');
      return;
    }
    
    setError('');
    setLoading(true);
    setLoadingMsg('Evaluating your answer with Evaluator Agent...');
    
    try {
      // Step 1: Submit answer to evaluate & route next
      const res = await api.post('/api/interview/answer', {
        interview_id,
        answer: answer.trim()
      });
      
      const evalData = res.data;
      
      // Delay messages to make the multi-agent execution feel alive!
      setLoadingMsg('Decision Agent is evaluating next difficulty level...');
      await new Promise((r) => setTimeout(r, 1000));
      
      if (evalData.is_completed) {
        setLoadingMsg('Report Agent is compiling your final performance report...');
        await new Promise((r) => setTimeout(r, 1000));
        
        // Navigate to results page
        navigate(`/results?session_id=${interview_id}`);
      } else {
        setLoadingMsg('Interviewer Agent is generating your next question...');
        await new Promise((r) => setTimeout(r, 1000));
        
        // Update session state for next question
        setSession((prev) => ({
          ...prev,
          difficulty: evalData.next_difficulty,
          question: evalData.next_question,
          questions_count: prev.questions_count + 1
        }));
        
        // Reset answer field
        setAnswer('');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit answer. Please try again.');
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'Medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'Hard':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-dark-800 border-dark-700 text-dark-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 relative">
      {/* Full screen loader overlay with nice micro-animations */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-brand-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-white font-bold text-lg mb-2">Analyzing response...</p>
          <p className="text-brand-300 font-medium text-sm animate-pulse-subtle max-w-md">
            {loadingMsg}
          </p>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-2xs font-bold uppercase tracking-wider text-brand-400 block mb-1">
            Active Mock Session
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {topic} Interview
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-full border text-xs font-bold ${getDifficultyColor(difficulty)}`}>
            Difficulty: {difficulty}
          </div>
          <div className="px-3.5 py-1.5 rounded-full border border-dark-800 bg-dark-900/60 text-dark-300 text-xs font-bold">
            Question {questions_count} of 5
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Active Question Box */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>
            
            <div className="flex items-center gap-2 text-brand-400 mb-4">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold text-sm">Interviewer Agent says:</span>
            </div>

            <div className="text-white text-base md:text-lg font-medium leading-relaxed mb-6 whitespace-pre-line">
              {question}
            </div>

            <div className="p-4 rounded-xl bg-dark-900/40 border border-dark-800 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-dark-500 shrink-0 mt-0.5" />
              <div className="text-xs text-dark-400 leading-relaxed">
                Provide as comprehensive of an answer as possible. You can explain your reasoning, structure code snippets inside the box, or dry-run variables if needed.
              </div>
            </div>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card rounded-2xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-dark-850 pb-4 mb-4">
                <label className="text-sm font-semibold uppercase tracking-wider text-dark-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-brand-400" /> Your Solution / Answer
                </label>
                <span className="text-xs text-dark-500">
                  {answer.length} characters
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={10}
                className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-white font-mono text-sm leading-relaxed placeholder-dark-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
                placeholder="Type your response here..."
                required
              />

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-200 glow-shadow-brand-sm disabled:opacity-50"
                >
                  <span>Submit Answer</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right column: Study guidelines helper */}
        <div>
          <div className="glass-card rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-dark-800 pb-3">
              Interview Guidelines
            </h3>
            
            <ul className="space-y-3.5 text-xs text-dark-400 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-brand-400 font-bold">•</span>
                <span>The interview comprises <strong>5 questions</strong> in total.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-400 font-bold">•</span>
                <span>The Evaluator Agent scores each answer from 1 to 10 based on depth, correctness, and syntax where applicable.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-400 font-bold">•</span>
                <span>Difficulty adapts in real-time. Try your best to keep up if the questions become harder!</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-400 font-bold">•</span>
                <span>Ensure you explain execution logic and edge cases in your answers to maximize your score.</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-dark-800">
              <span className="block text-2xs uppercase tracking-wider text-dark-500 font-bold mb-2">
                Active Session Token
              </span>
              <span className="block font-mono text-[10px] text-dark-600 truncate bg-dark-950 p-2 rounded-lg border border-dark-900">
                {interview_id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
