import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Lock, Mail, User, Building2, Phone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (tab: string) => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onSuccess }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('public');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters in length.');
      return;
    }

    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        organization: organization || undefined,
        phone: phone || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create a FaceTrace AI Account
        </h1>
        <p className="text-xs text-slate-600">
          Join authorized case coordinators, public volunteers, and liaison personnel.
        </p>
      </div>

      {(localError || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
        <div>
          <label htmlFor="reg-name-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Full Legal Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-name-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@organization.org"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Password (minimum 8 characters) *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-role-select" className="block text-xs font-semibold text-slate-900 mb-1">
            Requested Account Role *
          </label>
          <select
            id="reg-role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
          >
            <option value="public">Public Volunteer / Community Member (Immediate Access)</option>
            <option value="case_manager">Case Coordinator / Search Alliance (Requires Review)</option>
            <option value="law_enforcement">Law Enforcement Liaison (Requires Official Verification)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            {role === 'public'
              ? 'Community members can report sightings and track bulletins.'
              : 'Specialized roles require organization verification before case management features are unlocked.'}
          </p>
        </div>

        <div>
          <label htmlFor="reg-org-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Affiliated Organization / Agency (Optional)
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-org-input"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Metro Missing Persons Search Auxiliary"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-phone-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Contact Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2"
        >
          <span>{isLoading ? 'Registering...' : 'Create Account'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signin')}
            className="text-slate-900 font-semibold hover:underline"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
};
