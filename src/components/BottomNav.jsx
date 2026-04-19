import React from 'react';
import { Home, HeartPulse, Sparkles, MessagesSquare } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Tracker' },
    { id: 'insights', icon: HeartPulse, label: 'Insights' },
    { id: 'recommendations', icon: Sparkles, label: 'Tips' },
    { id: 'community', icon: MessagesSquare, label: 'Space' },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="icon-wrapper">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
