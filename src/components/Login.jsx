import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { loginUser } from '../services/firebase';
import './Login.css';

const Login = ({ onLogin, onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginUser(email, password);
      onLogin();
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      {/* LEFT HALF — Animated Art Panel */}
      <div className="login-left">

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

        {/* ── Realistic Moon ─────────────────────────── */}
        {/* Outer glow wrapper (separate so glow doesn't clip) */}
        <div className="lw-moon-glow">
          {/* Circular container — overflow:hidden clips the phase shadow */}
          <div className="lw-moon-container">
            {/* SVG: textured sphere with craters */}
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
              {/* Sphere */}
              <circle cx="100" cy="100" r="99" fill="url(#mSurf)" />
              {/* Craters & maria */}
              <g clipPath="url(#mClip)">
                {/* Mare Imbrium — large dark lava plain */}
                <ellipse cx="72" cy="82" rx="22" ry="17" fill="rgba(80,60,160,0.20)" transform="rotate(-18 72 82)" />
                <ellipse cx="70" cy="80" rx="16" ry="12" fill="rgba(100,80,180,0.12)" transform="rotate(-18 70 80)" />
                {/* Mare Tranquillitatis */}
                <ellipse cx="130" cy="88" rx="20" ry="17" fill="rgba(80,60,160,0.16)" />
                <ellipse cx="128" cy="86" rx="14" ry="12" fill="rgba(100,80,180,0.09)" />
                {/* Tycho — large crater with central peak */}
                <circle cx="92"  cy="140" r="11" fill="rgba(80,60,160,0.18)" />
                <circle cx="92"  cy="140" r="7"  fill="rgba(100,80,180,0.10)" />
                <circle cx="92"  cy="140" r="2"  fill="rgba(240,235,255,0.35)" />
                {/* Copernicus */}
                <circle cx="78"  cy="108" r="8"  fill="rgba(80,60,160,0.16)" />
                <circle cx="78"  cy="108" r="5"  fill="rgba(100,80,180,0.09)" />
                <circle cx="78"  cy="108" r="1.5" fill="rgba(235,230,255,0.30)" />
                {/* Plato */}
                <circle cx="148" cy="126" r="9"  fill="rgba(80,60,160,0.15)" />
                <circle cx="148" cy="126" r="6"  fill="rgba(100,80,180,0.08)" />
                {/* Smaller craters */}
                <circle cx="55"  cy="130" r="6"  fill="rgba(80,60,160,0.13)" />
                <circle cx="158" cy="72"  r="5"  fill="rgba(80,60,160,0.12)" />
                <circle cx="116" cy="154" r="5"  fill="rgba(80,60,160,0.12)" />
                <circle cx="46"  cy="84"  r="4"  fill="rgba(80,60,160,0.10)" />
                <circle cx="164" cy="110" r="4"  fill="rgba(80,60,160,0.10)" />
                <circle cx="102" cy="50"  r="4"  fill="rgba(80,60,160,0.09)" />
                <circle cx="58"  cy="155" r="3"  fill="rgba(80,60,160,0.09)" />
                <circle cx="170" cy="148" r="5"  fill="rgba(80,60,160,0.11)" />
                {/* Specular highlight — pure white sun reflection top-left */}
                <ellipse cx="65" cy="60" rx="22" ry="15" fill="rgba(255,255,255,0.45)" transform="rotate(-30 65 60)" />
              </g>
            </svg>
            {/* Phase shadow — clip-path animates INSIDE the circular container */}
            <div className="lw-moon-shadow" />
          </div>
        </div>

        {/* Orbiting particle around the moon */}
        <div className="lw-orbit">
          <div className="lw-orbit-dot" />
        </div>


        {/* Minimal text */}
        <div className="lw-text">
          <p className="lw-tagline">Your cycle. <em>Your power.</em></p>
          <p className="lw-sub">AI-driven insights for your health.</p>
        </div>

      </div>

      {/* RIGHT HALF - Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          {/* Brand */}
          <div className="mb-10 text-center">
            <h1 className="login-logo-text">Predict Her</h1>
            <p className="login-tagline">Smart Period Tracking & PCOD Prediction</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            {/* Email */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@predicther.app" 
                  required 
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <div className="flex justify-between items-center px-1 mb-2">
                <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            {/* Button */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Bottom Link */}
          <div className="signup-link-container">
            New to Predict Her?{' '}
            <button
              type="button"
              className="signup-link"
              onClick={onSignup}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="privacy-footer">
          <Shield size={16} color="var(--primary-pink)" className="mr-2" />
          <span>Your data is encrypted and secure</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
