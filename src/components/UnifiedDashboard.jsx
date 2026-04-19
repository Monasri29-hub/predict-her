import React, { useState } from 'react';
import { Bell, Repeat, Smile, CalendarDays, Droplets, SmilePlus, Pill, Moon, Star, Loader2, Thermometer, Utensils, Zap, Sparkles, Cherry, CheckCircle2 } from 'lucide-react';
import { fetchArticleMetadata } from '../services/api';
import { useDashboardContext } from '../context/DashboardContext';
import ArticleView from './ArticleView';
import CalendarModal from './CalendarModal';
import HistoryModal from './HistoryModal';
import './UnifiedDashboard.css';

const UnifiedDashboard = ({ openLogModal, onUpdateCycle }) => {
  const { dashboardData, isDashboardLoading } = useDashboardContext();
  const [viewingArticleId, setViewingArticleId] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleReadArticle = async (id) => {
      if (!id) return;
      try {
          setArticleLoading(true);
          const res = await fetchArticleMetadata(id);
          if (res.data.url) {
              window.open(res.data.url, '_blank', 'noopener,noreferrer');
          } else {
              setViewingArticleId(id);
          }
      } catch (e) {
          console.error("Failed to prepare article", e);
      } finally {
          setArticleLoading(false);
      }
  };

  if (viewingArticleId) {
      return <ArticleView articleId={viewingArticleId} onBack={() => setViewingArticleId(null)} />;
  }

  // Display full-screen loader layout if Context hasn't populated initial payload
  if (isDashboardLoading && !dashboardData) {
      return (
          <main className="dash-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#e040a0' }}>
                  <Loader2 className="animate-spin" size={48} />
                  <p style={{ marginTop: '1rem', fontWeight: 600 }}>Syncing your cycle...</p>
              </div>
          </main>
      );
  }

  // Destructure safely from context
  const { profile, upcomingDates, cycleProgress, streak, recommendation, consistencyGraph, ritualStreaks, ritualCompletions } = dashboardData || {};

  // Mathematically calculate dynamic Donut SVG positioning based on context progress
  const currentDay = cycleProgress?.currentDay || 14;
  const totalDays = cycleProgress?.totalDays || 28;
  const donutMaxStroke = 283;
  
  // Offset mathematically bounds: 283 = 0% filled ring. 0 = 100% full ring.
  const activeOffset = donutMaxStroke - ((currentDay / totalDays) * donutMaxStroke);

  return (
    <main className="dash-layout fade-in" style={{ opacity: isDashboardLoading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
      {/* Center Content */}
      <div className="dash-center">
        <header className="dash-header">
          <div>
            <h2 className="dash-welcome">Welcome back, {profile?.name || 'there'} 👋</h2>
            <p className="dash-subtitle">
              <span style={{ color: '#7c52aa', fontWeight: 700 }}>{upcomingDates?.cyclePhase} Phase</span>
              {' • Cycle Day '}<span style={{ color: '#e040a0', fontWeight: 700 }}>{currentDay}</span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button className="update-cycle-pill" onClick={onUpdateCycle} title="Update Cycle & Lifestyle">
              <CalendarDays size={18} />
              <span>Update Cycle Info</span>
            </button>
            <div className="profile-wrapper">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI3pBNp1lx7njw7bXQs9rsNrNn7IF0T84oHj8RnuMhD27zZrBD9g3-yNrA4K1VOoM1Z6ao8UDtttsYcqY1BJI1E11DLDsNID_fqn0_KzpjGQGWLq25ghlbUnI2KsT4IE5N6z-Sl_UmglnPznPiGsPckJE4uJlKVLTdRHm402UKGUR4hbGoiU3S5l8mhBpyG21gcYNFfPWhNkt3OvTTrlVWNiDGCGD7bEmkWyMRI_5yEjky413NXqVcPnkB2DJqJTfeYC-RF8Z3Arfu" alt="Profile" />
            </div>
          </div>
        </header>

        {/* Cycle Tracking Visual */}
        <section className="cycle-section">
          {/* Donut Chart */}
          <div className="donut-card">
            <div className="donut-wrapper">
              <svg className="donut-svg">
                <circle cx="50%" cy="50%" fill="transparent" r="45%" stroke="#f8eef8" strokeWidth="24"></circle>
                <circle cx="50%" cy="50%" fill="transparent" r="45%" stroke="#e040a0" strokeDasharray={donutMaxStroke} strokeDashoffset={activeOffset} strokeLinecap="round" strokeWidth="24" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}></circle>
              </svg>
              <div className="donut-text">
                <span className="donut-number">{currentDay}</span>
                <span className="donut-label">Day of {totalDays}</span>
              </div>
            </div>
            {/* Legend */}
            <div className="donut-legend">
              <div className="legend-item"><span className="dot dot-pink"></span> Phase progress</div>
              <div className="legend-item"><span className="dot dot-purple"></span> Peak Fertility</div>
            </div>
          </div>

          {/* Vertical Metrcs */}
          <div className="metrics-col">
            <div className="metric-card metric-pink">
              <Repeat size={24} color="#e040a0" style={{ marginBottom: '0.5rem' }} />
              <h4 className="metric-title" style={{ color: '#a02070' }}>Cycle Length</h4>
              <p className="metric-value text-black">{totalDays} Days</p>
              <div className="metric-tag tag-pink">Highly Regular</div>
            </div>

            <div className="metric-card metric-purple">
              <Smile size={24} color="#7c52aa" style={{ marginBottom: '0.5rem' }} />
              <h4 className="metric-title" style={{ color: '#4a3068' }}>Mood & Stress</h4>
              <p className="metric-value" style={{ color: '#2e2040' }}>{profile?.stressLevel || 'Moderate'}</p>
              <p className="metric-subtitle">
                {profile?.stressLevel === 'Very High' ? 'Prioritise rest & cortisol reset' :
                 profile?.stressLevel === 'High'      ? 'Mindful breathing recommended' :
                 profile?.stressLevel === 'Low'       ? 'Balanced energy levels' :
                                                        'Manageable stress levels'}
              </p>
            </div>
          </div>
        </section>

        {/* Consistency Graph & Calendar Section */}
        <section className="bottom-grid">
          {/* Consistency Graph */}
          <div className="bottom-card">
            <div className="card-top">
              <h3 className="card-title">Consistency Graph</h3>
              <button 
                className="blue-link" 
                onClick={() => setIsHistoryOpen(true)}
                style={{ background: 'transparent', border: 'none', outline: 'none' }}
              >
                View History
              </button>
            </div>
            <div className="graph-bars">
              {(consistencyGraph || []).map((bar, i) => (
                <div key={i} className="graph-bar-wrapper group">
                  <div className="tooltip-hover-text">{bar.p}% consistency in {bar.l}</div>
                  <div className="bar-bg" style={{ height: bar.h1 }}>
                     <div className="bar-fill" style={{ height: bar.h2 }}></div>
                  </div>
                  <span className="bar-label">{bar.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Calendar View */}
          <div className="bottom-card">
            <div className="card-top">
              <h3 className="card-title">Upcoming Dates</h3>
              <button 
                  className="calendar-action" 
                  onClick={() => setIsCalendarOpen(true)}
                  title="Open Calendar"
              >
                  <CalendarDays size={20} color="#e040a0" />
              </button>
            </div>
            <div className="dates-grid">
              <div className="date-card pink">
                <h3>Next Period</h3>
                <p>{upcomingDates.nextPeriod}</p>
              </div>
              <div className="date-card blue">
                <h3>Fertile Window</h3>
                <p>{upcomingDates.fertileWindow}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Panel */}
      <aside className="dash-aside">
        {/* Daily Empowerment */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 className="aside-title">Daily Empowerment</h3>
          <div className="empowerment-card">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYowUx4_k_MmNabEfXqUAl2HmmeCySMW2gDfJICLcsz0Gt_EnKab2_vHHV-BShe3HLOazRK5eQ-fi7MgT738_BMpkGuhISvtChxd2BF_kxskuX3TXaWJFT2xDWzO3vgih6jElg-2b8XJl0Qg_3Hp9Ilvz67o-LXxypNg-GkdRe_E_UorbBCTF4Udcl_A5W4LYyMOCwbQ9hla-h4fYYFJx5OIq5jyKZQOmAQDZ-NLEHazoFEH1ZamZoCi9C0t4WP7WVQdOnBKPlOgcs" alt="Empowerment" className="empowerment-img" />
            <div className="empowerment-overlay">
              <span className="empowerment-tag" style={{ textTransform: 'uppercase' }}>{recommendation.tipTitle}</span>
              <h4 className="empowerment-text">{recommendation.tipText}</h4>
              <button 
                  className="empowerment-btn" 
                  onClick={() => handleReadArticle(recommendation.articleId)}
                  disabled={articleLoading || !recommendation.articleId}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                  {articleLoading && <Loader2 className="animate-spin" size={16} />}
                  Read Article
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 className="aside-title">Quick Actions</h3>
          <div className="actions-grid">
            {[ 
              { icon: <Droplets size={24} />, id: 'flow', c: '#e040a0', bg: '#fce8f3', t: 'Track Flow' },
              { icon: <SmilePlus size={24} />, id: 'mood', c: '#7c52aa', bg: '#f3e8ff', t: 'Log Mood' },
              { icon: <Pill size={24} />, id: 'meds', c: '#0096cc', bg: '#e0f2fe', t: 'Medications' },
              { icon: <Moon size={24} />, id: 'sleep', c: '#f97316', bg: '#ffedd5', t: 'Sleep Stats' },
              { icon: <Thermometer size={24} />, id: 'symptoms', c: '#d946ef', bg: '#fdf4ff', t: 'Log Symptoms' }
            ].map((act, i) => (
              <button key={i} className="action-btn" onClick={() => openLogModal(act.id)}>
                <div className="action-icon-wrap" style={{ backgroundColor: act.bg, color: act.c }}>
                  {act.icon}
                </div>
                <span className="action-txt">{act.t}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Ritual Streaks */}
        <div className="ritual-streaks-section">
          <h3 className="aside-title">Ritual Streaks</h3>
          <div className="rituals-mini-grid">
            {[
              { id: 'nutrition', label: 'Nutrition', icon: <Utensils size={18} />, color: '#a02070', bg: '#fce8f3' },
              { id: 'movement',  label: 'Movement',  icon: <Zap size={18} />,      color: '#7c52aa', bg: '#f3e8ff' },
              { id: 'lifestyle', label: 'Lifestyle', icon: <Sparkles size={18} />, color: '#0096cc', bg: '#e0f2fe' },
              { id: 'skincare',  label: 'Skin Care', icon: <Cherry size={18} />,    color: '#e040a0', bg: '#fdf4ff' }
            ].map(rit => (
              <div key={rit.id} className={`ritual-streak-item ${ritualCompletions?.[rit.id] ? 'ritual-active' : ''}`}>
                <div className="ritual-streak-icon" style={{ backgroundColor: rit.bg, color: rit.color }}>
                  {rit.icon}
                </div>
                <div className="ritual-streak-info">
                  <span className="ritual-streak-label">{rit.label}</span>
                  <span className="ritual-streak-days">{ritualStreaks?.[rit.id] || 0}d</span>
                </div>
                {ritualCompletions?.[rit.id] && <CheckCircle2 size={14} className="ritual-check" />}
              </div>
            ))}
          </div>
          <div className="global-streak-footer">
            <Star size={16} fill="#ffb400" stroke="#ffb400" />
            <span>Total Consistency: <strong>{streak} Days</strong></span>
          </div>
        </div>
      </aside>

      <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={() => setIsCalendarOpen(false)} 
          upcomingDates={upcomingDates} 
      />

      <HistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
      />
    </main>
  );
};

export default UnifiedDashboard;
