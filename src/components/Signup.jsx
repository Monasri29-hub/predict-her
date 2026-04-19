import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Shield, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import { signupUser } from '../services/firebase';
import './Signup.css';

const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (/[A-Z]/.test(pwd))       score++;
  if (/[0-9]/.test(pwd))       score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0–4
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#e53e3e', '#e08a00', '#0096cc', '#22c55e'];

const Signup = ({ onSignup, onBackToLogin }) => {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [agreed, setAgreed]   = useState(false);

  const strength = passwordStrength(form.password);
  const pwdMatch = form.confirm.length > 0 && form.password === form.confirm;
  const pwdMismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const validate = () => {
    if (!form.name.trim())            return 'Please enter your name.';
    if (!form.email.includes('@'))    return 'Please enter a valid email.';
    if (form.password.length < 8)     return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    if (!agreed)                      return 'Please accept the privacy policy to continue.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await signupUser(form.name.trim(), form.email, form.password);
      onSignup();
    } catch (e) {
      setError(e.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container fade-in">

      {/* LEFT HALF — Animated Art Panel (Synced with Login Style) */}
      <div className="signup-left">
        {/* Layered morphing waves */}
        <div className="lw-wave lw-wave-1" />
        <div className="lw-wave lw-wave-2" />
        <div className="lw-wave lw-wave-3" />

        {/* Twinkling star dots */}
        <div className="lw-star lw-s1" />
        <div className="lw-star lw-s2" />
        <div className="lw-star lw-s3" />
        <div className="lw-star lw-s4" />
        <div className="lw-star lw-s5" />
        <div className="lw-star lw-s6" />
        <div className="lw-star lw-s7" />

        {/* Realistic Moon */}
        <div className="lw-moon-glow">
          <div className="lw-moon-container">
            <svg className="lw-moon-surface" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="mSurf" cx="36%" cy="29%" r="72%">
                  <stop offset="0%"   stopColor="#ffffff" />
                  <stop offset="18%"  stopColor="#f0eeff" />
                  <stop offset="40%"  stopColor="#d8d0f4" />
                  <stop offset="62%"  stopColor="#b8a8e8" />
                  <stop offset="82%"  stopColor="#8870c8" />
                  <stop offset="100%" stopColor="#5040a0" />
                </radialGradient>
                <clipPath id="mClip"><circle cx="100" cy="100" r="99" /></clipPath>
              </defs>
              <circle cx="100" cy="100" r="99" fill="url(#mSurf)" />
              <g clipPath="url(#mClip)">
                <ellipse cx="72" cy="82" rx="22" ry="17" fill="rgba(80,60,160,0.20)" transform="rotate(-18 72 82)" />
                <ellipse cx="130" cy="88" rx="20" ry="17" fill="rgba(80,60,160,0.16)" />
                <circle cx="92"  cy="140" r="11" fill="rgba(80,60,160,0.18)" />
                <circle cx="78"  cy="108" r="8"  fill="rgba(80,60,160,0.16)" />
                <circle cx="148" cy="126" r="9"  fill="rgba(80,60,160,0.15)" />
              </g>
            </svg>
            <div className="lw-moon-shadow" />
          </div>
        </div>

        {/* Orbiting particle */}
        <div className="lw-orbit">
          <div className="lw-orbit-dot" />
        </div>

        {/* Minimal text overlay */}
        <div className="lw-text">
          <div className="su-brand-minimal">
            <Sparkles size={20} color="#ffd6ee" />
            <span>Predict Her</span>
          </div>
          <p className="lw-tagline">Your cycle. <em>Your power.</em></p>
          <div className="su-feature-pills">
            <span>Smart Predictions</span>
            <span>PCOD Risk</span>
            <span>Community</span>
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="signup-right">
        <div className="signup-form-wrapper">

          {/* Header */}
          <div className="su-form-header">
            <h1 className="su-form-title">Create Account</h1>
            <p className="su-form-sub">Start your wellness journey today — free forever.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Error banner */}
            {error && (
              <div className="su-error-box">
                ⚠️ {error}
              </div>
            )}

            {/* Full Name */}
            <div className="su-input-group">
              <label htmlFor="su-name">Full Name</label>
              <div className="su-input-wrapper">
                <User className="su-input-icon" size={18} />
                <input
                  type="text"
                  id="su-name"
                  placeholder="e.g. Mona Kundeti"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="su-input-group">
              <label htmlFor="su-email">Email Address</label>
              <div className="su-input-wrapper">
                <Mail className="su-input-icon" size={18} />
                <input
                  type="email"
                  id="su-email"
                  placeholder="hello@predicther.app"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="su-input-group">
              <label htmlFor="su-password">Password</label>
              <div className="su-input-wrapper">
                <Lock className="su-input-icon" size={18} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="su-password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="su-eye-btn" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="su-strength-wrap">
                  <div className="su-strength-track">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className="su-strength-bar"
                        style={{ backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : '#efe8f4' }}
                      />
                    ))}
                  </div>
                  <span className="su-strength-label" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="su-input-group">
              <label htmlFor="su-confirm">Confirm Password</label>
              <div className={`su-input-wrapper${pwdMismatch ? ' su-input-error' : pwdMatch ? ' su-input-ok' : ''}`}>
                <Lock className="su-input-icon" size={18} />
                <input
                  type={showCfm ? 'text' : 'password'}
                  id="su-confirm"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="su-eye-btn" onClick={() => setShowCfm(v => !v)} tabIndex={-1}>
                  {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {pwdMatch    && <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0 }} />}
              </div>
              {pwdMismatch && <p className="su-field-error">Passwords don't match</p>}
            </div>

            {/* Privacy agreement */}
            <div className="su-agree-row">
              <input
                type="checkbox"
                id="su-agree"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="su-checkbox"
              />
              <label htmlFor="su-agree" className="su-agree-label">
                I agree to the <a href="#" className="su-link">Privacy Policy</a> — my health data is never shared or sold.
              </label>
            </div>

            {/* Submit */}
            <button type="submit" className="su-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create My Account'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Back to login */}
          <div className="su-login-link-row">
            Already have an account?{' '}
            <button className="su-login-link" onClick={onBackToLogin}>Log In</button>
          </div>
        </div>

        {/* Footer */}
        <div className="su-privacy-footer">
          <Shield size={15} color="var(--dark-pink, #e040a0)" />
          <span>256-bit encryption · Your data stays private</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
