import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, History, User, Cpu } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-dark-800/80 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 group-hover:glow-shadow-brand-sm transition-all duration-300">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">
            AI Interview Coach
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/dashboard')
                ? 'bg-dark-900 border border-brand-500/20 text-brand-400 font-semibold'
                : 'text-dark-300 hover:bg-dark-900 hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/history')
                ? 'bg-dark-900 border border-brand-500/20 text-brand-400 font-semibold'
                : 'text-dark-300 hover:bg-dark-900 hover:text-white border border-transparent'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User profile identifier */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-dark-900/60 border border-dark-800 text-dark-200 text-xs">
          <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold">{user.name}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:bg-red-950/20 hover:border-red-500/30 hover:text-red-400 text-sm font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
