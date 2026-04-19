import { useState, useEffect } from 'react';
import './App.css';
import SidebarNav from './components/SidebarNav';
import UnifiedDashboard from './components/UnifiedDashboard';
import PCODRiskInsights from './components/PCODRiskInsights';
import Recommendations from './components/Recommendations';
import CommunityMode from './components/CommunityMode';
import Profile from './components/Profile';
import LogModal from './components/LogModal';
import Login from './components/Login';
import Signup from './components/Signup';
import Splash from './components/Splash';
import OnboardingModal from './components/OnboardingModal';
import { subscribeToAuthChanges, logoutUser } from './services/firebase';
import { fetchProfile, fetchTipsAction, logRitual } from './services/api';
import { DashboardProvider, useDashboardContext } from './context/DashboardContext';
import SkinCare from './components/SkinCare';

// ─── App Shell Component (Uses Context) ──────────────────────────────
function AppShell({ onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logModalMode, setLogModalMode] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { dashboardData } = useDashboardContext();

  const handleTipsAction = async (tipId) => {
    try {
      const res = await fetchTipsAction(tipId);
      const action = res.data;

      if (action.type === 'action') {
        showToast(`Tip ritual logged: ${action.ritualId}. Redirecting...`);
        await logRitual(action.category, action.ritualId);
        setTimeout(() => {
           setActiveTab(action.redirect || 'dashboard');
        }, 1000);
      } else if (action.type === 'redirect') {
        setActiveTab(action.target);
      }
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <UnifiedDashboard openLogModal={setLogModalMode} onUpdateCycle={() => setShowUpdateModal(true)} />;
      case 'insights':      return <PCODRiskInsights />;
      case 'recommendations': return <Recommendations showToast={showToast} onTriggerAction={handleTipsAction} />;
      case 'community':     return <CommunityMode showToast={showToast} />;
      case 'profile':       return <Profile showToast={showToast} onLogout={onLogout} />;
      case 'skincare':      return <SkinCare onBack={() => setActiveTab('recommendations')} showToast={showToast} dashboardData={dashboardData} />;
      default:              return <UnifiedDashboard openLogModal={setLogModalMode} onUpdateCycle={() => setShowUpdateModal(true)} />;
    }
  };

  return (
    <div className="web-app-wrapper fade-in">
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} openLogModal={setLogModalMode} />
      <div className="main-content-container" style={{ padding: 0 }}>
        <div className="app-content h-full">
           {renderContent()}
        </div>
      </div>
      {showUpdateModal && (
        <OnboardingModal 
          flowMode="update" 
          showToast={showToast} 
          onComplete={() => setShowUpdateModal(false)} 
        />
      )}
      <LogModal
        isOpen={!!logModalMode}
        mode={logModalMode}
        onClose={() => setLogModalMode(null)}
        showToast={showToast}
      />
    </div>
  );
}

// ─── Main App Wrapper ───────────────────────────────────────────────
function App() {
  const [appState, setAppState] = useState('splash');
  const [user, setUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const minSplashTime = 3500;
    const startTime = Date.now();

    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      const timeElapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minSplashTime - timeElapsed);

      setTimeout(() => {
        if (firebaseUser) {
          setAppState('dashboard');
        } else {
          setAppState('login');
        }
      }, remainingTime);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const { data: profile } = await fetchProfile();
      if (profile && profile.onboarded) setAppState('dashboard');
      else setAppState('onboarding');
    } catch {
      setAppState('dashboard');
    }
  };

  const handleSignupComplete = () => {
    setAppState('onboarding');
  };

  const handleOnboardingComplete = () => {
    setAppState('dashboard');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    showToast('You have logged out successfully. 👋');
    setAppState('login');
  };

  const ToastBanner = () => toastMessage ? (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      background: 'linear-gradient(135deg, #d8b4fe, #c084fc)',
      color: '#2e1a47', padding: '0.85rem 1.75rem',
      borderRadius: '1rem', fontWeight: 700,
      fontFamily: "'Nunito', 'Poppins', sans-serif", fontSize: '0.9rem',
      boxShadow: '0 10px 30px rgba(192,132,252,0.35)',
      zIndex: 400, border: '1px solid rgba(216,180,254,0.4)',
      backdropFilter: 'blur(10px)'
    }}>
      {toastMessage}
    </div>
  ) : null;

  if (appState === 'splash') return <Splash />;
  if (appState === 'login')   return <Login onLogin={handleLogin} onSignup={() => setAppState('signup')} />;
  if (appState === 'signup')  return <Signup onSignup={handleSignupComplete} onBackToLogin={() => setAppState('login')} />;

  if (appState === 'onboarding') {
    return (
      <DashboardProvider userId={user?.uid || 'user-123'}>
        <OnboardingModal showToast={showToast} onComplete={handleOnboardingComplete} />
        <ToastBanner />
      </DashboardProvider>
    );
  }

  return (
    <DashboardProvider userId={user?.uid || 'user-123'}>
      <AppShell onLogout={handleLogout} showToast={showToast} />
      <ToastBanner />
    </DashboardProvider>
  );
}

export default App;
