import React, { useState, useEffect } from 'react';
import { applicantApi } from '../api/applicant';

export function AuthModal({ initialMode = 'login', isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const isDemoEnabled = import.meta.env.VITE_DEMO_MODE !== 'false';
  
  // Register fields
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [country, setCountry] = useState('India');
  const [goal, setGoal] = useState('Software Engineer in Germany');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e, demoTargetId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = (demoTargetId || emailOrId).trim();
    if (!query) {
      setError('Please enter your email, applicant ID, or demo username.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let applicant = null;

      // Check if demo login (e.g. username 'abc' with or without password 'abc')
      if (query === 'abc' || demoTargetId) {
        if (query === 'abc' && password && password !== 'abc' && !demoTargetId) {
          setError('Invalid demo password. (Use password "abc" for demo)');
          setLoading(false);
          return;
        }
        applicant = await applicantApi.demoLogin({ username: query, applicantId: demoTargetId || query });
      } else if (query.includes('@')) {
        applicant = await applicantApi.getByEmail(query);
      } else {
        applicant = await applicantApi.getProfile(query);
      }

      if (applicant && applicant.id) {
        onSuccess(applicant);
      } else {
        setError('Applicant record not found. Please check your credentials or register below.');
      }
    } catch (err) {
      console.warn('Login lookup notice:', err);
      const msg = err?.response?.data?.message || 'Applicant not found with this email or ID. Please register to begin your journey.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!name.trim() || !registerEmail.trim()) {
      setError('Please fill in your name and email.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const applicant = await applicantApi.create({
        name: name.trim(),
        email: registerEmail.trim().toLowerCase(),
        country: country.trim() || 'India',
        goal: goal.trim() || 'Software Engineer in Germany',
      });

      if (applicant && applicant.id) {
        onSuccess(applicant);
      } else {
        setError('Could not create account. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err?.response?.data?.message || 'Failed to create applicant account. Email might already exist.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(3, 7, 18, 0.8)',
      backdropFilter: 'blur(16px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(213, 206, 183, 0.25)',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(213, 206, 183, 0.08)',
        padding: '2rem',
        color: '#f1f5f9',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            marginBottom: '0.25rem'
          }}>
            PixelMind AI
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            {mode === 'login' ? 'Sign in to access your Germany Journey' : 'Begin your Germany migration journey'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: mode === 'login' ? 'rgba(213, 206, 183, 0.2)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: mode === 'register' ? 'rgba(213, 206, 183, 0.2)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Get Started
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            color: '#fca5a5'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Email / Applicant ID / Username
              </label>
              <input
                type="text"
                required
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="e.g. abc or your email / applicant ID"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {emailOrId.trim() === 'abc' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Enter 'abc')</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="abc"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                border: 'none',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Verifying Account...' : 'Continue to Dashboard →'}
            </button>

            {/* Quick Access Profile Selector */}
            {isDemoEnabled && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Quick Access Profiles (1-Click)
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    ACTIVE
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      setEmailOrId('abc');
                      setPassword('abc');
                      handleLogin(e, 'demo-fully-populated-123');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(213, 206, 183, 0.2)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>🌟 Rahul Sharma (Software Engineer)</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>All 8 Stages Complete • Verified Documents • CV • Conclusion</div>
                    </div>
                    <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.75rem' }}>Select →</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleLogin(e, 'demo-fresh-1')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>🏥 Sarah Mitchell (Healthcare & Nursing)</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sarah Mitchell • Requirements & Qualification stage</div>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Select →</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleLogin(e, 'demo-fresh-2')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>☁️ Devon Chen (Cloud Solutions Architect)</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Devon Chen • Ready for Document Upload stage</div>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Select →</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="rahul.sharma@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                  Target Goal / Role
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Software Engineer in Germany"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                border: 'none',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Creating Applicant Profile...' : 'Start My Germany Journey →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
