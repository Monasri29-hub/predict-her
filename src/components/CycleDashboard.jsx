import React from 'react';
import { Droplet, Moon, Activity } from 'lucide-react';

const CycleDashboard = () => {
  const dates = [
    { day: 'Mon', num: 10, active: false },
    { day: 'Tue', num: 11, active: false },
    { day: 'Wed', num: 12, active: true },
    { day: 'Thu', num: 13, active: false },
    { day: 'Fri', num: 14, active: false },
    { day: 'Sat', num: 15, active: false },
  ];

  return (
    <div className="fade-in">
      <div className="date-scroller">
        {dates.map((d, i) => (
          <div key={i} className={`date-bubble ${d.active ? 'active' : ''}`}>
            <span className="day-name">{d.day}</span>
            <span className="day-num">{d.num}</span>
          </div>
        ))}
      </div>

      <div className="glass-card flex flex-col items-center">
        <div className="ring-container">
          <svg className="svg-ring w-full h-full" viewBox="0 0 160 160">
            <circle className="svg-ring-bg" cx="80" cy="80" r="70" />
            <circle className="svg-ring-progress" cx="80" cy="80" r="70" />
          </svg>
          <div className="ring-text">
            <div className="ring-title">Day 14</div>
            <div className="ring-subtitle">Ovulation</div>
          </div>
        </div>
        <p className="text-sm mt-4 text-center font-medium" style={{ color: "var(--text-light)" }}>
          High chance of getting pregnant today. Stay hydrated!
        </p>
      </div>

      <h2 className="section-title">Today's Log</h2>
      <div style={{ padding: '0 1.5rem', display: 'flex', gap: '1rem', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <div className="glass-card flex-col items-center justify-center p-4" style={{ flex: '0 0 100px', margin: 0 }}>
          <Droplet color="#ff8eaa" className="mb-2" />
          <span className="text-xs font-semibold">Flow</span>
          <span className="text-xs text-light" style={{color: 'var(--text-light)'}}>Light</span>
        </div>
        <div className="glass-card flex-col items-center justify-center p-4" style={{ flex: '0 0 100px', margin: 0 }}>
          <Activity color="#add8e6" className="mb-2" />
          <span className="text-xs font-semibold">Mood</span>
          <span className="text-xs text-light" style={{color: 'var(--text-light)'}}>Calm</span>
        </div>
        <div className="glass-card flex-col items-center justify-center p-4" style={{ flex: '0 0 100px', margin: 0 }}>
          <Moon color="#b19cd9" className="mb-2" />
          <span className="text-xs font-semibold">Sleep</span>
          <span className="text-xs text-light" style={{color: 'var(--text-light)'}}>7.5 hrs</span>
        </div>
      </div>
    </div>
  );
};

export default CycleDashboard;
