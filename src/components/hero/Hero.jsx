import React, { useState, useEffect } from 'react';
import MicroSlats from './MicroSlats';
import heroImage from '../../assets/images/global-landmarks.png';
import { 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import './Hero.css';

export const Hero = ({ onLogin, onGetStarted }) => {
  // Mobile responsiveness for slat sizing
  const [slatWidth, setSlatWidth] = useState(9);
  const [slatHeight, setSlatHeight] = useState(24);
  const [gap, setGap] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSlatWidth(8);
        setSlatHeight(18);
        setGap(2.5);
      } else if (window.innerWidth < 1024) {
        setSlatWidth(9);
        setSlatHeight(22);
      } else {
        setSlatWidth(9);
        setSlatHeight(24);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="hero-container">
      {/* 1. Base Image Layer */}
      <div className="hero-image-wrapper">
        <img 
          src={heroImage} 
          alt="PixelMind AI Germany" 
          className="hero-image"
          loading="eager"
        />
      </div>

      {/* 2. Micro Slats WebGL Interactive Layer */}
      <div className="hero-slats-layer blend-screen">
        <MicroSlats
          preset="swell"
          color="#d5ceb7"
          glintColor="#ffffff"
          backgroundColor="transparent"
          opacity={0.8}
          slatWidth={slatWidth}
          slatHeight={slatHeight}
          gap={gap}
          roundness={0.75}
          speed={0.65}
          scale={1.4}
          swirl={0.25}
          interactive={true}
          cursorStrength={1.3}
          cursorSize={48}
          lean={0.35}
          trail={1.4}
          intro={true}
          introDuration={1.4}
        />
      </div>

      {/* 3. Atmosphere & Vignette Gradient */}
      <div className="hero-atmosphere-overlay" />

      {/* 4. UI Layer */}
      <div className="hero-ui-layer">
        {/* Navigation Bar */}
        <nav className="hero-nav">
          <div className="nav-brand">
            <span className="brand-logo">PixelMind AI</span>
          </div>

          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); if (onGetStarted) onGetStarted(); }}>How It Works</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); if (onLogin) onLogin(); }}>Contact</a>
          </div>

          <div className="nav-actions">
            <button className="btn-secondary" onClick={onLogin}>Login</button>
            <button className="btn-primary" onClick={onGetStarted}>Get Started</button>
          </div>
        </nav>

        {/* Center Content */}
        <div className="hero-center-content">
          <div className="hero-eyebrow">
            <Sparkles size={14} />
            <span>AI-POWERED APPLICANT JOURNEY &bull; GERMANY</span>
          </div>

          <h1 className="hero-title">
            Your Journey to Germany,<br />
            <span className="hero-title-accent">Made Intelligent</span>
          </h1>

          <p className="hero-description">
            PixelMind AI brings your information, documents and eligibility into one intelligent journey — helping you understand where you stand and what comes next.
          </p>

          <div className="hero-cta-group">
            <button className="cta-main" onClick={onGetStarted}>
              Get Started
              <ArrowRight size={18} />
            </button>
            <button className="cta-secondary" onClick={onLogin}>
              Login
            </button>
          </div>
        </div>
        
        {/* Spacer for bottom */}
        <div className="hero-footer-spacer"></div>
      </div>
    </div>
  );
};

export default Hero;
