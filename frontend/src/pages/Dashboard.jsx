import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Play, ClipboardList, Award, CheckCircle2, ChevronRight, Calendar, ArrowRight, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/api/interview/history');
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Compute stats
  const totalInterviews = history.length;
  const completedInterviews = history.filter(h => h.status === 'completed');
  const totalCompleted = completedInterviews.length;
  
  const averageScore = totalCompleted > 0
    ? (completedInterviews.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / totalCompleted).toFixed(1)
    : '0.0';

  const highScorer = totalCompleted > 0
    ? Math.max(...completedInterviews.map(h => h.overall_score || 0)).toFixed(1)
    : '0.0';

  const recentReports = history.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-dark-400">
            Practice technical interviews, get instant grading, and track your progress.
          </p>
        </div>
        <button
          onClick={() => navigate('/start-interview')}
          className="flex items-center gap-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 glow-shadow-brand"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Start Practice Mock</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Interviews */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
              Total Sessions
            </span>
            <span className="text-3xl font-extrabold text-white">{totalInterviews}</span>
          </div>
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Average Score */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
              Average Grade
            </span>
            <span className="text-3xl font-extrabold text-white">{averageScore} <span className="text-sm font-medium text-dark-400">/ 10</span></span>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Highest Score */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
              Highest Grade
            </span>
            <span className="text-3xl font-extrabold text-white">{highScorer} <span className="text-sm font-medium text-dark-400">/ 10</span></span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Quick Start Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reports List */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 shadow-xl h-full">
            <div className="flex items-center justify-between border-b border-dark-800 pb-5 mb-5">
              <h2 className="text-xl font-bold text-white">Recent Mock Interviews</h2>
              {history.length > 3 && (
                <Link to="/history" className="text-brand-400 hover:text-brand-300 text-sm font-semibold flex items-center gap-1 transition-colors duration-150">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-dark-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
                <p>Loading your profile statistics...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-16 bg-dark-900/30 border border-dashed border-dark-800 rounded-xl">
                <ClipboardList className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-300 font-semibold mb-2">No interviews attempted yet</p>
                <p className="text-dark-500 text-sm mb-6">Start your first technical interview to evaluate your skills.</p>
                <button
                  onClick={() => navigate('/start-interview')}
                  className="bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 hover:text-brand-300 font-semibold py-2 px-6 rounded-xl transition-all duration-150"
                >
                  Configure Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.interview_id}
                    className="p-4 rounded-xl border border-dark-800/80 bg-dark-900/40 hover:bg-dark-900/80 hover:border-brand-500/25 transition-all duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-base">
                          {report.topic} Interview
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          report.status === 'completed' 
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                            : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                        }`}>
                          {report.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>{report.questions_count} questions</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      {report.status === 'completed' && (
                        <div className="text-right">
                          <span className="block text-2xs uppercase tracking-wider text-dark-500 font-bold mb-0.5">
                            Grade
                          </span>
                          <span className="font-extrabold text-green-400 text-lg">
                            {report.overall_score?.toFixed(1) || '0.0'}{' '}
                            <span className="text-xs text-dark-400 font-medium">/10</span>
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (report.status === 'completed') {
                            navigate(`/results?session_id=${report.interview_id}`);
                          } else {
                            // If in progress, we don't have a direct resume, but we can restart or write custom flow.
                            // To keep it simple, redirect to dashboard or results. Let's redirect to results which pulls report.
                            navigate(`/results?session_id=${report.interview_id}`);
                          }
                        }}
                        className="p-2 rounded-lg bg-dark-900 border border-dark-800 group-hover:bg-brand-500 group-hover:border-brand-600 group-hover:text-white text-dark-300 transition-all duration-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info/Topic Guideline Card */}
        <div>
          <div className="glass-card rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white border-b border-dark-800 pb-4 mb-4">
                Available Topics
              </h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-dark-200 block">DSA</span>
                    <span className="text-dark-500 text-xs">Algorithms, complexity, tree, graphs, dynamic programming.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-dark-200 block">DBMS</span>
                    <span className="text-dark-500 text-xs">SQL queries, normalization, transactions (ACID), indexing.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-dark-200 block">OS</span>
                    <span className="text-dark-500 text-xs">Paging, processes, virtual memory, scheduling algorithms.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-dark-200 block">OOP</span>
                    <span className="text-dark-500 text-xs">SOLID principles, design patterns, encapsulation, polymorphism.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    5
                  </div>
                  <div>
                    <span className="font-bold text-dark-200 block">HR / Behavioral</span>
                    <span className="text-dark-500 text-xs">STAR framework, project conflicts, team situation scenarios.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-dark-800 text-xs text-dark-500 text-center">
              Our dynamic multi-agent system automatically adjusts difficulty as you answer. Keep questions consistent to test your bounds!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
