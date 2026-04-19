import React, { useState, useEffect } from 'react';
import { Camera, Settings, Shield, Bell, User, Activity, RefreshCw, Copy, Check, Lock } from 'lucide-react';
import {
  fetchProfile, updateProfile, setAnonymousMode, getAnonymousMode,
  getOriginalAlias, regenerateAlias, setCustomAlias, isAliasCustom,
  lockAlias, isAliasLocked
} from '../services/api';

import { useDashboardContext } from '../context/DashboardContext';
import './Profile.css';

const Profile = ({ showToast, onLogout }) => {
  const { dashboardData, isDashboardLoading, triggerDashboardRefresh } = useDashboardContext();

  // Read healthOverview directly from global context — no isolated fetch needed
  const healthOverview = dashboardData?.healthOverview || null;

  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    cycleLength: '',
    periodLength: 5,
    notifications: true,
    privacy: getAnonymousMode(),
    joinDate: '',
    profilePhoto: ''
  });
  const [isSaving, setIsSaving]       = useState(false);
  const [nameKey, setNameKey]          = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ── Anonymous identity state ──────────────────────────────────
  const [alias, setAlias]              = useState(getOriginalAlias());
  const [aliasCustom, setAliasCustom]  = useState(isAliasCustom());
  const [aliasLocked, setAliasLocked]  = useState(isAliasLocked());
  const [aliasInput, setAliasInput]    = useState('');
  const [aliasEditMode, setAliasEditMode] = useState(false);
  const [aliasError, setAliasError]    = useState('');
  const [aliasCopied, setAliasCopied]  = useState(false);

  // Fetch profile info on load from mock backend
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetchProfile();
        if (res.data) {
          setProfileData(prev => ({
            ...prev,
            name: res.data.displayName || res.data.name || prev.name,
            age: res.data.age || prev.age,
            cycleLength: res.data.cycleLength || prev.cycleLength,
            // anonymousMode from backend/localStorage — this is the fix
            privacy: typeof res.data.anonymousMode === 'boolean'
              ? res.data.anonymousMode
              : getAnonymousMode(),
            onboarded: res.data.onboarded,
            joinDate: res.data.joinDate,
            profilePhoto: res.data.profilePhoto
          }));
          
          // Sync Identity
          if (res.data.anonymousAlias) {
            setAlias(res.data.anonymousAlias);
            setAliasLocked(!!res.data.aliasLocked);
            setAliasCustom(isAliasCustom()); // still using local storage flag for 'custom' hint
          }
        }
      } catch (e) {
        console.error('Failed loading profile', e);
      }
    };
    bootstrap();
  }, []);

  const handleUpdate = async () => {
    if (!profileData.name.trim()) {
      showToast('⚠️ Display name cannot be empty.');
      return;
    }
    const ageNum = parseInt(profileData.age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      showToast('⚠️ Please enter a valid age (10–100).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        displayName: profileData.name.trim(),
        age: ageNum,
        baselineCycleLength: parseInt(profileData.cycleLength) || 28,
      });
      if (res.data.success) {
        setNameKey(k => k + 1);
        triggerDashboardRefresh(); // ONE call — refreshes dashboard, insights, health overview, community
        showToast('Profile updated successfully. ✨');
        setTimeout(() => showToast('Dashboard refreshed. 📊'), 400);
      }
    } catch (e) {
      console.error('Profile update failed', e);
      showToast('❌ Update failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key) => {
    setProfileData(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (key === 'privacy') {
        setAnonymousMode(updated.privacy);
        showToast(updated.privacy
          ? `🛡️ Anonymous mode on — posts will show as “${alias}”.`
          : `👤 Posts will now show as “${updated.name || 'You'}”.`
        );
      } else {
        showToast(`Notification settings saved.`);
      }
      return updated;
    });
  };

  const handleRegenerateAlias = () => {
    const result = regenerateAlias();
    if (!result.ok) { showToast(`🔒 ${result.error}`); return; }
    setAlias(result.alias);
    setAliasCustom(false);
    setAliasInput('');
    setAliasEditMode(false);
    showToast(`✨ New alias: “${result.alias}”`);
  };

  const handleSetCustomAlias = () => {
    const result = setCustomAlias(aliasInput);
    if (!result.ok) { setAliasError(result.error); return; }
    setAlias(result.alias);
    setAliasCustom(true);
    setAliasInput('');
    setAliasEditMode(false);
    setAliasError('');
    showToast(`🌸 Alias updated to “${result.alias}”`);
  };

  const handleLockAlias = () => {
    const locked = lockAlias();
    setAliasLocked(true);
    setAliasEditMode(false);
    showToast(`🔐 Alias permanently fixed as “${locked}”`);
  };

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(alias).then(() => {
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit size
    if (file.size > 2 * 1024 * 1024) {
      showToast('⚠️ Image must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setProfileData(prev => ({ ...prev, profilePhoto: base64 }));
      try {
        await updateProfile({ profilePhoto: base64 });
        showToast('Profile photo updated successfully. ✨');
      } catch (e) {
        showToast('❌ Photo update failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const fallbackAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuCPu3ovXfib6WnUBWiuDYarNGGlCq-eryY_2VoKdh9S_wyqB4uKJzjNs524T0ZauaMVOL5w1J6yDs8kMoXiohwFFLyLmh-y6rYytmkPfV0Pd5jwla3nLxArKe-yX5ua7EFahM-hWMwuzLAsgveBWMO1QTorjhBq79p6U65JPnW69p7WfN_nZO8e7aduvZPq_90N9Spqttg1dPJXmcXWkqiBziWMbIvF7EbSRusvX2DhPMRPOHPrV5w9yNoa5NKRYCj2SG8oufUadNay";

  return (
    <div className="profile-container fade-in">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-bg-glow"></div>
        <div className="profile-avatar-wrap">
          <img 
            src={profileData.profilePhoto || fallbackAvatar} 
            alt="Profile Avatar" 
            style={{ objectFit: 'cover' }}
          />
          <div className="profile-avatar-overlay" onClick={() => document.getElementById('avatar-upload').click()}>
            <Camera size={24} />
          </div>
          <input 
            type="file" 
            id="avatar-upload" 
            hidden 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />
        </div>
        <h2 key={nameKey} className="profile-name header-fade-in">{profileData.name}</h2>
        <p className="profile-sub">{profileData.age ? `${profileData.age} Years Old • ` : ''}Joined {profileData.joinDate || 'Jan 2026'}</p>
      </div>

      <div className="profile-grid">
        {/* Left Column: Stats */}
        <div className="prof-col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="stats-card">
            <h3 style={{ fontWeight: 900, marginBottom: '1rem', color: '#2e1a28', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} color="#e040a0" /> Health Overview</h3>
            
            {isDashboardLoading || !healthOverview ? (
                <div style={{ padding: '1rem 0', opacity: 0.6 }}>Loading Health Data...</div>
            ) : healthOverview.symptomsLogged === 0 ? (
                <div style={{ padding: '1rem 0', fontStyle: 'italic', color: '#7c52aa' }}>
                    Start logging to see your stats.
                </div>
            ) : (
                <div className="stats-content number-fade-in">
                    <div className="stat-row">
                      <span className="stat-label">Average Cycle Length</span>
                      <span className="stat-value">{healthOverview.averageCycleLength} Days</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Average Period Length</span>
                      <span className="stat-value">{healthOverview.averagePeriodLength} Days</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Symptoms Logged</span>
                      <span className="stat-value">{healthOverview.symptomsLogged}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Current Streak</span>
                      <span className="stat-value" style={{ color: '#7c52aa' }}>{healthOverview.currentStreak} Days 🔥</span>
                    </div>
                </div>
            )}
          </div>

        </div>

        {/* Right Column: Settings */}
        <div className="prof-col-8">
          
          <div className="settings-group">
            <div className="settings-header">
              <User color="#0096cc" /> Account Information
            </div>
            <div className="settings-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-block">
                  <label>Display Name</label>
                  <input type="text" className="prof-input" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                </div>
                <div className="input-block">
                  <label>Age</label>
                  <input type="number" className="prof-input" value={profileData.age} onChange={(e) => setProfileData({...profileData, age: e.target.value})} />
                </div>
                <div className="input-block">
                  <label>Baseline Cycle Length (Days)</label>
                  <input type="number" className="prof-input" value={profileData.cycleLength} onChange={(e) => setProfileData({...profileData, cycleLength: e.target.value})} />
                </div>
              </div>
              <button className="btn-prof-save" onClick={handleUpdate}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="settings-group">
            <div className="settings-header">
              <Settings color="#e040a0" /> App Settings
            </div>
            <div className="settings-body">
              
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4><Bell size={16} style={{ display: 'inline', marginRight: '4px' }} /> Push Notifications</h4>
                  <p>Receive cycle predictions and daily grounding reminders.</p>
                </div>
                <button
                  className={`prof-toggle ${profileData.notifications ? 'prof-toggle-on' : 'prof-toggle-off'}`}
                  onClick={() => handleToggle('notifications')}
                  aria-label={profileData.notifications ? 'Disable notifications' : 'Enable notifications'}
                >
                  <div className="prof-toggle-thumb" />
                </button>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4><Shield size={16} style={{ display: 'inline', marginRight: '4px' }} /> Anonymous Community Mode</h4>
                  <p>Strip all identifiable health data before generating posts.</p>
                </div>
                <button
                  className={`prof-toggle ${profileData.privacy ? 'prof-toggle-on prof-toggle-violet' : 'prof-toggle-off'}`}
                  onClick={() => handleToggle('privacy')}
                  aria-label={profileData.privacy ? 'Disable anonymous mode' : 'Enable anonymous mode'}
                >
                  <div className="prof-toggle-thumb" />
                </button>
              </div>

              {/* ── Anonymous Identity card ────────────────────────────── */}
              <div className="alias-identity-card">
                <div className="alias-header">
                  <div className="alias-label-row">
                    <span className="alias-icon">{aliasLocked ? '🔐' : '🌙'}</span>
                    <div>
                      <h4 className="alias-title">
                        Anonymous Identity
                        {aliasLocked && <span className="alias-pill alias-pill-locked" style={{ marginLeft: '0.5rem' }}>Permanent</span>}
                      </h4>
                      <p className="alias-sub">
                        {aliasLocked
                          ? 'Your alias is permanently locked. It will always represent you in the community.'
                          : 'This name represents you in the community when Anonymous Mode is on.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="alias-badge-row">
                  <div className="alias-badge">
                    <span className="alias-name">{alias}</span>
                    <span className={`alias-pill ${aliasLocked ? 'alias-pill-locked' : aliasCustom ? 'alias-pill-custom' : 'alias-pill-system'}`}>
                      {aliasLocked ? 'Locked' : aliasCustom ? 'Custom' : 'System'}
                    </span>
                  </div>
                  <div className="alias-badge-actions">
                    {/* Copy always visible */}
                    <button
                      className="alias-action-btn"
                      onClick={handleCopyAlias}
                      title="Copy alias"
                      aria-label="Copy alias"
                    >
                      {aliasCopied ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
                    </button>
                    {/* Regenerate only when unlocked */}
                    {!aliasLocked && (
                      <button
                        className="alias-action-btn"
                        onClick={handleRegenerateAlias}
                        title="Regenerate alias"
                        aria-label="Get a new random alias"
                      >
                        <RefreshCw size={15} />
                      </button>
                    )}
                    {/* Lock icon when locked */}
                    {aliasLocked && (
                      <div className="alias-action-btn alias-action-locked" title="Alias is permanently locked">
                        <Lock size={15} color="#7c52aa" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit / Fix controls — hidden once locked */}
                {!aliasLocked && (<>
                  {!aliasEditMode ? (
                    <button
                      className="alias-custom-toggle"
                      onClick={() => { setAliasEditMode(true); setAliasInput(aliasCustom ? alias : ''); }}
                    >
                      ✏️ Choose my own alias
                    </button>
                  ) : (
                    <div className="alias-edit-row">
                      <input
                        className="alias-input"
                        type="text"
                        maxLength={24}
                        placeholder="e.g. Rose Ember"
                        value={aliasInput}
                        onChange={e => { setAliasInput(e.target.value); setAliasError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleSetCustomAlias()}
                        autoFocus
                      />
                      <div className="alias-edit-btns">
                        <button className="alias-save-btn" onClick={handleSetCustomAlias}>Save</button>
                        <button className="alias-cancel-btn" onClick={() => { setAliasEditMode(false); setAliasError(''); }}>Cancel</button>
                      </div>
                      {aliasError && <p className="alias-error">{aliasError}</p>}
                    </div>
                  )}

                  {/* Fix Alias button */}
                  <button className="alias-fix-btn" onClick={handleLockAlias}>
                    <Lock size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                    Fix Alias Forever
                  </button>
                </>)}
              </div>

            </div>
          </div>

        </div>

        {/* ── Logout ─────────────────────────────────────────── */}
        <div className="logout-section">
          <p className="logout-hint">You'll be returned to the login screen. Your data is stored safely.</p>
          {confirmLogout ? (
            <div className="logout-confirm-row">
              <span className="logout-confirm-text">Are you sure you want to log out?</span>
              <div className="logout-confirm-btns">
                <button
                  className="btn-logout-cancel"
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-logout btn-logout-danger"
                  onClick={() => { setConfirmLogout(false); onLogout && onLogout(); }}
                >
                  Yes, Log Out
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-logout"
              onClick={() => setConfirmLogout(true)}
            >
              Log Out
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
