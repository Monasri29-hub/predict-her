import React, { useState, useMemo } from 'react';
import {
  Droplet, Utensils, Moon, BrainCircuit, Bookmark, BookmarkCheck,
  ArrowRight, CheckCircle2, Lightbulb, Zap, Wind, Flame,
  ChevronDown, ChevronUp, Loader2, Sparkles
} from 'lucide-react';
import { useDashboardContext } from '../context/DashboardContext';
import './Recommendations.css';

// ─── Phase-driven recommendation database ────────────────────────────────────
const PHASE_DATA = {
  Menstrual: {
    heroTitle: 'Rest & Restore',
    heroDesc: 'Your body is shedding and renewing. Honour the pause — deep rest is your most powerful act today.',
    featured: {
      tag: 'Featured Practice',
      title: 'Nourishing Morning Ritual',
      desc: 'Start your day with warmth. A heating pad, raspberry leaf tea, and gentle breath work ease cramps and support your nervous system during menstruation.',
      steps: ['🌡️ Warm Compress on Lower Abdomen', '🍵 Raspberry Leaf or Ginger Tea', '🌬️ 4-7-8 Breathing (3 rounds)'],
      journey: 'Begin Ritual'
    },
    cards: [
      { id: 'iron', icon: 'flame', title: 'Iron Replenishment', desc: 'Blood loss depletes iron. Eat lentils, spinach, or red meat with vitamin C for absorption.', tag: 'Nutrition', color: 'purple' },
      { id: 'heat', icon: 'droplet', title: 'Heat Therapy', desc: 'A warm compress reduces prostaglandin-driven cramping as effectively as ibuprofen.', tag: 'High Priority', color: 'blue' },
      { id: 'rest', icon: 'moon', title: 'Restorative Rest', desc: 'Yoga Nidra or gentle walking — no intense cardio. Let your energy replenish.', tag: 'Movement', color: 'pink' },
    ],
    secrets: [
      { icon: 'lightbulb', color: 's-icon-pink', title: 'Dark Chocolate is Your Friend', desc: 'Magnesium in dark chocolate (70%+) reduces cramps and lifts mood.' },
      { icon: 'moon', color: 's-icon-blue', title: 'Sleep More Than Usual', desc: 'Your melatonin rhythm shifts — honour the extra tiredness.' },
      { icon: 'brain', color: 's-icon-purple', title: 'No Major Decisions Today', desc: 'Brain fog is real in menstruation. Save complex tasks for days 5+.' },
    ]
  },
  Follicular: {
    heroTitle: 'Rise & Build',
    heroDesc: 'Estrogen is climbing and so is your energy. This is your window to start new projects, try new workouts, and absorb new ideas.',
    featured: {
      tag: 'Featured Practice',
      title: 'Energy Activation Ritual',
      desc: 'Harness rising estrogen with a cold shower, protein-rich breakfast, and a brisk walk. Your body is primed for growth and learning.',
      steps: ['🚿 Cold Shower (30-second burst)', '🥚 High-Protein Breakfast', '🚶 20-min Brisk Walk in Sunlight'],
      journey: 'Activate Now'
    },
    cards: [
      { id: 'protein', icon: 'utensils', title: 'Protein Power', desc: 'Support muscle building and estrogen metabolism with eggs, Greek yogurt, and legumes.', tag: 'Nutrition', color: 'purple' },
      { id: 'hiit', icon: 'zap', title: 'High Energy Training', desc: "Your pain tolerance and endurance are peaking. It's your best window for HIIT or strength training.", tag: 'Movement', color: 'blue' },
      { id: 'focus', icon: 'brain', title: 'Deep Focus Work', desc: 'Estrogen boosts dopamine and serotonin. Tackle your most complex tasks and creative work now.', tag: 'Lifestyle', color: 'pink' },
    ],
    secrets: [
      { icon: 'lightbulb', color: 's-icon-pink', title: 'Best Time to Learn New Skills', desc: 'Your hippocampus is more active — language, instruments, and complex subjects stick faster.' },
      { icon: 'zap', color: 's-icon-blue', title: 'Socialise and Network', desc: 'Estrogen makes you more extroverted and articulate. Say yes to those plans.' },
      { icon: 'brain', color: 's-icon-purple', title: 'Experiment with New Foods', desc: 'Your digestion is optimal — try new cuisines and flavours without worry.' },
    ]
  },
  Ovulation: {
    heroTitle: 'Peak & Shine',
    heroDesc: "You're at your most magnetic. Energy, clarity, and communication are all at their highest point. Lead, connect, and create.",
    featured: {
      tag: 'Featured Practice',
      title: 'Peak Performance Ritual',
      desc: 'Ovulation is your biological peak. A power playlist, confidence-boosting outfit, and social connection will amplify your natural energy.',
      steps: ['🎵 Build a Power Playlist', '💬 Schedule Important Conversations', '🌿 Anti-inflammatory Lunch (Salmon + Greens)'],
      journey: 'Peak Today'
    },
    cards: [
      { id: 'antinflam', icon: 'flame', title: 'Anti-Inflammatory Foods', desc: 'LH surge creates mild inflammation. Omega-3s (salmon, walnuts) and turmeric keep you feeling light.', tag: 'Nutrition', color: 'purple' },
      { id: 'strength', icon: 'zap', title: 'Strength & Power', desc: 'Testosterone peaks alongside estrogen. Max effort strength sessions, sprints, and power moves — go for it.', tag: 'Movement', color: 'blue' },
      { id: 'connect', icon: 'brain', title: 'High-Value Connections', desc: 'You are most empathetic and persuasive now. Present, pitch, negotiate, and socialise.', tag: 'Lifestyle', color: 'pink' },
    ],
    secrets: [
      { icon: 'lightbulb', color: 's-icon-pink', title: 'Voice is at Its Most Attractive', desc: 'Studies show vocal pitch and clarity peak at ovulation — public speaking and calls go well.' },
      { icon: 'zap', color: 's-icon-blue', title: 'Risk-Taking Feels Natural', desc: 'Progesterone is low, making you more open to bold decisions. Channel it wisely.' },
      { icon: 'brain', color: 's-icon-purple', title: 'Hydrate Extra Today', desc: 'Ovulation slightly raises body temperature — increase water intake by 500ml.' },
    ]
  },
  Luteal: {
    heroTitle: 'Your Daily Glow',
    heroDesc: 'As your energy naturally dips, it is time to embrace the slow burn. Nurture your body with warmth and grounding rituals today.',
    featured: {
      tag: 'Featured Practice',
      title: 'Morning Grounding Ritual',
      desc: 'Start your day with a grounding meditation and a warm cup of raspberry leaf tea. This ritual supports your luteal phase by calming the nervous system and easing PMS symptoms.',
      steps: ['🌬️ 5 Minutes Box Breathing', '🥗 Magnesium-rich Breakfast', '📓 Intentional Journaling (5 min)'],
      journey: 'Begin Ritual'
    },
    cards: [
      { id: 'hydration', icon: 'droplet', title: 'Hydration Boost', desc: 'Progesterone affects fluid balance. Aim for 2.5L today with added electrolytes.', tag: 'High Priority', color: 'blue' },
      { id: 'slowburn', icon: 'utensils', title: 'Slow Burn Nutrition', desc: 'Focus on complex carbs like sweet potatoes and oats to stabilise blood sugar and mood.', tag: 'Nutrition', color: 'purple' },
      { id: 'yoga', icon: 'wind', title: 'Gentle Yoga Flow', desc: 'A 15-minute restorative flow will ease lower back tension and improve sleep quality.', tag: 'Movement', color: 'pink' },
    ],
    secrets: [
      { icon: 'lightbulb', color: 's-icon-pink', title: 'Magnesium is Magic', desc: 'Boost intake to reduce cramps and improve sleep during this phase.' },
      { icon: 'moon', color: 's-icon-blue', title: 'Early Bedtime', desc: 'Your body temperature is higher now; try to sleep in a cooler room.' },
      { icon: 'brain', color: 's-icon-purple', title: 'Mindful Boundaries', desc: "It's okay to say no. Prioritise your mental space this week." },
    ]
  }
};

const ICON_MAP = {
  droplet: <Droplet size={24} />,
  utensils: <Utensils size={24} />,
  moon: <Moon size={24} />,
  brain: <BrainCircuit size={24} />,
  zap: <Zap size={24} />,
  flame: <Flame size={24} />,
  wind: <Wind size={24} />,
  lightbulb: <Lightbulb size={20} />,
  sparkles: <Sparkles size={20} />,
};

const COLOR_MAP = {
  blue:   { card: 'rec-blue',   ibox: 'ibox-blue',   pill: 'ibox-blue' },
  purple: { card: 'rec-purple', ibox: 'ibox-purple', pill: 'ibox-purple' },
  pink:   { card: 'rec-pink',   ibox: 'ibox-pink',   pill: 'ibox-pink' },
};

// ─── Component ────────────────────────────────────────────────────────────────
const Recommendations = ({ showToast, onTriggerAction }) => {
  const { dashboardData, isDashboardLoading } = useDashboardContext();

  const phase = dashboardData?.upcomingDates?.cyclePhase || 'Luteal';
  const pcodScore = dashboardData?.pcodInsights?.score || 0;
  const pd = useMemo(() => PHASE_DATA[phase] || PHASE_DATA.Luteal, [phase]);

  // Interaction state
  const [expandedCard, setExpandedCard]     = useState(null); // card id
  const [selectedCards, setSelectedCards]   = useState(new Set()); // bookmarked card ids
  const [energyTracked, setEnergyTracked]   = useState(false);
  const [energyStreak, setEnergyStreak]     = useState(() => parseInt(localStorage.getItem('predict_her_energy_streak') || '0'));
  const [ritualsOpen, setRitualsOpen]       = useState(false);

  const handleTrackEnergy = () => {
    if (energyTracked) return;
    const newStreak = energyStreak + 1;
    setEnergyStreak(newStreak);
    localStorage.setItem('predict_her_energy_streak', String(newStreak));
    setEnergyTracked(true);
    if (showToast) showToast(`Energy tracked! 🔥 Streak: ${newStreak} day${newStreak !== 1 ? 's' : ''}`);
  };

  const handleBookmark = (id) => {
    setSelectedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (showToast) showToast('Removed from saved 📌');
      } else {
        next.add(id);
        if (showToast) showToast('Saved to your rituals! 🌸');
      }
      return next;
    });
  };

  const handleCardExpand = (id) => {
    setExpandedCard(prev => (prev === id ? null : id));
  };

  if (isDashboardLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="#e040a0" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100%' }}>
      <div className="recs-container fade-in">

        {/* ── Hero ─────────────────────────────────────── */}
        <section className="hero-card">
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '42rem' }}>
            <div className="hero-tag">
              Current Phase: {phase}
              {pcodScore >= 50 && (
                <span style={{ marginLeft: '0.75rem', background: 'rgba(255,255,255,0.25)', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem' }}>
                  ⚠️ Elevated Risk Mode
                </span>
              )}
            </div>
            <h1 className="hero-title">{pd.heroTitle}</h1>
            <p className="hero-desc">{pd.heroDesc}</p>
            <div className="hero-btns">
              <button className="btn-solid-white" onClick={() => setRitualsOpen(v => !v)}>
                {ritualsOpen ? 'Hide Rituals' : 'View Rituals'}
              </button>
              <button
                className={`btn-outline-white${energyTracked ? ' btn-tracked' : ''}`}
                onClick={handleTrackEnergy}
                disabled={energyTracked}
              >
                {energyTracked ? `✓ Tracked (${energyStreak}🔥)` : 'Track Energy'}
              </button>
            </div>

            {/* Inline rituals drawer */}
            {ritualsOpen && (
              <div className="rituals-drawer">
                <p className="rituals-label">Today's Rituals</p>
                <ul className="rituals-list">
                  {pd.featured.steps.map((s, i) => (
                    <li key={i} className="ritual-item"><CheckCircle2 size={16} color="#e040a0" style={{ flexShrink: 0 }} /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="hero-glow-1" />
          <div className="hero-glow-2" />
        </section>

        {/* ── Phase notice (PCOD elevated) */}
        {pcodScore >= 50 && (
          <div className="pcod-notice">
            <Sparkles size={16} color="#7c52aa" style={{ flexShrink: 0 }} />
            <span>Recommendations are personalised for your <strong>elevated PCOD risk score ({pcodScore})</strong>. Tips focus on insulin regulation and cortisol balance.</span>
          </div>
        )}

        {/* ── 3-Col Cards ──────────────────────────────── */}
        <section className="rec-grid">
          {pd.cards.map((card) => {
            const c = COLOR_MAP[card.color];
            const isExpanded = expandedCard === card.id;
            const isBookmarked = selectedCards.has(card.id);
            return (
              <div key={card.id} className={`rec-card ${c.card}${isBookmarked ? ' rec-bookmarked' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div className={`rec-icon-box ${c.ibox}`}>{ICON_MAP[card.icon]}</div>
                  <button
                    className="bookmark-btn"
                    onClick={() => handleBookmark(card.id)}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark this'}
                  >
                    {isBookmarked ? <BookmarkCheck size={18} color="#e040a0" /> : <Bookmark size={18} />}
                  </button>
                </div>
                <h3 className="rec-title">{card.title}</h3>
                <p className="rec-desc">{card.desc}</p>
                <div className="rec-footer">
                  <span className={`rec-pill ${c.pill}`}>{card.tag}</span>
                  <button
                    className="expand-btn"
                    onClick={() => handleCardExpand(card.id)}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="card-detail-drawer">
                    <p className="card-detail-text">
                      {card.tag === 'Nutrition' && `💡 ${pcodScore >= 50 ? 'With elevated PCOD risk, focus on low-glycemic options. ' : ''}${card.desc}`}
                      {card.tag === 'Movement' && `🏃 ${pcodScore >= 50 ? 'Resistance training over HIIT is advised for your risk profile. ' : ''}${card.desc}`}
                      {card.tag === 'High Priority' && `⚡ ${card.desc} This is especially important during ${phase} phase.`}
                      {card.tag === 'Lifestyle' && `🌿 ${card.desc} Consistency in this area directly supports your cycle health.`}
                    </p>
                    <button
                      className="detail-action-btn"
                      onClick={() => {
                        handleBookmark(card.id);
                        if (showToast) showToast(`${card.title} added to your plan! ✅`);
                      }}
                    >
                      {selectedCards.has(card.id) ? '✓ Added to Plan' : 'Add to My Plan'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ── Featured Section ─────────────────────────── */}
        <section className="featured-section">
          <div className="featured-img-wrap">
            <div className="featured-img-placeholder">
              <div className="fi-gradient" />
              <div className="fi-text">
                <span className="fi-phase">{phase} Phase</span>
                <p className="fi-sub">Your personalized ritual</p>
              </div>
            </div>
          </div>
          <div className="featured-content">
            <div className="featured-tag">{pd.featured.tag}</div>
            <h2 className="featured-title">{pd.featured.title}</h2>
            <p className="featured-desc">{pd.featured.desc}</p>
            <ul className="featured-list">
              {pd.featured.steps.map((step, i) => (
                <li key={i} className="featured-list-item">
                  <CheckCircle2 size={20} color="#e040a0" /> {step}
                </li>
              ))}
            </ul>
            <button
              className="btn-primary-solid"
              onClick={() => {
                const actionId = pd.featured.journey.toLowerCase().replace(/\s+/g, '_');
                if (onTriggerAction) {
                  onTriggerAction(actionId);
                } else {
                  handleTrackEnergy();
                  if (showToast) showToast(`${pd.featured.journey} — ritual started! 🌸`);
                }
              }}
            >
              {pd.featured.journey}
            </button>
          </div>
        </section>

        {/* ── Cycle Secrets ─────────────────────────────── */}
        <section>
          <div className="secrets-header">
            <h2 className="secrets-title">Cycle Secrets</h2>
            <span className="phase-badge">{phase} Phase Tips</span>
          </div>
          <div className="secrets-list">
            {pd.secrets.map((s, i) => (
              <div key={i} className="secret-card">
                <div className={`secret-icon ${s.color}`}>{ICON_MAP[s.icon] || ICON_MAP.lightbulb}</div>
                <div className="secret-text">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className="bookmark-btn"
                  onClick={() => {
                    if (showToast) showToast('Tip saved! 📌');
                  }}
                >
                  <Bookmark size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── My Plan (bookmarked cards) ────────────────── */}
        {selectedCards.size > 0 && (
          <section className="my-plan-section">
            <div className="secrets-header">
              <h2 className="secrets-title">My Plan <span style={{ fontSize: '1rem', fontWeight: 500, color: '#e040a0' }}>({selectedCards.size} saved)</span></h2>
              <button className="secrets-link" onClick={() => { setSelectedCards(new Set()); if (showToast) showToast('Plan cleared 🗑️'); }}>Clear All</button>
            </div>
            <div className="my-plan-grid">
              {pd.cards.filter(c => selectedCards.has(c.id)).map(card => (
                <div key={card.id} className="my-plan-pill">
                  <CheckCircle2 size={14} color="#e040a0" />
                  <span>{card.title}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Recommendations;
