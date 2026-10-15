import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, ShieldCheck, User as UserIcon, LogOut, ChevronDown, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          onClick={() => handleNav('home')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block"></span>
          <span>FaceTrace AI</span>
        </button>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => handleNav('cases')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentTab === 'cases' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Missing Cases
          </button>
          <button
            onClick={() => handleNav('report-sighting')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentTab === 'report-sighting' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Report Sighting
          </button>
          <button
            onClick={() => handleNav('image-analysis')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentTab === 'image-analysis' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Image Inspector
          </button>
          <button
            onClick={() => handleNav('submit-case')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentTab === 'submit-case' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Lawful Intake
          </button>
          <button
            onClick={() => handleNav('help-privacy')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentTab === 'help-privacy' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Privacy & Protocol
          </button>
        </nav>

        {/* Zone 3: 1 primary action or profile menu */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('notifications')}
                  className="relative p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  aria-label={`Notifications (${unreadCount} unread)`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600" />
                  )}
                </button>

                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-slate-500 truncate">{user.email}</p>
                    <p className="mt-1 text-[11px] font-mono text-slate-600 uppercase">
                      Role: {user.role.replace('_', ' ')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleNav('user-dashboard')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    User Dashboard
                  </button>

                  {['case_manager', 'admin', 'law_enforcement'].includes(user.role) && (
                    <button
                      onClick={() => handleNav('case-management')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      Case Coordinator Hub
                    </button>
                  )}

                  {['admin', 'law_enforcement'].includes(user.role) && (
                    <button
                      onClick={() => handleNav('admin-dashboard')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-900 font-medium flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                      Admin & Moderation
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                      handleNav('home');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('signin')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 text-sm font-medium">
          <button
            onClick={() => handleNav('cases')}
            className="block w-full text-left px-3 py-2 rounded text-slate-700 hover:bg-slate-100"
          >
            Missing Cases
          </button>
          <button
            onClick={() => handleNav('report-sighting')}
            className="block w-full text-left px-3 py-2 rounded text-slate-700 hover:bg-slate-100"
          >
            Report Sighting
          </button>
          <button
            onClick={() => handleNav('image-analysis')}
            className="block w-full text-left px-3 py-2 rounded text-slate-700 hover:bg-slate-100"
          >
            Image Inspector
          </button>
          <button
            onClick={() => handleNav('submit-case')}
            className="block w-full text-left px-3 py-2 rounded text-slate-700 hover:bg-slate-100"
          >
            Lawful Intake
          </button>
          <button
            onClick={() => handleNav('help-privacy')}
            className="block w-full text-left px-3 py-2 rounded text-slate-700 hover:bg-slate-100"
          >
            Privacy & Protocol
          </button>
          {user && (
            <button
              onClick={() => handleNav('user-dashboard')}
              className="block w-full text-left px-3 py-2 rounded text-slate-700 hover:bg-slate-100"
            >
              My Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
};
