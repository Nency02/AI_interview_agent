import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Award, CheckCircle, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, ArrowLeft, Loader2, BookOpen } from 'lucide-react';

const Results = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0); // expand first QA by default

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID. Cannot load results.');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await api.get(`/api/interview/report/${sessionId}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to fetch performance report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-dark-400">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400 mb-4" />
        <p className="font-medium">Compiling mock interview results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center animate-fade-in">
        <div className="p-4 bg-red-950/20 border border-red-500/25 rounded-2xl text-red-400 mb-6 font-semibold">
          {error || 'An unexpected error occurred.'}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-bold transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { report, topic, qa_history } = data;
  const score = report.overall_score || 0.0;

  const getScoreColor = (val) => {
    if (val >= 8) return 'text-green-400 border-green-500/30 bg-green-500/5';
    if (val >= 5) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
    return 'text-red-400 border-red-500/30 bg-red-500/5';
  };

  const getScoreGlow = (val) => {
    if (val >= 8) return 'shadow-[0_0_40px_-5px_rgba(34,197,94,0.25)] border-green-500/40';
    if (val >= 5) return 'shadow-[0_0_40px_-5px_rgba(234,179,8,0.20)] border-yellow-500/40';
    return 'shadow-[0_0_40px_-5px_rgba(239,68,68,0.25)] border-red-500/40';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in space-y-10">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-dark-850 pb-5">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-300 hover:text-white font-medium text-sm transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-2xs font-bold uppercase tracking-wider text-dark-500">
          Interview session ID: {sessionId}
        </span>
      </div>

      {/* Main Score & Synthetic Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Score Ring Display */}
        <div className={`glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center border ${getScoreGlow(score)}`}>
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-6">
            <Award className="w-7 h-7" />
          </div>
          <span className="block text-xs font-bold uppercase tracking-wider text-dark-400 mb-2">
            Overall Grade
          </span>
          <div className="relative flex items-center justify-center mb-4">
            <span className="text-6xl font-extrabold tracking-tighter text-white">
              {score.toFixed(1)}
            </span>
            <span className="text-xl text-dark-500 font-bold ml-1 align-bottom mt-6">
              / 10
            </span>
          </div>
          <span className="text-xs text-dark-500 max-w-xs leading-relaxed">
            Synthesized by the Report Agent based on your performance across 5 adaptive questions.
          </span>
        </div>

        {/* Strengths & Weaknesses Summary */}
        <div className="md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                {topic} performance synthesis
              </h2>
              <p className="text-xs text-dark-500">
                Evaluation results compiled from the individual response evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Key Strengths
                </span>
                <ul className="space-y-2">
                  {report.strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-dark-300 pl-3 border-l border-green-500/30 py-0.5 leading-relaxed">
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Areas of Improvement
                </span>
                <ul className="space-y-2">
                  {report.weaknesses.map((weak, idx) => (
                    <li key={idx} className="text-xs text-dark-300 pl-3 border-l border-red-500/30 py-0.5 leading-relaxed">
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Box */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-yellow-500 to-amber-500"></div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" /> Actionable Learning Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-dark-900/40 border border-dark-850 flex gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-dark-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Question breakdown */}
      <div className="space-y-5">
        <h3 className="text-xl font-bold text-white">
          Question-by-Question Transcript
        </h3>

        <div className="space-y-4">
          {qa_history.map((qa, index) => {
            const isExpanded = expandedIndex === index;
            
            return (
              <div
                key={index}
                className="glass-card rounded-2xl overflow-hidden border border-dark-800 transition-all duration-300"
              >
                {/* Accordion header */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full px-6 py-4.5 flex items-center justify-between text-left hover:bg-dark-900/40 transition-colors duration-150"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-dark-900 border border-dark-850 text-dark-300 flex items-center justify-center text-xs font-bold font-mono">
                      Q{index + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${getScoreColor(qa.score)}`}>
                      Grade: {qa.score}/10
                    </span>
                    <span className="text-xs text-dark-500">
                      Difficulty: {qa.difficulty}
                    </span>
                  </div>

                  <div className="text-dark-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Accordion content */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-dark-850 bg-dark-900/10 space-y-6">
                    {/* Question text */}
                    <div>
                      <span className="block text-2xs uppercase tracking-wider font-bold text-brand-400 mb-2">
                        Question
                      </span>
                      <p className="text-white text-sm font-medium leading-relaxed bg-dark-950/80 border border-dark-900 p-4 rounded-xl whitespace-pre-line">
                        {qa.question}
                      </p>
                    </div>

                    {/* Candidate's answer */}
                    <div>
                      <span className="block text-2xs uppercase tracking-wider font-bold text-dark-400 mb-2">
                        Your Response
                      </span>
                      <pre className="text-dark-200 text-xs font-mono leading-relaxed bg-dark-950/40 border border-dark-900 p-4 rounded-xl whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {qa.answer}
                      </pre>
                    </div>

                    {/* Evaluator feedback */}
                    <div className="p-5 rounded-xl bg-dark-900 border border-dark-850">
                      <span className="block text-2xs uppercase tracking-wider font-bold text-green-400 mb-2">
                        Evaluator Feedback
                      </span>
                      <p className="text-dark-300 text-xs leading-relaxed">
                        {qa.feedback}
                      </p>
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
