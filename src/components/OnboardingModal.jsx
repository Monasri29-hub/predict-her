import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, User, Calendar, Activity, Sparkles, CheckCircle2, Heart, Moon, Zap } from 'lucide-react';
import { updateProfile, logCycleEvent } from '../services/api';

import { useDashboardContext } from '../context/DashboardContext';
import './OnboardingModal.css';

const SIGNUP_STEPS = [
  { id: 'welcome',   label: 'Welcome'   },
  { id: 'profile',   label: 'Profile'   },
  { id: 'identity',  label: 'Identity'  },
  { id: 'ready',     label: 'Ready'     },
];

const UPDATE_STEPS = [
  { id: 'cycle',     label: 'Cycle'     },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'flow',      label: 'Flow'      },
  { id: 'ready',     label: 'Ready'     },
];

const SYMPTOM_OPTIONS = ['Cramps', 'Bloating', 'Mood Swings', 'Fatigue', 'Headache', 'Backache', 'Acne', 'Insomnia'];

const STRESS_OPTIONS    = ['Low', 'Moderate', 'High', 'Very High'];
const EXERCISE_OPTIONS  = ['Rarely', '1–2× / week', '3–4× / week', 'Daily'];
const SLEEP_OPTIONS     = ['< 5 hrs', '5–6 hrs', '7–8 hrs', '9+ hrs'];
const FLOW_OPTIONS      = ['Spotting', 'Light', 'Medium', 'Heavy'];

const OnboardingModal = ({ onComplete, showToast, flowMode = 'signup' }) => {
  const { triggerDashboardRefresh } = useDashboardContext();
  const activeSteps = flowMode === 'signup' ? SIGNUP_STEPS : UPDATE_STEPS;
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState({
    name: '', age: '',
    cycleLength: '28', periodLength: '5', symptoms: [],
    sleepHours: '7–8 hrs', stressLevel: 'Moderate', exerciseFreq: '1–2× / week',
    // Quick Flow (current period)
    onPeriod: null,
    flowStartDate: new Date().toISOString().split('T')[0],
    flowIntensity: 'Medium',
    // Quick Flow (last period, when not currently on it)
    lastPeriodDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 14); // sensible default: ~14 days ago
      return d.toISOString().split('T')[0];
    })(),
    lastPeriodDuration: '5',
    lastFlowIntensity: 'Medium',
    // Identity
    anonymousAlias: '',
    aliasLocked: false,
    customAliasInput: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const pct = (step / (activeSteps.length - 1)) * 100;

  const toggleSymptom = (s) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s)
        ? prev.symptoms.filter(x => x !== s)
        : [...prev.symptoms, s]
    }));
  };

  const currentStepId = activeSteps[step]?.id;

  const canNext = () => {
    if (currentStepId === 'profile')   return form.name.trim().length > 0 && form.age >= 10 && form.age <= 60;
    if (currentStepId === 'cycle')     return parseInt(form.cycleLength) >= 20 && parseInt(form.cycleLength) <= 45;
    if (currentStepId === 'flow')      return form.onPeriod !== null; 
    return true;
  };

  const handleNext = async () => {
    setError('');

    // Save logic based on step ID
    if (currentStepId === 'profile') {
      try {
        await updateProfile({
          displayName: form.name.trim(),
          age: parseInt(form.age)
        });
      } catch (e) { setError('Could not save profile.'); return; }
    }

    if (currentStepId === 'lifestyle') {
      try {
        await updateProfile({
          baselineCycleLength:  parseInt(form.cycleLength),
          periodLength:         parseInt(form.periodLength),
          symptoms:             form.symptoms,
          sleepHours:           form.sleepHours,
          stressLevel:          form.stressLevel,
          exerciseFreq:         form.exerciseFreq,
        });
      } catch (e) { setError('Could not save metrics.'); return; }
    }

    if (currentStepId === 'flow') {
      try {
        if (form.onPeriod === true) {
          await logCycleEvent('flow', {
            value: form.flowIntensity,
            date:  form.flowStartDate,
            note:  'Logged via cycle update',
          });
        } else if (form.onPeriod === false) {
          await logCycleEvent('flow', {
            value: form.lastFlowIntensity,
            date:  form.lastPeriodDate,
            duration: parseInt(form.lastPeriodDuration) || 5,
            note:  'Last period logged via cycle update',
          });
        }
        triggerDashboardRefresh();
      } catch (e) { /* non-critical */ }
    }

    if (currentStepId === 'identity') {
      setSaving(true);
      try {
        await updateProfile({
          anonymousAlias: form.anonymousAlias || form.customAliasInput,
          aliasLocked:    form.aliasLocked
        });
      } catch (e) { }
      setSaving(false);
    }

    setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (flowMode === 'signup') {
        await updateProfile({ onboarded: true });
        localStorage.setItem('predict_her_onboarded', '1');
        if (showToast) showToast(`Welcome, ${form.name || 'there'}! Your journey has begun 🌸`);
      } else {
        if (showToast) showToast('Cycle info updated successfully. ✨');
      }
      onComplete();
    } catch {
      setError('Could not finalize setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="ob-page">

      {/* ── Animated background layer ───────────────────── */}
      {/* Morphing gradient blobs */}
      <div className="ob-blob ob-blob-1" />
      <div className="ob-blob ob-blob-2" />
      <div className="ob-blob ob-blob-3" />
      {/* Twinkling stars */}
      <div className="ob-star ob-s1" />
      <div className="ob-star ob-s2" />
      <div className="ob-star ob-s3" />
      <div className="ob-star ob-s4" />
      <div className="ob-star ob-s5" />
      <div className="ob-star ob-s6" />
      <div className="ob-star ob-s7" />

      <div className="ob-modal">

        {/* ── Fixed header: progress + dots (never scrolls) ── */}
        <div className="ob-header-fixed">
          <div className="ob-progress-track">
            <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ob-dots">
            {activeSteps.map((s, i) => (
              <div key={s.id} className={`ob-dot${i <= step ? ' ob-dot-active' : ''}`} />
            ))}
          </div>
        </div>

        {/* ── Scrollable step content ─────────────────────── */}
        <div className="ob-scrollable-body">

        {/* ── Step Rendering: Check currentStepId ────────────────── */}
        {currentStepId === 'welcome' && (
          <div className="ob-step">
            <div className="ob-icon-circle ob-pink">
              <Heart size={36} color="#e040a0" />
            </div>
            <h1 className="ob-title">Welcome to <em>Predict Her</em></h1>
            <p className="ob-sub">
              Your intelligent cycle companion. Let's set up your personalized dashboard in just 2 minutes — completely private, always yours.
            </p>
            <ul className="ob-features">
              <li><CheckCircle2 size={16} color="#e040a0" /> Smart PCOD risk insights from your logs</li>
              <li><CheckCircle2 size={16} color="#7c52aa" /> Phase-personalised daily recommendations</li>
              <li><CheckCircle2 size={16} color="#0096cc" /> Anonymous community support</li>
            </ul>
          </div>
        )}

        {currentStepId === 'profile' && (
          <div className="ob-step">
            <div className="ob-icon-circle ob-purple">
              <User size={32} color="#7c52aa" />
            </div>
            <h2 className="ob-title">Tell us about you</h2>
            <p className="ob-sub">This personalises your greetings and health overview.</p>
            <div className="ob-fields">
              <div className="ob-field">
                <label>First Name</label>
                <input
                  type="text"
                  className="ob-input"
                  placeholder="e.g. Mona"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="ob-field">
                <label>Age</label>
                <input
                  type="number"
                  className="ob-input"
                  placeholder="e.g. 19"
                  value={form.age}
                  min={10} max={60}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                />
              </div>
            </div>
            {error && <p className="ob-error">{error}</p>}
          </div>
        )}

        {currentStepId === 'cycle' && (
          <div className="ob-step">
            <div className="ob-icon-circle ob-blue">
              <Calendar size={32} color="#0096cc" />
            </div>
            <h2 className="ob-title">Cycle Baseline</h2>
            <p className="ob-sub">Update your average cycle details for more accurate predictions.</p>
            <div className="ob-fields">
              <div className="ob-field">
                <label>Average Cycle Length <span className="ob-hint">(days)</span></label>
                <input
                  type="number"
                  className="ob-input"
                  value={form.cycleLength}
                  min={20} max={45}
                  onChange={e => setForm(f => ({ ...f, cycleLength: e.target.value }))}
                />
              </div>
              <div className="ob-field">
                <label>Average Period Length</label>
                <input
                  type="number"
                  className="ob-input"
                  value={form.periodLength}
                  min={2} max={10}
                  onChange={e => setForm(f => ({ ...f, periodLength: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {currentStepId === 'lifestyle' && (
          <div className="ob-step">
            <div className="ob-icon-circle ob-purple">
              <Zap size={32} color="#7c52aa" />
            </div>
            <h2 className="ob-title">Lifestyle & Wellbeing</h2>
            <p className="ob-sub">Updating these helps refine your PCOD risk score.</p>
            <div className="ob-fields">
              <div className="ob-field">
                <label><Moon size={13} style={{ display:'inline', marginRight:'4px', verticalAlign:'middle' }} /> Average Sleep</label>
                <div className="ob-chips">
                  {SLEEP_OPTIONS.map(opt => (
                    <button
                      key={opt} type="button"
                      className={`ob-chip${form.sleepHours === opt ? ' ob-chip-active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, sleepHours: opt }))}
                    >{opt}</button>
                  ))}
                </div>
              </div>
              <div className="ob-field">
                <label>💆 Typical Stress</label>
                <div className="ob-chips">
                  {STRESS_OPTIONS.map(opt => (
                    <button
                      key={opt} type="button"
                      className={`ob-chip${form.stressLevel === opt ? ' ob-chip-active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, stressLevel: opt }))}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStepId === 'flow' && (
          <div className="ob-step">
            <div className="ob-icon-circle ob-pink">
              <Heart size={32} color="#e040a0" />
            </div>
            <h2 className="ob-title">Quick Flow Check-in</h2>
            <p className="ob-sub">Are you currently on your period?</p>
            <div className="ob-fields">
              <div className="ob-field" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className={`ob-chip${form.onPeriod === true ? ' ob-chip-active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, onPeriod: true }))}
                  >Yes 🌸</button>
                  <button
                    type="button"
                    className={`ob-chip${form.onPeriod === false ? ' ob-chip-active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, onPeriod: false }))}
                  >Not right now</button>
                </div>
              </div>

              {form.onPeriod === true && (
                <div className="ob-field fade-in">
                  <label>Start Date</label>
                  <input type="date" className="ob-input" value={form.flowStartDate} onChange={e => setForm(f => ({ ...f, flowStartDate: e.target.value }))} />
                </div>
              )}

              {form.onPeriod === false && (
                <div className="ob-field fade-in">
                  <label>Last Period Start</label>
                  <input type="date" className="ob-input" value={form.lastPeriodDate} onChange={e => setForm(f => ({ ...f, lastPeriodDate: e.target.value }))} />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStepId === 'identity' && (
          <div className="ob-step">
            <div className="ob-icon-circle ob-blue">
              <Sparkles size={32} color="#0096cc" />
            </div>
            <h2 className="ob-title">Community Identity</h2>
            <p className="ob-sub">Choose a permanent anonymous alias.</p>
            <div className="ob-fields">
              <div className="ob-alias-preview">
                <span className="ob-ap-name">{form.anonymousAlias || form.customAliasInput || 'Choose your alias'}</span>
                {form.aliasLocked && <div className="ob-ap-locked-badge"><CheckCircle2 size={12} /> LOCKED</div>}
              </div>
              <input 
                type="text" 
                className="ob-input" 
                placeholder="Type custom alias..." 
                value={form.customAliasInput}
                onChange={e => setForm(f => ({ ...f, customAliasInput: e.target.value, anonymousAlias: '' }))}
              />
              <div className="ob-lock-toggle-box">
                <span style={{ fontSize: '0.85rem' }}>Lock Identity Forever</span>
                <input type="checkbox" checked={form.aliasLocked} onChange={e => setForm(f => ({ ...f, aliasLocked: e.target.checked }))} />
              </div>
            </div>
          </div>
        )}

        {currentStepId === 'ready' && (
          <div className="ob-step ob-ready">
            <div className="ob-icon-circle ob-gradient">
              <Activity size={36} color="#fff" />
            </div>
            <h2 className="ob-title">{flowMode === 'signup' ? "You're all set!" : "All Updated!"} 🎉</h2>
            <p className="ob-sub">
              {flowMode === 'signup' 
                ? "Your dashboard is personalized and ready to go." 
                : "Your cycle predictions and risk analysis have been recalibrated."}
            </p>
          </div>
        )}

        {/* ── Step 6: Ready ────────────────────────────────── */}
        {step === 6 && (
          <div className="ob-step ob-ready">
            <div className="ob-confetti">
              {['🌸','✨','🌙','💜','🌿'].map((e, i) => (
                <span key={i} className="ob-confetti-piece" style={{ animationDelay: `${i * 0.12}s` }}>{e}</span>
              ))}
            </div>
            <div className="ob-icon-circle ob-gradient">
              <Activity size={36} color="#fff" />
            </div>
            <h2 className="ob-title">You're all set{form.name ? `, ${form.name}` : ''}! 🎉</h2>
            <p className="ob-sub">Your dashboard is holistic and ready. Start logging to unlock smarter PCOD risk analysis and daily rituals.</p>
            <div className="ob-summary-cards">
              <div className="ob-summary-card">
                <span className="ob-sc-label">Cycle</span>
                <span className="ob-sc-value">{form.cycleLength}d</span>
              </div>
              <div className="ob-summary-card">
                <span className="ob-sc-label">Period</span>
                <span className="ob-sc-value">{form.periodLength}d</span>
              </div>
              <div className="ob-summary-card">
                <span className="ob-sc-label">Sleep</span>
                <span className="ob-sc-value" style={{ fontSize: '0.85rem' }}>{form.sleepHours}</span>
              </div>
              <div className="ob-summary-card">
                <span className="ob-sc-label">Stress</span>
                <span className="ob-sc-value" style={{ fontSize: '0.85rem' }}>{form.stressLevel}</span>
              </div>
              <div className="ob-summary-card">
                <span className="ob-sc-label">Exercise</span>
                <span className="ob-sc-value" style={{ fontSize: '0.75rem' }}>{form.exerciseFreq}</span>
              </div>
              <div className="ob-summary-card">
                <span className="ob-sc-label">Symptoms</span>
                <span className="ob-sc-value">{form.symptoms.length || '—'}</span>
              </div>
            </div>
            <p className="ob-next-hint">
              <Sparkles size={14} color="#e040a0" /> Your PCOD risk score is now pre-calibrated with your lifestyle data.
            </p>
          </div>
        )}


        </div>{/* end ob-scrollable-body */}

        {/* ── Navigation — pinned outside scroll ───────────── */}
        <div className="ob-nav">
          {step > 0 && step < activeSteps.length - 1 && (
            <button className="ob-btn-back" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={18} /> Back
            </button>
          )}
          {step < activeSteps.length - 1 ? (
            <button
              className="ob-btn-next"
              onClick={handleNext}
              disabled={!canNext() || saving}
              style={{ marginLeft: step === 0 ? 'auto' : undefined }}
            >
              {saving ? 'Saving...' : step === activeSteps.length - 2 ? (flowMode === 'signup' ? 'Finish Setup' : 'Review Summary') : 'Continue'}
              {!saving && <ArrowRight size={18} />}
            </button>
          ) : (
            <button className="ob-btn-next ob-btn-launch" onClick={handleFinish}>
              {flowMode === 'signup' ? 'Open My Dashboard' : 'Back to Dashboard'} <Sparkles size={18} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
