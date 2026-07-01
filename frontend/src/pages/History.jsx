import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { History, Calendar, ClipboardList, Award, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

const HistoryPage = () => {
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-850 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-dark-300 hover:text-white transition-all duration-150 mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Interview Log</h1>
            <p className="text-xs text-dark-500">Track and review all your previous mock sessions.</p>
          </div>
        </div>
        <span className="text-xs text-dark-400 font-semibold bg-dark-900 px-3 py-1.5 rounded-lg border border-dark-800">
          Total sessions: {history.length}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-dark-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
          <p>Retrieving your interview history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-dark-900/20 border border-dashed border-dark-800 rounded-3xl max-w-2xl mx-auto">
          <ClipboardList className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No interviews yet</h2>
          <p className="text-dark-500 text-sm max-w-sm mx-auto mb-8">
            You haven't conducted any technical mock interviews. Launch your first session to receive your performance report.
          </p>
          <button
            onClick={() => navigate('/start-interview')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-150 glow-shadow-brand"
          >
            Start First Practice Session
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-dark-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-850 text-xs font-semibold uppercase tracking-wider text-dark-400">
                  <th className="px-6 py-4.5">Topic</th>
                  <th className="px-6 py-4.5">Date</th>
                  <th className="px-6 py-4.5">Questions</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Grade</th>
                  <th className="px-6 py-4.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-850/60 bg-dark-900/10">
                {history.map((row) => (
                  <tr key={row.interview_id} className="hover:bg-dark-900/30 transition-colors duration-150">
                    {/* Topic */}
                    <td className="px-6 py-5.5">
                      <span className="font-bold text-white block">
                        {row.topic}
                      </span>
                    </td>
                    
                    {/* Date */}
                    <td className="px-6 py-5.5 text-xs text-dark-300">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-dark-500" />
                        {new Date(row.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Questions Count */}
                    <td className="px-6 py-5.5 text-xs text-dark-300">
                      {row.questions_count} / 5
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-2xs font-semibold ${
                        row.status === 'completed' 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                          : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                      }`}>
                        {row.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-5.5">
                      {row.status === 'completed' ? (
                        <span className="font-extrabold text-green-400 text-sm flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {row.overall_score?.toFixed(1) || '0.0'}
                          <span className="text-2xs text-dark-500 font-medium">/10</span>
                        </span>
                      ) : (
                        <span className="text-dark-500 text-xs">-</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-5.5 text-right">
                      <button
                        onClick={() => navigate(`/results?session_id=${row.interview_id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-800 text-xs font-semibold text-brand-400 hover:bg-brand-500 hover:border-brand-600 hover:text-white transition-all duration-150"
                      >
                        <span>View report</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
