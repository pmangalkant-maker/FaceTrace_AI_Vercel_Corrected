import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { EmergencyBanner } from './components/layout/EmergencyBanner';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { CasesSearchPage } from './pages/CasesSearchPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { ReportSightingPage } from './pages/ReportSightingPage';
import { SubmitCasePage } from './pages/SubmitCasePage';
import { SignInPage } from './pages/SignInPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { CaseManagementPage } from './pages/CaseManagementPage';
import { ImageAnalysisPage } from './pages/ImageAnalysisPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { HelpPrivacyPage } from './pages/HelpPrivacyPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // Handle URL hash changes for deep linking support
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (!hash) return;

      const [route, param] = hash.split('/');
      if (route) {
        setCurrentTab(route);
        if (param) setSelectedCaseId(param);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (tab: string, caseIdOrQuery?: string) => {
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tab === 'case-detail' && caseIdOrQuery) {
      setSelectedCaseId(caseIdOrQuery);
      setCurrentTab('case-detail');
      window.location.hash = `case-detail/${caseIdOrQuery}`;
      return;
    }

    if (tab === 'cases') {
      if (caseIdOrQuery) {
        setSearchInitialQuery(caseIdOrQuery);
      }
      setSelectedCaseId(undefined);
      setCurrentTab('cases');
      window.location.hash = 'cases';
      return;
    }

    if (tab === 'report-sighting' && caseIdOrQuery) {
      setSelectedCaseId(caseIdOrQuery);
      setCurrentTab('report-sighting');
      window.location.hash = `report-sighting/${caseIdOrQuery}`;
      return;
    }

    setSelectedCaseId(undefined);
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <EmergencyBanner />
          <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

          <main className="flex-1">
            {currentTab === 'home' && <HomePage onNavigate={handleNavigate} />}

            {currentTab === 'cases' && (
              <CasesSearchPage
                initialQuery={searchInitialQuery}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'case-detail' && selectedCaseId && (
              <CaseDetailPage
                caseId={selectedCaseId}
                onNavigate={handleNavigate}
                onBack={() => handleNavigate('cases')}
              />
            )}

            {currentTab === 'report-sighting' && (
              <ReportSightingPage
                initialCaseId={selectedCaseId}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'submit-case' && (
              <SubmitCasePage onNavigate={handleNavigate} />
            )}

            {currentTab === 'signin' && (
              <SignInPage
                onNavigate={handleNavigate}
                onSuccess={() => handleNavigate('user-dashboard')}
              />
            )}

            {currentTab === 'register' && (
              <RegisterPage
                onNavigate={handleNavigate}
                onSuccess={() => handleNavigate('user-dashboard')}
              />
            )}

            {currentTab === 'user-dashboard' && (
              <UserDashboardPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'case-management' && (
              <CaseManagementPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'image-analysis' && (
              <ImageAnalysisPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'notifications' && (
              <NotificationsPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'help-privacy' && <HelpPrivacyPage />}

            {currentTab === 'admin-dashboard' && (
              <AdminDashboardPage onNavigate={handleNavigate} />
            )}
          </main>

          <Footer onNavigate={handleNavigate} />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
