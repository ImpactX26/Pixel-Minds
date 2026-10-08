import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both your email/username and password.');
      return;
    }

    setIsLoading(true);

    // TODO: Replace demo authentication with real authentication later.
    // Demo authentication accepting ANY valid non-empty credentials
    setTimeout(() => {
      localStorage.setItem('pixelmind_demo_auth', 'true');
      localStorage.setItem('pixelmind_demo_user', identifier.trim());
      setIsLoading(false);
      navigate('/home');
    }, 400);
  };

  const fillDemoCredentials = () => {
    setIdentifier('demo@pixelmind.ai');
    setPassword('demo12345');
    setError('');
  };

  return (
    <div className="login-viewport">
      {/* Ambient gradient glow accents */}
      <div className="login-ambient-blob blob-1" />
      <div className="login-ambient-blob blob-2" />

      <div className="login-header-nav">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="login-container">
        <div className="login-card">
          {/* Brand header */}
          <div className="login-brand-section">
            <div className="brand-badge">
              <Sparkles size={14} className="badge-sparkle" />
              <span>PixelMind AI Germany</span>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Access your intelligent applicant journey to Germany
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="identifier">Email or Username</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="identifier"
                  type="text"
                  placeholder="name@example.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="input-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <span className="demo-hint-text">Any password accepted</span>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter any password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-submit-btn" 
              disabled={isLoading}
            >
              <span>{isLoading ? 'Signing In...' : 'Log In to Dashboard'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Demo helper card */}
          <div className="demo-notice-card">
            <div className="demo-notice-header">
              <span className="demo-tag">HACKATHON DEMO MODE</span>
              <button 
                type="button" 
                className="fill-demo-btn"
                onClick={fillDemoCredentials}
              >
                Auto-fill demo credentials
              </button>
            </div>
            <p className="demo-notice-desc">
              Any email/username and any password will be accepted for this demonstration.
            </p>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2026 PixelMind AI &bull; Intelligent Relocation &amp; Education Assistant</p>
        </div>
      </div>
    </div>
  );
}
