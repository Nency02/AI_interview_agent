import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Play, Code, Database, Cpu, Blocks, Users, Loader2 } from 'lucide-react';

const TOPICS = [
  { id: 'DSA', name: 'Data Structures & Algorithms', desc: 'Arrays, Lists, Trees, Graphs, Sorting, Searching, DP', icon: Code, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'DBMS', name: 'Database Management', desc: 'SQL Queries, Joins, Normalization, ACID, Transactions, Indexing', icon: Database, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { id: 'OS', name: 'Operating Systems', desc: 'Processes, Threads, CPU Scheduling, Virtual Memory, Deadlocks', icon: Cpu, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { id: 'OOP', name: 'Object-Oriented Programming', desc: 'SOLID principles, Inheritance, Polymorphism, Abstraction, Design Patterns', icon: Blocks, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'HR', name: 'Behavioral & Scenario', desc: 'Behavioral questions, STAR method, conflict resolution, project sharing', icon: Users, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const StartInterview = () => {
  const [selectedTopic, setSelectedTopic] = useState('DSA');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleStart = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/api/interview/start', {
        topic: selectedTopic,
        difficulty: selectedDifficulty
      });
      
      // Navigate to the interview page, passing the initial question state
      navigate('/interview', { 
        state: { 
          interviewData: res.data 
        } 
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          Configure Your Mock Interview
        </h1>
        <p className="text-dark-400 max-w-lg mx-auto">
          Choose your core focus area and starting difficulty. The AI interviewer will adapt dynamically to your answers.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {/* Grid Box */}
      <div className="glass-card rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>

        {/* 1. Topic Selection */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Step 1: Select Topic
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.id;
              
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-5 rounded-xl border text-left transition-all duration-200 flex items-start gap-4 ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500/60 ring-1 ring-brand-500/60'
                      : 'bg-dark-900/40 border-dark-800 hover:border-dark-700 hover:bg-dark-900/70'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${topic.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-0.5">
                      {topic.name}
                    </span>
                    <span className="text-xs text-dark-500 block leading-relaxed">
                      {topic.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Difficulty Selection */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Step 2: Starting Difficulty
          </h2>
          <div className="flex gap-4">
            {DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff;
              
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`flex-1 py-4.5 rounded-xl border font-bold text-sm tracking-wide transition-all duration-200 text-center ${
                    isSelected
                      ? 'bg-brand-500 border-brand-500 text-white glow-shadow-brand-sm'
                      : 'bg-dark-900/40 border-dark-800 hover:border-dark-700 text-dark-300 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
          <span className="block text-2xs text-dark-500 mt-3 text-center">
            * Note: The AI will increase difficulty if you score above 8, and decrease it if you score below 5.
          </span>
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-dark-800 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3.5 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:bg-dark-850 hover:text-white text-sm font-semibold transition-all duration-150"
          >
            Cancel
          </button>
          
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 glow-shadow-brand"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Initializing Agents...</span>
              </>
            ) : (
              <>
                <span>Launch Interview Room</span>
                <Play className="w-4 h-4 fill-current" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
