import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface SignInPageProps {
  onNavigate: (tab: string) => void;
  onSuccess: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onNavigate, onSuccess }) => {
  const { login, demoLogin, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed.');
    }
  };

  const handleDemo = async (role: 'admin' | 'case_manager' | 'public') => {
    setLocalError(null);
    clearError();
    try {
      await demoLogin(role);
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Demo sign-in failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to FaceTrace AI
        </h1>
        <p className="text-xs text-slate-600">
          Access your case management hub, sighting reports, and moderation queues.
        </p>
      </div>

      {/* Quick Demo Role Selectors */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-slate-700" />
          <span>Quick Evaluation Logins (Pre-configured Roles):</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleDemo('admin')}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-center transition-colors shadow-2xs"
          >
            <div className="font-bold text-slate-900">Admin</div>
            <div className="text-[10px] text-slate-500">Elena Rostova</div>
          </button>
          <button
            type="button"
            onClick={() => handleDemo('case_manager')}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-center transition-colors shadow-2xs"
          >
            <div className="font-bold text-slate-900">Coordinator</div>
            <div className="text-[10px] text-slate-500">Marcus Thorne</div>
          </button>
          <button
            type="button"
            onClick={() => handleDemo('public')}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-center transition-colors shadow-2xs"
          >
            <div className="font-bold text-slate-900">Volunteer</div>
            <div className="text-[10px] text-slate-500">Sarah Chen</div>
          </button>
        </div>
      </div>

      {(localError || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
        <div>
          <label htmlFor="signin-email-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="signin-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.org"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="signin-password-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="signin-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2"
        >
          <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Don&rsquo;t have an account yet?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-slate-900 font-semibold hover:underline"
          >
            Register here
          </button>
        </div>
      </form>
    </div>
  );
};
