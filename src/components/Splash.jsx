import React from 'react';
import './Splash.css';

const Splash = () => {
  // 7 phases to form a nice arc as in the reference image
  const moonPhases = [
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />, // Crescent
    <path d="M12 21a9 9 0 0 0 0-18v18Z" />,        // Half
    <path d="M12 21a9 9 0 1 0 0-18 6 6 0 0 1 0 18Z" />, // Gibbous
    <circle cx="12" cy="12" r="9" />,             // Full
    <path d="M12 21a9 9 0 1 1 0-18 6 6 0 0 0 0 18Z" />, // Gibbous (Flip)
    <path d="M12 21a9 9 0 0 1 0-18v18Z" />,        // Half (Flip)
    <path d="M12 3a6 6 0 0 1 9 9 9 9 0 1 0-9-9Z" />  // Crescent (Flip)
  ];

  return (
    <div className="splash-container">
      <div className="splash-gradient-overlay"></div>
      
      {/* Background Starry Sky */}
      <div className="star-field">
        {[...Array(60)].map((_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3,
              transform: `scale(${Math.random() * 0.5 + 0.5})`
            }}
          ></div>
        ))}
      </div>

      <div className="flowing-waves">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      <div className="splash-content">
        {/* Moon Arc from Reference */}
        <div className="moon-arc">
          {moonPhases.map((path, idx) => (
            <div key={idx} className="moon-phase-wrapper" style={{ animationDelay: `${idx * 0.2}s` }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="moon-svg">
                {path}
              </svg>
            </div>
          ))}
        </div>

        <h1 className="splash-logo italic">Predict Her</h1>
        <p className="splash-tagline">Smart Period Tracking & PCOD Prediction</p>
      </div>

      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
};

export default Splash;
