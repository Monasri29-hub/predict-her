import React from 'react';
import { LayoutDashboard, Activity, Users, Sparkles, Plus, User, Sparkle } from 'lucide-react';
import './SidebarNav.css';

const NAV_ITEMS = [
  { id: 'dashboard',       icon: LayoutDashboard, label: 'Dashboard'       },
  { id: 'insights',        icon: Activity,        label: 'Insights'        },
  { id: 'community',       icon: Users,           label: 'Community'       },
  { id: 'recommendations', icon: Sparkles,        label: 'Tips'            },
  { id: 'skincare',        icon: Sparkle,          label: 'Skin Care'       },
  { id: 'profile',         icon: User,            label: 'My Profile'      },
];

const SidebarNav = ({ activeTab, setActiveTab, openLogModal }) => (
  <>
    {/* ── Desktop sidebar ─────────────────────────────────────────── */}
    <aside className="snav-aside">
      <div className="snav-brand">
        <h1>Predict Her</h1>
        <p>Your Cycle, Your Power</p>
      </div>

      <nav className="snav-nav">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            data-id={id}
            className={`snav-btn${activeTab === id ? ' snav-active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="snav-footer">
        <button className="snav-log-btn" onClick={() => openLogModal?.('symptoms')}>
          <Plus size={20} strokeWidth={3} />
          Log Symptoms
        </button>
      </div>
    </aside>

    {/* ── Mobile bottom tab bar ───────────────────────────────────── */}
    <nav className="snav-mobile-bar" role="navigation" aria-label="Main navigation">
      {/* First two tabs */}
      {NAV_ITEMS.slice(0, 2).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`snav-tab${activeTab === id ? ' snav-active' : ''}`}
          onClick={() => setActiveTab(id)}
          aria-label={label}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}

      {/* Centre log button */}
      <div className="snav-tab-log">
        <button
          className="snav-tab-log-circle"
          onClick={() => openLogModal?.('symptoms')}
          aria-label="Log Symptoms"
        >
          <Plus size={22} color="#fff" strokeWidth={3} />
        </button>
        <span>Log</span>
      </div>

      {/* Last three tabs */}
      {NAV_ITEMS.slice(2).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`snav-tab${activeTab === id ? ' snav-active' : ''}`}
          onClick={() => setActiveTab(id)}
          aria-label={label}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  </>
);

export default SidebarNav;
