import React, { useState } from 'react';
import { Bell, Search, Stethoscope, Beaker, Zap, Sparkles, CheckCircle2, Salad, Activity, Coffee, ChevronRight, X } from 'lucide-react';
import { useDashboardContext } from '../context/DashboardContext';
import './PCODRiskInsights.css';

const PCODRiskInsights = () => {
  const { dashboardData, isDashboardLoading } = useDashboardContext();
  const { pcodInsights } = dashboardData || {};

  const [expandedSection, setExpandedSection] = useState(null);   // 'risk' | 'androgen' | 'metabolic'
  const [expandedProtocol, setExpandedProtocol] = useState(null); // 'nutrition' | 'movement' | 'lifestyle'
  const [searchQuery, setSearchQuery] = useState('');

  const SEARCH_MAP = {
    risk:      ['risk', 'pcod', 'baseline', 'scores', 'diagnostic', 'summary', 'understanding'],
    androgen:  ['androgen', 'skin', 'acne', 'testosterone', 'hair', 'sensitivity', 'receptors'],
    metabolic: ['metabolic', 'insulin', 'sugar', 'shift', 'glucose', 'weight', 'resistance'],
    nutrition: ['nutrition', 'diet', 'food', 'meal', 'protocol', 'eating', 'probiotics', 'low-gi'],
    movement:  ['movement', 'exercise', 'workout', 'training', 'hiit', 'walking', 'yoga'],
    lifestyle: ['lifestyle', 'sleep', 'stress', 'journaling', 'cortisol', 'alcohol', 'caffeine']
  };

  const isMatch = (sectionId) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return SEARCH_MAP[sectionId]?.some(keyword => keyword.includes(q)) || sectionId.includes(q);
  };

  const currentSearchActive = searchQuery.trim().length > 0;

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const score = pcodInsights?.score || 40;
  const levelText = pcodInsights?.level || 'Low Baseline';

  // Derive a score-level color for visual cues
  const scoreColor = score >= 75 ? '#dc2626' : score >= 50 ? '#f97316' : '#22c55e';
  const scoreBadgeBg = score >= 75 ? '#fee2e2' : score >= 50 ? '#ffedd5' : '#dcfce7';
  
  // Circumference calculation for SVG r=80 is ~502
  const gaugeMax = 502.6;
  const activeOffset = gaugeMax - ((score / 100) * gaugeMax);
  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      {/* TopNavBar mapped into component view to maintain proper structure outside the global App header */}
      <header className="insights-top-nav">
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#a0aec0" style={{ position: 'absolute', top: '50%', left: '0.8rem', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search insights..." 
            className="search-input" 
            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="icon-btn" style={{ padding: '0.5rem', color: '#db2777' }}>
            <Bell size={20} />
          </button>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPu3ovXfib6WnUBWiuDYarNGGlCq-eryY_2VoKdh9S_wyqB4uKJzjNs524T0ZauaMVOL5w1J6yDs8kMoXiohwFFLyLmh-y6rYytmkPfV0Pd5jwla3nLxArKe-yX5ua7EFahM-hWMwuzLAsgveBWMO1QTorjhBq79p6U65JPnW69p7WfN_nZO8e7aduvZPq_90N9Spqttg1dPJXmcXWkqiBziWMbIvF7EbSRusvX2DhPMRPOHPrV5w9yNoa5NKRYCj2SG8oufUadNay" 
            alt="Profile" 
            style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #e040a0' }} 
          />
        </div>
      </header>

      <div className="insights-container fade-in">
        {/* Page Header */}
        <div className="insights-header">
          <h2 className="insights-title">PCOD Insights</h2>
          <p className="insights-subtitle">Deep dive into your hormonal health and metabolic profile.</p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          
          {/* Risk Score Gauge — key forces re-animation when score changes */}
          <div key={`gauge-${score}`} className={`bento-card span-4 risk-gauge-card insights-refresh ${currentSearchActive && !isMatch('risk') ? 'dim-on-search' : isMatch('risk') && currentSearchActive ? 'highlight-on-search' : ''}`}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', zIndex: 10 }}>Current Risk Score</h3>
            <div className="gauge-wrapper">
              <svg className="gauge-svg" viewBox="0 0 192 192">
                <circle className="gauge-bg" cx="96" cy="96" r="80" />
                <circle className="gauge-track" cx="96" cy="96" r="80" strokeDasharray={gaugeMax} strokeDashoffset={activeOffset} strokeLinecap="round" strokeWidth="12" stroke={scoreColor} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s ease' }} />
              </svg>
              <div className="gauge-center-text">
                <span style={{ fontSize: '3rem', fontWeight: 900, color: scoreColor, lineHeight: 1, transition: 'color 0.5s ease' }}>{score}%</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#604868', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{levelText}</span>
              </div>
            </div>
            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: scoreBadgeBg, color: scoreColor, marginBottom: '0.75rem', zIndex: 10 }}>
              {score >= 75 ? '⚠️ Elevated — consult your doctor' : score >= 50 ? '⚡ Monitor closely' : '✅ Within healthy range'}
            </span>
            <p style={{ fontSize: '0.875rem', color: '#604868', padding: '0 1rem', zIndex: 10 }}>
              Based on your recent follicular phase data and symptom tracking.
            </p>
          </div>

          {/* AI Diagnostic Summary — key forces re-mount on score change */}
          <div
            key={`summary-${score}`}
            className={`bento-card span-8 card-l-border-pink insights-refresh insight-clickable ${currentSearchActive && !isMatch('risk') ? 'dim-on-search' : isMatch('risk') && currentSearchActive ? 'highlight-on-search' : ''}`}
            onClick={() => toggleSection('risk')}
            role="button" aria-expanded={expandedSection === 'risk'}
          >
            <div className="card-icon-header">
              <div className="icon-box icon-pink"><Stethoscope size={24} /></div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2e1a28' }}>Understanding Your Risk</h3>
                <p style={{ fontSize: '0.875rem', color: '#604868' }}>AI-Driven Diagnostic Summary</p>
              </div>
              <ChevronRight size={20} color="#e040a0" style={{ transform: expandedSection === 'risk' ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease', flexShrink: 0 }} />
            </div>
            <p style={{ fontSize: '0.95rem', color: '#604868', lineHeight: 1.6, marginBottom: '1rem' }}>
              {pcodInsights?.summary || 'Your basal metabolic rates currently track as highly normalized.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(pcodInsights?.tags || ['Stable Cycle']).map((tag, i) => (
                  <span key={i} className={`pill-tag ${i%2===0 ? 'pill-purple' : 'pill-blue'}`}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Androgen Sensitivity — key forces re-mount on score change */}
          <div
            key={`androgen-${score}`}
            className={`bento-card span-6 card-l-border-purple insights-refresh insight-clickable ${currentSearchActive && !isMatch('androgen') ? 'dim-on-search' : isMatch('androgen') && currentSearchActive ? 'highlight-on-search' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => toggleSection('androgen')}
            role="button" aria-expanded={expandedSection === 'androgen'}
          >
            <div>
              <div className="card-icon-header">
                <div className="icon-box icon-purple"><Beaker size={24} /></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2e1a28', alignSelf: 'center', flex: 1 }}>Androgen Sensitivity</h3>
                <ChevronRight size={18} color="#7c52aa" style={{ transform: expandedSection === 'androgen' ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }} />
              </div>
              <p style={{ color: '#604868', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                {pcodInsights?.androgenText || 'Your androgen receptor activity is sitting squarely within safe standard deviations.'}
              </p>
            </div>
            <div className="recommendation-box">
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Recommendation</span>
              <span className="rec-pill rec-purple">{pcodInsights?.androgenRec || 'Hydration Focus'}</span>
            </div>
          </div>

          {/* Metabolic Shift — key forces re-mount on score change */}
          <div
            key={`metabolic-${score}`}
            className={`bento-card span-6 card-l-border-blue insights-refresh insight-clickable ${currentSearchActive && !isMatch('metabolic') ? 'dim-on-search' : isMatch('metabolic') && currentSearchActive ? 'highlight-on-search' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => toggleSection('metabolic')}
            role="button" aria-expanded={expandedSection === 'metabolic'}
          >
            <div>
              <div className="card-icon-header">
                <div className="icon-box icon-blue"><Zap size={24} /></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2e1a28', alignSelf: 'center', flex: 1 }}>Metabolic Shift</h3>
                <ChevronRight size={18} color="#0096cc" style={{ transform: expandedSection === 'metabolic' ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }} />
              </div>
              <p style={{ color: '#604868', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                {pcodInsights?.metabolicText || 'Your underlying insulin sensitivity mechanics exhibit no major deterministic signs of severe disruption.'}
              </p>
            </div>
            <div className="recommendation-box">
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Recommendation</span>
              <span className="rec-pill rec-blue">{pcodInsights?.metabolicRec || 'Standard Macros'}</span>
            </div>
          </div>

          {/* ─── Expandable Detail Drawer ─────────────────────────────────── */}
          {expandedSection && (() => {
            const sectionMap = {
              risk:     { title: 'Understanding Your Risk',  icon: <Stethoscope size={22} color="#e040a0" />, accent: '#e040a0', bg: '#fff0f8', details: pcodInsights?.riskDetails },
              androgen: { title: 'Androgen Sensitivity',     icon: <Beaker size={22} color="#7c52aa" />,      accent: '#7c52aa', bg: '#f5f0ff', details: pcodInsights?.androgenDetails },
              metabolic:{ title: 'Metabolic Shift',          icon: <Zap size={22} color="#0096cc" />,         accent: '#0096cc', bg: '#f0f8ff', details: pcodInsights?.metabolicDetails },
            };
            const { title, icon, accent, bg, details } = sectionMap[expandedSection];
            return (
              <div key={expandedSection} className="span-12 detail-drawer insights-refresh">
                <div style={{ backgroundColor: bg, borderRadius: '1.5rem', padding: '2rem', borderLeft: `4px solid ${accent}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {icon}
                      <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#2e1a28' }}>{title} — Detailed View</h3>
                    </div>
                    <button onClick={() => setExpandedSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#604868', padding: '0.25rem' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: '0.5rem' }}>What's Happening</p>
                    <p style={{ fontSize: '0.95rem', color: '#604868', lineHeight: 1.7 }}>{details?.what || 'Loading personalized details...'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: '0.75rem' }}>How to Manage</p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', padding: 0 }}>
                      {(details?.tips || []).map((tip, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', color: '#2e1a28', fontWeight: 500, background: 'rgba(255,255,255,0.6)', padding: '0.6rem 1rem', borderRadius: '0.75rem', backdropFilter: 'blur(6px)' }}>
                          <span style={{ flexShrink: 0, fontSize: '1.1rem' }}>{tip.slice(0, 2)}</span>
                          <span>{tip.slice(2).trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="span-12" style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e1a28', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={24} color="#e040a0" /> Personalized Protocol
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '1.5rem', fontStyle: 'italic' }}>Tap a card to see your personalised guidance — updates with every log.</p>
            <div className="protocol-grid">

              {/* Nutrition */}
              {[{  
                  key: 'nutrition',
                  label: 'Nutrition',
                  icon: <Salad size={140} color="#e040a0" />,
                  iconSm: <Salad size={22} color="#e040a0" />,
                  cardClass: 'protocol-card-pink',
                  accent: '#e040a0',
                  data: pcodInsights?.protocol?.nutrition
                }, {
                  key: 'movement',
                  label: 'Movement',
                  icon: <Activity size={140} color="#7c52aa" />,
                  iconSm: <Activity size={22} color="#7c52aa" />,
                  cardClass: 'protocol-card-purple',
                  accent: '#7c52aa',
                  data: pcodInsights?.protocol?.movement
                }, {
                  key: 'lifestyle',
                  label: 'Lifestyle',
                  icon: <Coffee size={140} color="#0096cc" />,
                  iconSm: <Coffee size={22} color="#0096cc" />,
                  cardClass: 'protocol-card-blue',
                  accent: '#0096cc',
                  data: pcodInsights?.protocol?.lifestyle
                }
              ].map(({ key, label, icon, iconSm, cardClass, accent, data }) => (
                <div key={`${key}-${score}`} className={`protocol-card ${cardClass} insight-clickable ${currentSearchActive && !isMatch(key) ? 'dim-on-search' : isMatch(key) && currentSearchActive ? 'highlight-on-search' : ''}`}
                  onClick={() => setExpandedProtocol(prev => prev === key ? null : key)}
                  role="button" aria-expanded={expandedProtocol === key}
                >
                  <div className="protocol-bg-icon">{icon}</div>
                  <div className="protocol-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: accent, fontWeight: 900, fontSize: '1.125rem' }}>{label}</h4>
                      <ChevronRight size={16} color={accent} style={{ transform: expandedProtocol === key ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }} />
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#2e1a28', marginBottom: '1rem' }}>
                      {data?.summary || `Focus on ${label.toLowerCase()} strategies tailored to your cycle.`}
                    </p>
                    <div className="check-list">
                      {(data?.items || []).map((item, i) => (
                        <span key={i} className="check-item">
                          <CheckCircle2 size={16} color={accent} style={{ flexShrink: 0 }} /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Protocol Detail Drawer */}
            {expandedProtocol && (() => {
              const protoMap = {
                nutrition: { title: 'Nutrition Detail', accent: '#e040a0', bg: '#fff0f8', data: pcodInsights?.protocol?.nutrition },
                movement:  { title: 'Movement Detail',  accent: '#7c52aa', bg: '#f5f0ff', data: pcodInsights?.protocol?.movement },
                lifestyle: { title: 'Lifestyle Detail', accent: '#0096cc', bg: '#f0f8ff', data: pcodInsights?.protocol?.lifestyle },
              };
              const { title, accent, bg, data } = protoMap[expandedProtocol];
              return (
                <div key={expandedProtocol} className="detail-drawer insights-refresh" style={{ marginTop: '1.25rem' }}>
                  <div style={{ backgroundColor: bg, borderRadius: '1.5rem', padding: '2rem', borderLeft: `4px solid ${accent}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2e1a28' }}>💬 Why this matters for you</h3>
                      <button onClick={() => setExpandedProtocol(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#604868' }}>
                        <X size={20} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: '#604868', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                      {data?.details || 'Your personalised details are loading...'}
                    </p>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: '0.75rem' }}>Your Action Checklist</p>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                        {(data?.items || []).map((item, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#2e1a28', fontWeight: 600, background: 'rgba(255,255,255,0.65)', padding: '0.65rem 1rem', borderRadius: '0.75rem' }}>
                            <CheckCircle2 size={16} color={accent} style={{ flexShrink: 0 }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PCODRiskInsights;
