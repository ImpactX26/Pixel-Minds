import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { applicantApi, journeyApi, documentApi, qualificationApi, nextActionApi, chatApi, cvApi } from './api';
import useApi from './hooks/useApi';
import FlipCard from './components/FlipCard';
import LoadingButton from './components/LoadingButton';
import MagicBento from './components/MagicBento';
import DecayCard from './components/DecayCard';
import DepthCarousel from './components/DepthCarousel';
import LineSidebar from './components/LineSidebar';
import GooeyNav from './components/GooeyNav';
import CvGenerationView from './components/CvGenerationView';
import ConclusionView from './components/ConclusionView';
import Hero from './components/hero/Hero';
import AuthModal from './components/AuthModal';
import { motion, AnimatePresence } from 'motion/react';

function GlobalStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleLoading = (e) => setLoading(e.detail.isLoading);
    const handleError = (e) => {
      setError(e.detail.message);
      setTimeout(() => setError(null), 5000);
    };

    window.addEventListener('api-loading', handleLoading);
    window.addEventListener('api-error', handleError);

    return () => {
      window.removeEventListener('api-loading', handleLoading);
      window.removeEventListener('api-error', handleError);
    };
  }, []);

  return (
    <>
      {loading && <div className="global-loader" />}
      {error && <div className="global-error">{error}</div>}
    </>
  );
}

const Icon = ({ name, size = 20, stroke = 2, className = '' }) => {
  const paths = {
    plane: <><path d="M2 12h20"/><path d="m13 5 7 7-7 7"/><path d="M6 9 3 5"/><path d="m6 15-3 4"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></>,
    docs: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></>,
    checklist: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 8 1.5 1.5L12 7M14 9h3M8 14l1.5 1.5L12 13M14 15h3"/></>,
    bot: <><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M12 2v4M8 12h.01M16 12h.01M8 16h8"/><circle cx="12" cy="2" r="1"/></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-4-.9L4 20l1.4-3.1A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    settings: <><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    x: <path d="M18 6L6 18M6 6l12 12"/>,
    phone: <><path d="M6.6 3h2.5L10.5 8 8 9.5a14 14 0 0 0 6.5 6.5l1.5-2.5 5 1.4v2.5c0 1.2-1 2.1-2.2 2.1C11.1 19.5 4.5 12.9 4.5 4.2 4.5 3.5 5.4 3 6.6 3Z"/></>,
    send: <><path d="m3 3 18 9-18 9 4-9Z"/><path d="M7 12h14"/></>,
    paperclip: <path d="m20 11-8.5 8.5a5 5 0 0 1-7.1-7.1L13 3.8a3.5 3.5 0 1 1 5 5L9.9 16.9a2 2 0 0 1-2.8-2.8L15 6.2"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>,
    graduation: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></>,
    star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>,
    users: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></>,
    volume: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M15.5 14 17 22l-5-3-5 3 1.5-8"/></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const steps = [
  { n: 1, title: 'Set Your Goal', desc: 'Employment Pathway', status: 'done' },
  { n: 2, title: 'Build Profile', desc: 'Auto extract information', status: 'done' },
  { n: 3, title: 'Process Documents', desc: 'AI reads and verifies', status: 'active' },
  { n: 4, title: "Find What’s Missing", desc: 'Detects incomplete info', status: 'next' },
  { n: 5, title: 'Check Requirements', desc: 'Evaluate against Germany standards', status: 'next' },
  { n: 6, title: 'Next Best Action', desc: 'Get admitted / Visa Process', status: 'next' },
];

function Logo() {
  return <div className="logo"><span className="logo-mark">e</span><span>educa<span className="logo-blue">ro</span></span></div>;
}

function Sidebar({ active, setActive }) {
  const navItems = [
    { id: 'journey', label: 'Journey Map' },
    { id: 'profile', label: 'Profile' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'eligibility', label: 'Eligibility' },
    { id: 'documents', label: 'Document Verification' },
    { id: 'actions', label: 'Next Action' },
    { id: 'resume', label: 'CV / Resume' },
    { id: 'conclusion', label: 'Conclusion' },
    { id: 'settings', label: 'Settings' },
  ];

  const activeIndex = navItems.findIndex(i => i.id === active);
  
  return <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
    <Logo />
    <div style={{ flex: 1, marginTop: '20px' }}>
      <LineSidebar 
        items={navItems.map(i => i.label)} 
        defaultActive={activeIndex !== -1 ? activeIndex : 0} 
        onItemClick={(idx) => setActive(navItems[idx].id)} 
        showIndex={false}
        itemGap={40}
      />
    </div>
  </aside>;
}

const SEARCH_INDEX = [
  // Navigation sections
  { label: 'Journey Map', desc: 'View your Germany journey overview', section: 'journey', category: 'Pages', icon: 'target' },
  { label: 'Profile', desc: 'Review and edit your profile', section: 'profile', category: 'Pages', icon: 'user' },
  { label: 'Requirements', desc: 'Track pathway eligibility', section: 'requirements', category: 'Pages', icon: 'checklist' },
  { label: 'Eligibility', desc: 'Check your eligibility status', section: 'eligibility', category: 'Pages', icon: 'check' },
  { label: 'Document Verification', desc: 'Manage verified and unverified documents', section: 'documents', category: 'Pages', icon: 'docs' },
  { label: 'Next Action', desc: 'Your step-by-step action plan', section: 'actions', category: 'Pages', icon: 'arrow' },
  { label: 'CV / Resume', desc: 'Manage your CV and resume', section: 'resume', category: 'Pages', icon: 'file' },
  { label: 'Conclusion', desc: 'Wait time and consultant info', section: 'conclusion', category: 'Pages', icon: 'globe' },
  { label: 'Settings', desc: 'Manage your account settings', section: 'settings', category: 'Pages', icon: 'settings' },
  // Programs
  { label: 'Nursing Program', desc: 'Start your nursing career in Germany', section: 'nursing', category: 'Programs', icon: 'heart' },
  { label: 'Study in Germany', desc: 'Learn German from A1 to C1', section: 'study', category: 'Programs', icon: 'book' },
  { label: 'Ausbildung', desc: 'Vocational training in Germany', section: 'ausbildung', category: 'Programs', icon: 'graduation' },
  // Quick actions
  { label: 'Upload Document', desc: 'Upload a new file to your application', section: 'documents', category: 'Actions', icon: 'upload' },
  { label: 'Upload Language Certificate', desc: 'Submit your B1 German certificate', section: 'actions', category: 'Actions', icon: 'file' },
  { label: 'Check Application Status', desc: 'View your profile completeness', section: 'application', category: 'Actions', icon: 'check' },
  { label: 'Book a Consultation', desc: 'Schedule a call with your advisor', section: 'consultant', category: 'Actions', icon: 'phone' },
  // Info items
  { label: 'What is missing from my application?', desc: 'Ask AI about missing items', section: 'messages', category: 'Ask AI', icon: 'bot' },
  { label: 'Am I qualified for Germany?', desc: 'Check your eligibility status', section: 'messages', category: 'Ask AI', icon: 'bot' },
  { label: 'What should I do next?', desc: 'Get your next recommended step', section: 'messages', category: 'Ask AI', icon: 'bot' },
  { label: 'German language requirements', desc: 'B1/B2 language proficiency details', section: 'requirements', category: 'Info', icon: 'book' },
  { label: 'Visa application process', desc: 'Steps for German work visa', section: 'actions', category: 'Info', icon: 'globe' },
  { label: 'Passport requirements', desc: 'Valid passport for 12+ months', section: 'requirements', category: 'Info', icon: 'file' },
];

function Topbar({ onNavigate, applicant, onLogout }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const contactItems = [
    { label: 'WhatsApp', href: '#' },
    { label: 'Telegram', href: '#' },
    { label: 'Call AI', href: '#' }
  ];

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SEARCH_INDEX.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups = {};
    results.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [results]);

  const flatResults = results; // for keyboard nav indexing

  const handleSelect = (item) => {
    onNavigate?.(item.section);
    setQuery('');
    setFocused(false);
    setSelectedIdx(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIdx >= 0 && flatResults[selectedIdx]) {
      e.preventDefault();
      handleSelect(flatResults[selectedIdx]);
    } else if (e.key === 'Escape') {
      setFocused(false);
      setSelectedIdx(-1);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && e.target !== inputRef.current) {
        setFocused(false);
        setSelectedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Reset selection when query changes
  useEffect(() => { setSelectedIdx(-1); }, [query]);

  const showDropdown = focused && (query.trim().length > 0 || query.length === 0);
  const hasResults = results.length > 0;
  const showSuggestions = focused && query.trim().length === 0;

  const highlightMatch = (text, q) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '2px', padding: '0 1px' }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
  };

  // suggestions shown when input is focused but empty
  const suggestions = [
    { label: 'What is missing?', section: 'messages', icon: 'bot' },
    { label: 'Upload Document', section: 'documents', icon: 'upload' },
    { label: 'Check Requirements', section: 'requirements', icon: 'checklist' },
    { label: 'Nursing Program', section: 'nursing', icon: 'heart' },
    { label: 'Next Actions', section: 'actions', icon: 'arrow' },
  ];

  return <header className="topbar">
    <div className="search-container" style={{ position: 'relative', flex: 1, maxWidth: '620px' }}>
      <div className={`search ${focused ? 'search-focused' : ''}`} onClick={() => inputRef.current?.focus()}>
        <Icon name="search" size={18}/>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Educaro anything... (e.g. What is missing from my application?)"
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            flex: 1, fontSize: '16px', color: '#1e293b',
            fontFamily: 'inherit'
          }}
        />
        {query && (
          <button
            onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
            style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center', borderRadius: '50%' }}
            aria-label="Clear search"
          >✕</button>
        )}
        <kbd className="search-kbd">⌘K</kbd>
      </div>

      {/* Dropdown */}
      {focused && (
        <div ref={dropdownRef} className="search-dropdown">
          {showSuggestions && (
            <>
              <div className="search-group-label">Quick Actions</div>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className={`search-result-item ${selectedIdx === i ? 'search-result-selected' : ''}`}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  <div className="search-result-icon"><Icon name={s.icon} size={16}/></div>
                  <span>{s.label}</span>
                  <span className="search-result-go">Go →</span>
                </div>
              ))}
            </>
          )}

          {query.trim().length > 0 && hasResults && (
            <>
              {Object.entries(grouped).map(([category, items]) => (
                <React.Fragment key={category}>
                  <div className="search-group-label">{category}</div>
                  {items.map((item, i) => {
                    const globalIdx = flatResults.indexOf(item);
                    return (
                      <div
                        key={i}
                        className={`search-result-item ${selectedIdx === globalIdx ? 'search-result-selected' : ''}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                      >
                        <div className="search-result-icon"><Icon name={item.icon} size={16}/></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="search-result-title">{highlightMatch(item.label, query)}</div>
                          <div className="search-result-desc">{item.desc}</div>
                        </div>
                        <span className="search-result-go">Go →</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </>
          )}

          {query.trim().length > 0 && !hasResults && (
            <div className="search-no-results">
              <Icon name="search" size={24}/>
              <p>No results for "<strong>{query}</strong>"</p>
              <span>Try searching for pages, programs, or actions</span>
            </div>
          )}
        </div>
      )}
    </div>
    <div className="contact-pills">
      <GooeyNav items={contactItems} animationTime={500} particleR={60} initialActiveIndex={-1} />
    </div>
    <button className="bell"><Icon name="bell" size={20}/><i/></button>
    <div
      className="profile"
      onClick={() => setShowProfileMenu(!showProfileMenu)}
      style={{ cursor: 'pointer', position: 'relative', userSelect: 'none' }}
    >
      <div className="avatar">{(applicant?.name || 'Rahul')[0].toUpperCase()}</div>
      <div>
        <strong>{applicant?.name || 'Rahul Sharma'}</strong>
        <small>{applicant?.goal ? (applicant.goal.length > 20 ? applicant.goal.substring(0, 18) + '...' : applicant.goal) : 'Applicant'}</small>
      </div>
      <span>⌄</span>
      {showProfileMenu && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0',
            padding: '8px',
            minWidth: '180px',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{applicant?.name || 'Rahul Sharma'}</div>
            <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>{applicant?.email || 'applicant@educaro.de'}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(false);
              onLogout?.();
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#dc2626',
              background: '#fef2f2',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Sign Out / Home
          </button>
        </div>
      )}
    </div>
  </header>;
}

function JourneyHero({ view, setView, setActive }) {
  const [activeStep, setActiveStep] = useState(3);
  return <section className={`hero view-${view}`}>
    <div className="hero-bg"/>
    <div className="hero-header">
      <div className="journey-title"><span className="title-icon"><Icon name="target" size={20}/></span><div><h1>Your Germany Journey</h1><p>Don’t just navigate. Let the AI navigate for you.</p></div></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.75)', padding: '4px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setActive?.('nursing')} 
            style={{ border: 0, background: 'rgba(244, 63, 94, 0.25)', color: '#fda4af', padding: '6px 14px', borderRadius: '18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="heart" size={14} /> Nursing
          </button>
          <button 
            onClick={() => setActive?.('study')} 
            style={{ border: 0, background: 'rgba(14, 165, 233, 0.25)', color: '#7dd3fc', padding: '6px 14px', borderRadius: '18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="book" size={14} /> Study
          </button>
          <button 
            onClick={() => setActive?.('ausbildung')} 
            style={{ border: 0, background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', padding: '6px 14px', borderRadius: '18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="graduation" size={14} /> Ausbildung
          </button>
        </div>
        <div className="view-toggle">
          <button className={view === 'globe' ? 'on' : ''} onClick={() => setView('globe')}><Icon name="globe" size={17}/> Globe View</button>
          <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><Icon name="map" size={17}/> Map View</button>
        </div>
      </div>
    </div>
    <div className="route">
      <div className="country india"><div className="pin pin-india">🇮🇳</div><strong>INDIA</strong></div>
      <div className="country germany"><div className="pin pin-germany">🇩🇪</div><strong>GERMANY</strong></div>
      <svg className="flight-path" viewBox="0 0 1000 430" preserveAspectRatio="none">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#e9f5ff" />
          </marker>
        </defs>
        <path d="M855 365 C740 330 680 295 585 270 C500 246 430 205 350 190 C280 177 210 135 125 90" markerEnd="url(#arrow)" />
      </svg>
      <div className="plane"><Icon name="plane" size={45}/></div>
      <div className="step step-1" onClick={() => setActive?.('nursing')} style={{ cursor: 'pointer' }} title="Click to open Nursing Pathway">
        <span className="step-dot done">✓</span>
        <div><b>1. Set Your Goal</b><small>Nursing • Study • Ausbildung ↗</small></div>
      </div>
      <div className="step step-2"><span className="step-dot done">✓</span><div><b>2. Build Profile</b><small>Auto extract information</small></div></div>
      <div className="step step-3"><span className="step-dot active">3</span><div><b>3. Process Documents</b><small>AI reads and verifies</small></div></div>
      <div className="step step-4"><span className="step-dot">4</span><div><b>4. Find What’s Missing</b><small>Detects incomplete info</small></div></div>
      <div className="step step-5"><span className="step-dot">✓</span><div><b>5. Check Requirements</b><small>Evaluate against Germany standards</small></div></div>
      <div className="step step-6"><span className="step-dot done">✓</span><div><b>6. Next Best Action</b><small>Get admitted / Visa Process</small></div></div>
    </div>
    <div className="current-stage"><div className="stage-icon"><Icon name="plane"/></div><div><small>Current Stage</small><strong>Process Your Documents</strong><span>AI is extracting information from your uploaded documents...</span></div><div className="spinner"/></div>
  </section>;
}

function ProgressCard() {
  return (
    <FlipCard
      front={
        <div className="progress-card card" style={{ margin: 0, height: '100%', boxSizing: 'border-box' }}>
          <div className="progress-ring"><span>68%</span></div>
          <div><b>Overall Progress</b><small>3 of 5 steps completed</small></div>
        </div>
      }
      back={
        <div className="progress-card card" style={{ margin: 0, height: '100%', boxSizing: 'border-box', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <b style={{ color: '#10b981', fontSize: '20px' }}>On Track</b>
              <p style={{ marginTop: '5px', fontSize: '15px', color: '#cbd5e1' }}>You are closer to your Germany journey!</p>
            </div>
          </div>
        </div>
      }
      width="100%"
      height={110}
      radius={16}
      shadow={false}
    />
  );
}

function NextAction({ onUpload, isUploading, applicantId = '123' }) {
  const [actionData, setActionData] = useState(null);

  const fetchAction = useCallback(() => {
    nextActionApi.getRecommendedAction(applicantId)
      .then((res) => {
        setActionData(res.data);
      })
      .catch(() => {
        nextActionApi.getNextAction()
          .then((res) => setActionData(res.data))
          .catch(() => {});
      });
  }, [applicantId]);

  useEffect(() => {
    fetchAction();
    const interval = setInterval(fetchAction, 4000);
    return () => clearInterval(interval);
  }, [fetchAction]);

  const title = actionData?.title || 'Upload your German language certificate';
  const reason = actionData?.reason || 'This is required to unlock your visa application step.';
  const priority = actionData?.priority || 'HIGH';
  const isReady = actionData?.requirementCode === 'READY' || title.toLowerCase().includes('proceed');
  const isMismatch = actionData?.action === 'RESOLVE_CONFLICT' || reason.startsWith('⚠️');

  const badgeText = isReady ? 'READY' : isMismatch ? 'CLARIFICATION' : priority === 'HIGH' ? 'HIGH PRIORITY' : 'NEXT STEP';
  const badgeBg = isReady ? '#dcfce7' : isMismatch ? '#fef3c7' : '#fee2e2';
  const badgeColor = isReady ? '#16a34a' : isMismatch ? '#d97706' : '#ef4444';
  const iconColor = isReady ? '#16a34a' : isMismatch ? '#d97706' : '#2563eb';
  const iconBg = isReady ? '#f0fdf4' : isMismatch ? '#fffbeb' : '#eff6ff';

  return (
    <div className="next-action card" style={{ padding: '24px', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', borderTop: `4px solid ${iconColor}` }}>
      <div className="card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
          <Icon name={isReady ? 'check' : isMismatch ? 'alert' : 'bell'} size={18} color={iconColor}/>
          {isReady ? 'READY TO PROCEED' : isMismatch ? 'ATTENTION REQUIRED' : 'ACTION REQUIRED'}
        </span>
        <em style={{ background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontStyle: 'normal', fontWeight: '800', letterSpacing: '0.5px' }}>
          {badgeText}
        </em>
      </div>
      <div className="action-main" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div className="doc-icon" style={{ width: '50px', height: '50px', borderRadius: '12px', background: iconBg, color: iconColor, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={isReady ? 'check' : isMismatch ? 'alert' : 'file'} size={26}/>
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#1e293b', lineHeight: '1.3' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: '1.4' }}>{reason}</p>
        </div>
      </div>
      {!isReady && (
        <div style={{ width: '100%' }}>
          <LoadingButton onUpload={onUpload} label={isMismatch ? 'Upload Corrected Document' : 'Upload Document'} isUploading={isUploading} />
        </div>
      )}
    </div>
  );
}

function RecentActivity() {
  const items = [
    ['done','Profile created successfully','2 hours ago'], ['done','CV processed','3 hours ago'], ['done','Degree certificate verified','3 hours ago'], ['info','German language certificate pending','5 hours ago'], ['wait','Qualification check in progress','5 hours ago']
  ];
  return <div className="recent card"><div className="recent-title"><b>Recent Activity</b><button>View All</button></div>{items.map(([type, text, time], i) => <div className="activity" key={i}><span className={`activity-dot ${type}`}>{type === 'done' ? '✓' : type === 'info' ? '•' : '◷'}</span><span>{text}</span><time>{time}</time></div>)}</div>;
}


function AccessCard() {
  const items = [
    { 
      type: 'whatsapp', 
      icon: '◉', 
      title: 'WhatsApp Bot', 
      desc: 'Instant chat anytime',
      action: 'Chat',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0'
    },
    { 
      type: 'telegram', 
      icon: '➤', 
      title: 'Telegram Bot', 
      desc: 'Updates on Telegram',
      action: 'Open',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe'
    },
    { 
      type: 'call', 
      icon: '☎', 
      title: 'AI Voice Call', 
      desc: 'Talk directly to AI',
      action: 'Call',
      color: '#7c3aed',
      bg: '#faf5ff',
      border: '#e9d5ff',
      highlight: true
    },
    { 
      type: 'web', 
      icon: '▣', 
      title: 'Web Portal', 
      desc: 'Full web experience',
      action: 'Launch',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd'
    }
  ];

  return (
    <section className="access card" style={{ padding: '22px' }}>
      <div className="section-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h2>Access Your AI Companion</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>Same journey. Simple journey. Multiple ways to connect.</p>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
            ● 24/7 Live
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '14px' }}>
        {items.map(item => (
          <div
            key={item.title}
            className="access-card-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: `1px solid ${item.border}`,
              background: item.bg,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ffffff',
                color: item.color,
                display: 'grid',
                placeItems: 'center',
                fontSize: '19px',
                fontWeight: '700',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                flexShrink: 0
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>{item.title}</b>
              <small style={{ display: 'block', fontSize: '13px', color: '#64748b', marginTop: '1px' }}>{item.desc}</small>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: item.color, background: '#ffffff', padding: '3px 8px', borderRadius: '6px', border: `1px solid ${item.border}` }}>
              {item.action} →
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ApplicationStatus() {
  const rows = [['Profile Completeness','92%','green'],['Documents','3/4','blue'],['Requirements','3/4','blue'],['Qualification','In Progress','red'],['Next Action','Pending','orange']];
  return <section className="status card"><div className="status-title"><b>My Application Status</b><button>View Details</button></div>{rows.map(([label,value,color],i) => <div className="status-row" key={label}><span className={`status-icon ${color}`}><Icon name={i === 0 ? 'check' : i === 4 ? 'clock' : 'file'} size={15}/></span><div className="status-content"><div><b>{label}</b><span>{value}</span></div>{i < 3 && <div className="bar"><i style={{width: i === 0 ? '92%' : '75%'}}/></div>}</div></div>)}</section>;
}

function ProfileView() {
  const [profile, setProfile] = useState({
    personal: { fullName: '', dateOfBirth: '', nationality: '' },
    education: { degree: '', field: '', institution: '', graduationYear: '' },
    employment: { company: '', jobTitle: '', startDate: '', endDate: '', experience: '' },
    skills: { technicalSkills: [], otherSkills: [] },
    languages: []
  });

  const applicantId = '123';

  useEffect(() => {
    // Initial fetch from backend
    chatApi.getProfile(applicantId).then(res => {
      if (res && (res.data || res)) {
        const data = res.data || res;
        if (data.education || data.skills || data.personal || data.employment || data.languages) {
          setProfile(prev => ({
            personal: { ...prev.personal, ...(data.personal || {}) },
            education: { ...prev.education, ...(data.education || {}) },
            employment: { ...prev.employment, ...(data.employment || {}) },
            skills: {
              technicalSkills: data.skills?.technicalSkills || prev.skills.technicalSkills,
              otherSkills: data.skills?.otherSkills || prev.skills.otherSkills,
            },
            languages: data.languages || prev.languages,
          }));
        }
      }
    }).catch(() => {});

    const handleProfileUpdate = (e) => {
      const data = e.detail?.profile || e.detail;
      if (data) {
        setProfile(prev => ({
          personal: { ...prev.personal, ...(data.personal || {}) },
          education: { ...prev.education, ...(data.education || {}) },
          employment: { ...prev.employment, ...(data.employment || {}) },
          skills: {
            technicalSkills: data.skills?.technicalSkills || (Array.isArray(data.skills) ? data.skills : prev.skills.technicalSkills),
            otherSkills: data.skills?.otherSkills || prev.skills.otherSkills,
          },
          languages: data.languages || prev.languages,
        }));
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [applicantId]);

  const p = profile.personal || {};
  const edu = profile.education || {};
  const emp = profile.employment || {};
  const skills = profile.skills || {};
  const langs = profile.languages || [];

  const displayName = p.fullName || 'Applicant Profile';
  const initials = (p.fullName ? p.fullName.split(' ').map(n=>n[0]).join('') : 'AP').substring(0,2).toUpperCase();

  return (
    <div className="card dashboard-card-enhanced" style={{ padding: '32px' }}>
      <div className="section-title" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Applicant Profile</h2>
          <p>Progressively built from your AI conversations and verified data.</p>
        </div>
        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="bot" size={16} /> AI Synced
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
            {initials}
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: '#1e293b' }}>{displayName}</h3>
          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '14px' }}>
            {emp.jobTitle ? `${emp.jobTitle}` : edu.degree ? `${edu.degree} Graduate` : 'Candidate'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {p.nationality && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{p.nationality}</span>}
            {edu.graduationYear && <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>Class of {edu.graduationYear}</span>}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Personal Information */}
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="user" size={18} /> Personal Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Full Name</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{p.fullName || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Date of Birth</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{p.dateOfBirth || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Nationality</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{p.nationality || '—'}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Education */}
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="award" size={18} /> Education
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Degree</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{edu.degree || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Field of Study</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{edu.field || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Institution</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{edu.institution || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Graduation Year</label>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{edu.graduationYear ? String(edu.graduationYear) : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Employment, Skills, Languages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Section 3: Employment / Experience */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="globe" size={18} /> Employment & Experience
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Company</span>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>{emp.company || '—'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Job Title</span>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>{emp.jobTitle || '—'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Experience</span>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>{emp.experience || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Section 4: Skills */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="star" size={18} /> Skills
          </h4>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px' }}>Technical Skills</span>
            {skills.technicalSkills && skills.technicalSkills.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {skills.technicalSkills.map((s, idx) => (
                  <span key={idx} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>No technical skills recorded yet</span>
            )}
          </div>
        </div>

        {/* Section 5: Languages */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="chat" size={18} /> Languages
          </h4>
          {langs && langs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {langs.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{l.language}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px' }}>
                    {l.proficiency || 'Documented'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>No language details recorded yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EligibilityView() {
  const criteria = [
    { name: 'Education Level', requirement: 'Bachelor\'s Degree or equivalent', current: 'B.Sc Nursing', status: 'pass' },
    { name: 'Work Experience', requirement: 'Minimum 1 year relevant experience', current: '3 Years (Apollo)', status: 'pass' },
    { name: 'Language Proficiency', requirement: 'B1 German (Goethe/telc)', current: 'A2 (In progress)', status: 'warning' },
    { name: 'Age Criteria', requirement: 'Below 40 years for nursing visa', current: '26 Years', status: 'pass' },
    { name: 'Financial Proof', requirement: 'Sufficient blocked account funds', current: 'Pending declaration', status: 'fail' }
  ];

  return (
    <div className="card dashboard-card-enhanced" style={{ padding: '32px' }}>
      <div className="section-title" style={{ marginBottom: '24px' }}>
        <h2>Eligibility Assessment</h2>
        <p>Review how your profile matches against Germany's immigration requirements.</p>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '26px', fontWeight: 'bold' }}>75%</span>
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#166534', fontSize: '20px' }}>High Chance of Approval</h3>
          <p style={{ margin: 0, color: '#15803d', fontSize: '16px' }}>You meet most of the core requirements! Focus on improving your German language level to unlock your visa.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {criteria.map((item, idx) => (
          <div key={idx} style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', 
              background: item.status === 'pass' ? '#10b981' : item.status === 'warning' ? '#f59e0b' : '#ef4444',
              color: '#fff'
            }}>
              <Icon name={item.status === 'pass' ? 'check' : item.status === 'warning' ? 'clock' : 'search'} size={16} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '17px', color: '#1e293b' }}>{item.name}</h4>
              <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>Requires: {item.requirement}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '600',
                background: item.status === 'pass' ? '#dcfce7' : item.status === 'warning' ? '#fef3c7' : '#fee2e2',
                color: item.status === 'pass' ? '#166534' : item.status === 'warning' ? '#b45309' : '#991b1b'
              }}>
                Current: {item.current}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function RequirementsView({ applicantId = '123' }) {
  const [reqData, setReqData] = useState({
    country: null,
    role: null,
    company: null,
    missingInformation: ['role'],
  });

  useEffect(() => {
    chatApi.getRequirements(applicantId).then((data) => {
      if (data && (data.country || data.role || data.company)) {
        setReqData(prev => ({ ...prev, ...data }));
      }
    }).catch(() => {});

    const handleUpdate = (e) => {
      if (e.detail?.requirement) {
        setReqData({
          ...e.detail.requirement,
          missingInformation: e.detail.missingInformation || [],
        });
      }
    };

    window.addEventListener('requirement-updated', handleUpdate);
    return () => window.removeEventListener('requirement-updated', handleUpdate);
  }, [applicantId]);

  return (
    <div className="dashboard">
      <div className="dashboard-card-enhanced">
        <div className="section-title" style={{ marginBottom: '24px' }}>
          <h2>Pathway Requirements</h2>
          <p>AI-extracted employment requirement for your journey to Germany.</p>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e40af', background: '#dbeafe', padding: '3px 10px', borderRadius: '12px' }}>
              EMPLOYMENT PATHWAY
            </span>
            <h3 style={{ margin: '8px 0 4px', color: '#1e3a8a', fontSize: '20px' }}>
              {reqData.role ? reqData.role : 'Target Role Pending'} {reqData.country ? `in ${reqData.country}` : ''}
              {reqData.company ? ` at ${reqData.company}` : ''}
            </h3>
            <p style={{ margin: 0, color: '#3b82f6', fontSize: '15px' }}>
              {reqData.role && reqData.country
                ? 'Requirement sufficiently defined. Ready for profile & qualification.'
                : 'Chat with Educaro AI to specify missing requirement details.'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '700',
              background: reqData.role && reqData.country ? '#dcfce7' : '#fef3c7',
              color: reqData.role && reqData.country ? '#166534' : '#b45309'
            }}>
              {reqData.role && reqData.country ? '✓ Requirements Set' : '● Action Required'}
            </span>
          </div>
        </div>

        <div className="req-list">
          {[
            {
              title: 'Destination Country',
              value: reqData.country || 'Not specified (Required)',
              status: reqData.country ? 'done' : 'pending',
              desc: 'Target country for your employment journey.'
            },
            {
              title: 'Target Job Role',
              value: reqData.role || 'Not specified (Required)',
              status: reqData.role ? 'done' : 'pending',
              desc: 'Desired professional position or field.'
            },
            {
              title: 'Target Company',
              value: reqData.company || 'Open / Any (Optional)',
              status: reqData.company ? 'done' : 'optional',
              desc: 'Specific employer preference if applicable.'
            },
            {
              title: 'Language & Degree Equivalency',
              value: reqData.role ? `Standard requirements for ${reqData.role}` : 'Pending role specification',
              status: 'info',
              desc: 'Required certificates will be evaluated based on your target role.'
            }
          ].map((req, i) => (
            <div key={i} className="req-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="req-icon" style={{
                background: req.status === 'done' ? '#dcfce7' : req.status === 'pending' ? '#fee2e2' : '#e2e8f0',
                color: req.status === 'done' ? '#16a34a' : req.status === 'pending' ? '#dc2626' : '#64748b'
              }}>
                <span>{req.status === 'done' ? '✓' : i + 1}</span>
              </div>
              <div className="req-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>{req.title}</h4>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: req.status === 'done' ? '#16a34a' : req.status === 'pending' ? '#dc2626' : '#64748b' }}>
                    {req.value}
                  </span>
                </div>
                <p>{req.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentVerificationView({ applicantId = '123', onUpload, isUploading, uploadedFiles = [] }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const fetchDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await documentApi.getDocuments(applicantId);
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        setDocuments(list);
        if (list.length > 0 && !selectedDocId) {
          setSelectedDocId(list[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const handleUploaded = () => {
      fetchDocs();
    };
    window.addEventListener('document-uploaded', handleUploaded);
    return () => window.removeEventListener('document-uploaded', handleUploaded);
  }, [applicantId]);

  const handleProcess = async (docId, rawText) => {
    setProcessingId(docId);
    try {
      const res = await documentApi.processDocument(docId, rawText);
      const updated = res?.data || res;
      setDocuments(prev => prev.map(d => (d.id === docId ? updated : d)));
      setSelectedDocId(docId);
    } catch (err) {
      console.error('Processing failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0] || null;
  const verificationResult = selectedDoc?.extractedData?.verificationResult || null;
  const extractedData = selectedDoc?.extractedData?.extractedData || selectedDoc?.extractedData || {};

  const verifiedCount = documents.filter(d => d.status === 'verified' || d.extractedData?.verificationResult?.overallStatus === 'VERIFIED').length;
  const mismatchCount = documents.filter(d => d.status === 'conflict' || d.extractedData?.verificationResult?.overallStatus === 'MISMATCH').length;

  return (
    <div className="dashboard">
      <div className="dashboard-card-enhanced">
        <div className="section-title" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Document Verification</h2>
            <p>AI information extraction, evidence cross-checking, and profile comparison.</p>
          </div>
          <button 
            onClick={fetchDocs} 
            className="btn-outline" 
            style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="clock" size={14} /> Refresh Status
          </button>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Uploaded</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>{documents.length}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>Verified & Matched</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>{verifiedCount}</div>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>Clarifications Needed</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>{mismatchCount}</div>
          </div>
        </div>

        {/* Document Selection List */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '12px', fontWeight: '700' }}>Uploaded Documents</h3>
          {documents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              No documents uploaded yet. Upload a CV, Degree Certificate, Experience Letter, or Language Certificate below.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const vRes = doc.extractedData?.verificationResult;
                const isVer = doc.status === 'verified' || vRes?.overallStatus === 'VERIFIED';
                const isMis = doc.status === 'conflict' || vRes?.overallStatus === 'MISMATCH';
                const isProc = doc.status === 'processing' || processingId === doc.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isSelected ? '#eff6ff' : '#fff',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', background: '#e2e8f0', color: '#475569', textTransform: 'uppercase' }}>
                        {doc.type}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: isProc ? '#fef3c7' : isVer ? '#dcfce7' : isMis ? '#fee2e2' : '#e0f2fe',
                        color: isProc ? '#b45309' : isVer ? '#166534' : isMis ? '#991b1b' : '#0369a1'
                      }}>
                        {isProc ? 'PROCESSING' : isVer ? 'VERIFIED' : isMis ? 'MISMATCH' : (vRes?.overallStatus || doc.status?.toUpperCase() || 'UPLOADED')}
                      </span>
                    </div>
                    <b style={{ fontSize: '15px', color: '#1e293b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.name}
                    </b>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                      </small>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProcess(doc.id);
                        }}
                        disabled={isProc}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isProc ? 'Analyzing...' : 'Re-verify'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Document Detailed Verification Card */}
        {selectedDoc && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Document Verification Details
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: '#1e293b' }}>
                  {selectedDoc.name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background:
                    verificationResult?.overallStatus === 'VERIFIED'
                      ? '#dcfce7'
                      : verificationResult?.overallStatus === 'MISMATCH'
                      ? '#fee2e2'
                      : '#e0f2fe',
                  color:
                    verificationResult?.overallStatus === 'VERIFIED'
                      ? '#166534'
                      : verificationResult?.overallStatus === 'MISMATCH'
                      ? '#991b1b'
                      : '#0369a1'
                }}>
                  Status: {verificationResult?.overallStatus || selectedDoc.status?.toUpperCase() || 'UPLOADED'}
                </span>
                <button
                  onClick={() => handleProcess(selectedDoc.id)}
                  disabled={processingId === selectedDoc.id}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {processingId === selectedDoc.id ? 'Processing...' : 'Run Verification'}
                </button>
              </div>
            </div>

            {/* Clarification Alert (Step 6) */}
            {verificationResult?.clarificationRequired && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center', flexShrink: 0, fontWeight: 'bold' }}>
                  ⚠
                </div>
                <div>
                  <b style={{ color: '#991b1b', fontSize: '15px' }}>Clarification Required</b>
                  <p style={{ margin: '3px 0 0', color: '#b91c1c', fontSize: '14px', lineHeight: '1.4' }}>
                    {verificationResult.clarificationMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Field Comparison Grid (Step 4, 5, 7) */}
            {verificationResult?.fields && verificationResult.fields.length > 0 ? (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', color: '#475569', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Field Comparison & Evidence Provenance
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {verificationResult.fields.map((f, i) => {
                    const isMatch = f.status === 'MATCH';
                    const isMismatch = f.status === 'MISMATCH';
                    const isDocOnly = f.status === 'DOCUMENT_ONLY';
                    const isNotFound = f.status === 'NOT_FOUND';

                    return (
                      <div
                        key={i}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: isMismatch ? '#fff5f5' : isMatch ? '#f8fafc' : '#fcfcfc',
                          border: isMismatch ? '1px solid #fecaca' : '1px solid #e2e8f0',
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr 1fr 120px',
                          gap: '12px',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <b style={{ fontSize: '14px', color: '#1e293b', textTransform: 'capitalize' }}>
                            {f.field.replace(/([A-Z])/g, ' $1')}
                          </b>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            {isMatch && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: '700' }}>✓ Match</span>}
                            {isMismatch && <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700' }}>✕ Mismatch</span>}
                            {isDocOnly && <span style={{ color: '#2563eb', fontSize: '13px', fontWeight: '600' }}>+ Document Only</span>}
                            {isNotFound && <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>− Not Found</span>}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Profile Value</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {Array.isArray(f.profileValue) ? f.profileValue.join(', ') : f.profileValue || '—'}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Document Evidence</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: isMismatch ? '#dc2626' : '#1e293b' }}>
                            {Array.isArray(f.documentValue) ? f.documentValue.join(', ') : f.documentValue || '—'}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isMatch ? '#dcfce7' : isMismatch ? '#fee2e2' : '#f1f5f9',
                            color: isMatch ? '#166534' : isMismatch ? '#991b1b' : '#475569'
                          }}>
                            {f.provenance}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', marginBottom: '24px' }}>
                Click "Run Verification" to extract and compare document fields against your profile.
              </div>
            )}

            {/* Extracted Data Pills (Step 3) */}
            {Object.keys(extractedData).length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Extracted Structured Data
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(extractedData)
                    .filter(([k, v]) => v !== null && v !== undefined && k !== 'error' && k !== 'rawText' && k !== 'verificationResult')
                    .map(([k, v]) => (
                      <span key={k} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', color: '#334155' }}>
                        <b>{k}:</b> {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Box */}
        <div style={{ padding: '36px 20px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '52px', height: '52px', background: '#e2e8f0', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#64748b', marginBottom: '14px' }}>
            <Icon name="upload" size={24}/>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#1e293b' }}>Upload Document for Verification</h3>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
            Supported formats: PDF, JPG, PNG, TXT (CV, Degree, Experience Letter, Language Certificate)
          </p>
          <div style={{ width: '220px' }}>
            <LoadingButton onUpload={onUpload} label="Browse Files" isUploading={isUploading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ applicantId = '123', onClose }) {
  const { data: history, execute: loadHistory } = useApi(chatApi.getHistory);
  const { execute: sendMsgApi } = useApi(chatApi.sendMessage);
  
  const [messages, setMessages] = useState([{role:'ai', text:'Hi Rahul! I checked your application. Your German language certificate is still pending.'}]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  
  useEffect(() => {
    loadHistory(applicantId).then(data => {
      if (data && data.length > 0) setMessages(data);
    }).catch(e => console.error("Chat history load failed", e));

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [applicantId, loadHistory]);

  const send = async () => { 
    if (!input.trim()) return; 
    const t = input.trim(); 
    setMessages(m => [...m, {role:'user',text:t}]); 
    setInput('');
    try {
      const response = await sendMsgApi(applicantId, t);
      if (response && (response.message || response.reply)) {
        setMessages(m => [...m, {role:'ai', text: response.message || response.reply}]);
      } else {
        setMessages(m => [...m, {role:'ai', text: `I'll check that for you.`}]);
      }
      if (response && response.requirement) {
        window.dispatchEvent(new CustomEvent('requirement-updated', { detail: response }));
      }
      if (response && response.profile) {
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: response }));
      }
    } catch (e) {
      const errMsg = e?.response?.data?.message || 'Sorry, I am having trouble connecting right now.';
      setMessages(m => [...m, {role:'ai', text: errMsg}]);
    }
  };

  const toggleVoice = async () => {
    if (isVoiceProcessing) return;

    if (isRecording) {
      // Second click: stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      return;
    }

    // First click: start recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessages(m => [...m, { role: 'ai', text: '⚠️ Voice capture is not supported in this browser environment.' }]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsVoiceProcessing(true);

        const recordedBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        
        if (recordedBlob.size < 200) {
          setIsVoiceProcessing(false);
          return;
        }

        // Validate 10 MB limit
        if (recordedBlob.size > 10 * 1024 * 1024) {
          setMessages(m => [
            ...m,
            { role: 'ai', text: '⚠️ Voice recording is too large (exceeds 10 MB). Please record a shorter message.' }
          ]);
          setIsVoiceProcessing(false);
          return;
        }

        try {
          // Send audio as multipart/form-data
          const res = await chatApi.sendVoiceMessage(applicantId, recordedBlob, recordedBlob.type);
          const data = res?.data || res;
          const userSpoken = data.userText || '🎙️ (Voice Message)';
          const aiReply = data.message || data.reply || "I've reviewed your application status.";

          // Display recognized text and AI response in chat (with audioBase64 attached)
          setMessages(m => [
            ...m,
            { role: 'user', text: userSpoken },
            { role: 'ai', text: aiReply, audioBase64: data.audioBase64 }
          ]);

          if (data.requirement) {
            window.dispatchEvent(new CustomEvent('requirement-updated', { detail: data }));
          }
          if (data.profile) {
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: data }));
          }

          // Voice Output: Play returned ElevenLabs audio
          if (data.audioBase64) {
            try {
              const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch(playErr => {
                  console.debug('Autoplay restricted by browser; user can use replay button:', playErr);
                });
              }
            } catch (playErr) {
              console.warn('Audio playback error:', playErr);
            }
          }
        } catch (err) {
          console.error('Voice processing error:', err);
          const errDetail = err?.response?.data?.message || 'Sorry, I had trouble processing your voice audio. Please try speaking again or type your message.';
          setMessages(m => [
            ...m,
            { role: 'ai', text: errDetail }
          ]);
        } finally {
          setIsVoiceProcessing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone error:', err);
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMessages(m => [
          ...m,
          { role: 'ai', text: '⚠️ Microphone access was denied. Please allow microphone permissions in your browser settings to speak with PixelMind AI.' }
        ]);
      } else {
        setMessages(m => [
          ...m,
          { role: 'ai', text: `⚠️ Microphone unavailable: ${err.message || 'Please check your audio input device.'}` }
        ]);
      }
    }
  };

  const playVoiceAudio = (audioBase64) => {
    if (!audioBase64) return;
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(err => console.warn('User gesture audio playback error:', err));
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };
  
  return (
    <section className="chat-panel card" id="ai-assistant" style={{ height: '100%', margin: 0, border: 'none' }}>
      <div className="chat-title">
        <div className="robot"><Icon name="bot" size={21}/></div>
        <div>
          <b>Chat with PixelMind AI</b>
          <span><i/> {isRecording ? '🎙️ Listening...' : isVoiceProcessing ? '⚡ Processing speech...' : 'Online'}</span>
        </div>
        {onClose && <button onClick={onClose}><Icon name="x" size={16}/></button>}
      </div>
      <div className="messages">
        {messages.map((m,i)=>(
          <div key={i} className={`bubble ${m.role}`}>
            <div>{m.text}</div>
            {m.role === 'ai' && m.audioBase64 && (
              <div style={{ marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => playVoiceAudio(m.audioBase64)}
                  title="Replay spoken response"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#2563eb',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon name="volume" size={12}/> Play Voice
                </button>
              </div>
            )}
            {m.role==='ai' && i===0 ? <time>10:24 AM</time> : null}
          </div>
        ))}
        {isVoiceProcessing && (
          <div className="bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <span>Transcribing & thinking with PixelMind AI...</span>
          </div>
        )}
      </div>
      <div className="quick">
        <button onClick={()=>setInput('What is missing?')}>What is missing?</button>
        <button onClick={()=>setInput('Am I qualified?')}>Am I qualified?</button>
        <button onClick={()=>setInput('What should I do next?')}>What should I do next?</button>
      </div>
      <div className="composer">
        <button title="Attach document"><Icon name="paperclip" size={18}/></button>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder={isRecording ? "Listening... Click mic to finish speaking" : "Ask anything or tap mic to speak..."}
        />
        <button
          className={`voice ${isRecording ? 'recording' : ''} ${isVoiceProcessing ? 'processing' : ''}`}
          onClick={toggleVoice}
          title={isRecording ? "Stop recording and send" : "Speak with PixelMind AI"}
        >
          <Icon name="mic" size={17}/>
        </button>
        <button className="send" onClick={send} title="Send message">
          <Icon name="send" size={17}/>
        </button>
      </div>
    </section>
  );
}

function RightRail({ onUpload, isUploading, applicantId = '123' }) { 
  return (
    <aside className="right-rail">
      <ProgressCard/>
      <NextAction onUpload={onUpload} isUploading={isUploading} applicantId={applicantId} />
      <RecentActivity/>
    </aside>
  ); 
}

function WelcomeBanner({ onStart, onTalkAI }) {
  return (
    <section className="welcome-banner">
      <div className="welcome-bg" />
      <div className="welcome-content">
        <div className="welcome-badge">
          <span className="badge-flag">🇩🇪</span>
          <span>Your Trusted Partner</span>
        </div>
        <h1 className="welcome-heading">
          Germany is <span className="gradient-text">waiting for you!</span>
        </h1>
        <p className="welcome-sub">
          Educaro is your trusted partner on the path to your future in Germany. 
          Work with the best on your journey to Germany.
        </p>
        <div className="welcome-actions">
          <button className="btn-primary" onClick={onStart}>
            <Icon name="plane" size={18}/> Start Your Journey
          </button>
          <button 
            className="btn-outline" 
            onClick={onTalkAI}
          >
            <Icon name="bot" size={18}/> Talk to AI Assistant
          </button>
        </div>
      </div>
      <div className="welcome-visual">
        <div className="floating-card fc-1">
          <Icon name="check" size={18}/> <span>1,500+ Professionals Placed</span>
        </div>
        <div className="floating-card fc-2">
          <Icon name="globe" size={18}/> <span>Since 2014</span>
        </div>
        <div className="floating-card fc-3">
          <Icon name="award" size={18}/> <span>Leading Education Provider</span>
        </div>
      </div>
    </section>
  );
}

function TrustStats() {
  const stats = [
    { icon: 'users', value: '1,500+', label: 'Professionals Placed', color: 'blue' },
    { icon: 'globe', value: '10+', label: 'Countries Served', color: 'green' },
    { icon: 'award', value: 'Since 2014', label: 'Years of Excellence', color: 'purple' },
    { icon: 'graduation', value: '98%', label: 'Success Rate', color: 'orange' },
  ];
  return (
    <section className="trust-stats card">
      <div className="trust-header">
        <div>
          <h2>Why Educaro?</h2>
          <p>As a leading international education provider, we make academic and professional migration to Germany accessible for top talents from around the world.</p>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`stat-item stat-${s.color}`}>
            <div className="stat-icon-wrap"><Icon name={s.icon} size={22}/></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


function ProgramsShowcase({ onSelectProgram }) {
  const programs = [
    {
      id: 'nursing',
      icon: 'heart',
      title: 'Nursing Program',
      desc: 'Start your nursing career in Germany with our comprehensive placement and language training program.',
      tag: 'Most Popular',
      image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'study',
      icon: 'book',
      title: 'Study in Germany',
      desc: 'Learn German from A1 to C1 with certified instructors — online or on-site in Germany.',
      tag: 'Flexible',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'ausbildung',
      icon: 'graduation',
      title: 'Ausbildung',
      desc: 'Combine vocational training with real-world experience through Germany\'s dual education system.',
      tag: 'Career Path',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop'
    }
  ];

  const carouselItems = programs.map(p => ({
    image: p.image,
    alt: p.title,
    content: (
      <div 
        onClick={() => onSelectProgram?.(p.id)} 
        style={{ 
          position: 'absolute', inset: 0, padding: '24px', 
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', 
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 100%)',
          cursor: 'pointer',
          borderRadius: '18px'
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '12px', width: 'max-content', fontSize: '14px', marginBottom: 'auto', fontWeight: 'bold', color: '#fff' }}>
          {p.tag}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Icon name={p.icon} size={22} color="#fff" />
          <h3 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>{p.title}</h3>
        </div>
        <p style={{ margin: '0 0 16px', color: '#d4d4d4', fontSize: '16px', lineHeight: '1.5' }}>{p.desc}</p>
        <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Open Pathway <Icon name="arrow" size={16}/>
        </div>
      </div>
    )
  }));

  return (
    <section className="programs-section card" style={{ padding: '32px' }}>
      <div className="programs-header" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '30px', marginBottom: '8px' }}>Our Programs</h2>
        <p style={{ color: '#666' }}>Choose the pathway that fits your career goals (click to open)</p>
      </div>
      <div style={{ position: 'relative', height: '450px', display: 'flex', justifyContent: 'center' }}>
        <DepthCarousel items={carouselItems} visibleCards={3} autoplay={true} cardWidth={320} cardHeight={420} />
      </div>
    </section>
  );
}

const nursingBentoCards = [
  {
    color: '#120F17',
    label: 'Step 01 • Application',
    title: 'Initial Application & Review',
    description: 'Begin your journey through our registration portal. Our migration advisors review your qualifications and reach out within 48 hours.',
    icon: <Icon name="file" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 02 • Evaluation',
    title: 'Credential & Language Evaluation',
    description: 'Submit your nursing degree & CV for AI verification. Join our group evaluation and 1-on-1 interview session within 1 to 3 weeks.',
    icon: <Icon name="search" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 03 • Preparation',
    title: 'Language Training & Cultural Workshops',
    description: 'Master German from A1 to B1 with certified tutors. We prepare you for German hospital interviews with translated sessions in 6-10 weeks.',
    icon: <Icon name="book" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 04 • Contract',
    title: 'Hospital Employment Contract',
    description: 'Sign a direct, permanent employment contract with a top German hospital or healthcare facility with full legal guidance.',
    icon: <Icon name="check" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 05 • Migration',
    title: 'Embassy Visa & Flight Relocation',
    description: 'We secure your work visa appointment, cover your flight tickets to Germany, and pre-arrange your local apartment.',
    icon: <Icon name="plane" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 06 • Recognition',
    title: 'On-Site Integration & Professional License',
    description: 'Educaro community managers receive you at the airport, assist with registration, and support your German nursing license accreditation.',
    icon: <Icon name="award" size={20} />
  }
];

const studyBentoCards = [
  {
    color: '#120F17',
    label: 'Step 01 • Application',
    title: 'University Program Selection',
    description: 'Match with Bachelor’s and Master’s programs across Germany tailored to your academic background and career goals.',
    icon: <Icon name="book" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 02 • Evaluation',
    title: 'Transcript & APS Certificate Review',
    description: 'Comprehensive assessment of academic records, APS verification, and uni-assist admission processing.',
    icon: <Icon name="search" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 03 • Language',
    title: 'Intensive German Courses',
    description: 'From A1 to C1 preparation online or at partner language institutes in Germany to fulfill embassy and university language prerequisites.',
    icon: <Icon name="globe" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 04 • Pre-Enrollment',
    title: 'Guaranteed University Pre-Enrollment',
    description: 'Receive formal conditional admission offers from recognized state and private German universities.',
    icon: <Icon name="graduation" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 05 • Relocation',
    title: 'Student Residence & Blocked Account',
    description: 'Pre-arranged student accommodation ready for your arrival, along with complete blocked account & health insurance support.',
    icon: <Icon name="map" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 06 • Career',
    title: '18-Month Post-Study Work Visa',
    description: 'Graduate with an EU-accredited degree and transition into high-paying German tech, engineering, and business careers.',
    icon: <Icon name="award" size={20} />
  }
];

const ausbildungBentoCards = [
  {
    color: '#120F17',
    label: 'Step 01 • Application',
    title: 'Dual Vocational Placement',
    description: 'Get matched with accredited German companies offering dual study apprenticeship contracts starting with a high school diploma.',
    icon: <Icon name="file" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 02 • Evaluation',
    title: 'Aptitude & Language Assessment',
    description: 'Evaluation of school transcripts and German proficiency (B1/B2) for medical and technical apprenticeship roles.',
    icon: <Icon name="search" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 03 • Contract',
    title: 'Monthly Paid Salary (€1,000 - €1,500)',
    description: 'Earn a steady living stipend every month while you learn on the job with zero tuition fees required.',
    icon: <Icon name="star" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 04 • Training',
    title: 'Hands-on Real-World Practice',
    description: 'Divide your schedule between hands-on enterprise training and structured theory classes at state vocational schools.',
    icon: <Icon name="target" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 05 • Visa & Relocation',
    title: 'Administrative & Visa Assistance',
    description: 'Complete guidance from German embassy filing to health insurance and city hall registration.',
    icon: <Icon name="plane" size={20} />
  },
  {
    color: '#120F17',
    label: 'Step 06 • Diploma',
    title: 'EU-Recognized State Diploma & Hiring',
    description: 'Receive an official German Chamber of Commerce (IHK/HWK) certificate with over 90% immediate hiring rate.',
    icon: <Icon name="award" size={20} />
  }
];

function NursingProgramTab({ onBack }) {
  return (
    <div className="dashboard nursing-tab">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#1e293b',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          ← Back to Journey Map
        </button>
      )}
      <div className="card nursing-hero">
        <div className="nursing-hero-content">
          <h1>Educaro's Nursing Program</h1>
          <p className="lead">As a leading international education provider, we facilitate academic and professional migration to Germany for healthcare professionals from around the world.</p>
          <div className="nursing-stat">
            <Icon name="users" size={24} />
            <span>Since 2014, Educaro has helped <strong>more than 1,500</strong> young professionals from various countries start successful careers in Germany.</span>
          </div>
        </div>
      </div>

      <div className="card requirements-card">
        <div className="section-title">
          <h2>To Benefit from our Nursing Program</h2>
          <p>you need to meet the following requirements:</p>
        </div>
        <ul className="requirements-list">
          <li><Icon name="check" size={20} /> A high school diploma and at least a bachelor's degree in nursing</li>
          <li><Icon name="check" size={20} /> Enough time to commit to German language classes (around 10 hours per week)</li>
          <li><Icon name="check" size={20} /> A strong motivation to start a nursing career in Germany</li>
        </ul>
      </div>

      <div className="card pathway-card">
        <div className="section-title">
          <h2>Your Pathway to Germany</h2>
          <p>Interactive pathway from initial application to evaluation, employment, and recognition</p>
        </div>
        <MagicBento 
          cards={nursingBentoCards}
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        />
      </div>
    </div>
  );
}

function StudyProgramTab({ onBack }) {
  return (
    <div className="dashboard nursing-tab">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#1e293b',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          ← Back to Journey Map
        </button>
      )}
      <div className="card nursing-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)' }}>
        <div className="nursing-hero-content">
          <h1>Study in Germany</h1>
          <p className="lead">Your pathway to a successful academic and professional future</p>
        </div>
      </div>

      <div className="card requirements-card">
        <div className="section-title">
          <h2>University Pathway Program</h2>
          <p>At educaro, we help you find your ideal study program in Germany and support you every step of the way – from language preparation to university applications and settling into life in Germany.</p>
          <p style={{ marginTop: '10px' }}>Whether you simply want to learn German or if you’re looking for a bachelor’s or master’s degree, our University Pathway Program prepares you for academic success and opens the doors to a global career.</p>
        </div>
        <a 
          href="https://desk2.educaro.de/apply/dc3c5e6b-8f13-40de-a7f2-2248162e3373-in-study-in-germany" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-primary" 
          style={{ width: 'max-content', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          Apply now <Icon name="arrow" size={16}/>
        </a>
      </div>

      <div className="card pathway-card">
        <div className="section-title">
          <h2>Your Pathway to Germany</h2>
          <p>Interactive bento overview: Application, evaluation, housing, and university admission</p>
        </div>
        <MagicBento 
          cards={studyBentoCards}
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        />
      </div>

      <div className="card pathway-card">
        <div className="section-title">
          <h2>Why work in Germany after graduation?</h2>
          <p>Germany offers excellent career prospects for international students:</p>
        </div>
        <ul className="requirements-list" style={{ marginTop: '16px' }}>
          <li><Icon name="star" size={20} /> High demand for qualified professionals</li>
          <li><Icon name="star" size={20} /> Attractive starting salaries</li>
          <li><Icon name="star" size={20} /> Strong employee protections and work-life balance</li>
          <li><Icon name="star" size={20} /> International work environment</li>
          <li><Icon name="star" size={20} /> Opportunity to live and work long-term in the EU</li>
        </ul>
      </div>

      <div className="card pathway-card">
        <div className="section-title">
          <h2>Studying in Germany – What to expect</h2>
        </div>
        <div style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', marginTop: '10px' }}>
          <p style={{ marginBottom: '12px' }}>Germany is home to some of the best universities in Europe, known for their academic excellence, innovation, and global recognition. Degrees from German universities are highly valued worldwide and automatically recognized across the European Union.</p>
          <p style={{ marginBottom: '12px' }}>Most Bachelor’s programs take 3 years, and Master’s programs typically last 2 years. While many courses are taught in German, there’s a growing number of English-language programs, especially at the graduate level.</p>
          <p>Education in Germany is often tuition-free or very affordable compared to other countries, making it a smart investment in your future.</p>
        </div>
      </div>
    </div>
  );
}

function AusbildungProgramTab({ onBack }) {
  return (
    <div className="dashboard nursing-tab">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#1e293b',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          ← Back to Journey Map
        </button>
      )}
      <div className="card nursing-hero" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)' }}>
        <div className="nursing-hero-content">
          <h1>Ausbildung</h1>
          <p className="lead">The apprenticeship program in Germany (“Ausbildung”) is a unique, state-recognized training model that combines paid practical work in a company with theoretical classes at a vocational school.</p>
        </div>
      </div>

      <div className="card requirements-card">
        <div className="section-title">
          <h2>Earn while you learn</h2>
          <p>You earn a salary, gain real professional experience, and receive a qualification recognized throughout the European Union – all starting with just a high school diploma.</p>
        </div>
        <br />
        <div style={{ marginBottom: '30px' }}>
          <a 
            href="https://desk2.educaro.de/apply/9e98f72d-06a8-4d39-8221-3084453a6328-in-ausbildung" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary" 
            style={{ width: 'max-content', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Apply now <Icon name="arrow" size={16}/>
          </a>
        </div>

        <div className="section-title">
          <h2>Your Pathway to Germany</h2>
          <p>Application, evaluation, dual practical work, and EU-recognized qualifications</p>
        </div>
        <MagicBento 
          cards={ausbildungBentoCards}
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        />
      </div>
    </div>
  );
}

function AnimatedToggle({ enabled, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className="toggle-track"
      style={{
        background: enabled ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '#cbd5e1'
      }}
    >
      <motion.div
        className="toggle-thumb"
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ marginLeft: enabled ? 'auto' : '0' }}
      />
    </div>
  );
}

function SettingsTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [preferences, setPreferences] = useState({
    email: true,
    sms: true,
    darkMode: false,
  });

  const [profile, setProfile] = useState({
    fullName: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    phone: '+91 9876543210',
    dob: '1995-08-15',
    location: 'Mumbai, India',
    language: 'English',
    nationality: 'Indian'
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const toggleEdit = () => {
    if (isEditing) {
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    }
    setIsEditing(!isEditing);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, staggerChildren: 0.07, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', icon: 'user', type: 'text' },
    { key: 'email', label: 'Email Address', icon: 'chat', type: 'email' },
    { key: 'phone', label: 'Phone Number', icon: 'phone', type: 'text' },
    { key: 'dob', label: 'Date of Birth', icon: 'clock', type: 'date' },
    { key: 'location', label: 'Current Location', icon: 'map', type: 'text' },
    { key: 'language', label: 'Preferred Language', icon: 'globe', type: 'select', options: ['English', 'German', 'Hindi', 'Spanish', 'French'] },
    { key: 'nationality', label: 'Nationality', icon: 'award', type: 'text' },
  ];

  return (
    <motion.div
      className="dashboard settings-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            className="settings-toast"
            initial={{ opacity: 0, y: -25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            <Icon name="check" size={18} />
            <span>Profile changes saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Profile Overview Card with Aurora Effect */}
      <motion.div className="settings-hero-card" variants={itemVariants}>
        <div className="settings-aurora" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="settings-avatar-wrap">
              <div className="settings-avatar-pulse" />
              <motion.div
                whileHover={{ scale: 1.08, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  fontWeight: '700',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                  cursor: 'pointer'
                }}
              >
                R
              </motion.div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>{profile.fullName}</h1>
                <span style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', fontSize: '14px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="check" size={12} /> Verified Applicant
                </span>
              </div>
              <p style={{ margin: '6px 0 12px 0', color: '#94a3b8', fontSize: '16px' }}>
                {profile.location} • Pathway: Employment in Germany 🇩🇪
              </p>
              
              {/* Profile completion meter with animated fill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '180px', height: '6px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '99px' }}
                  />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>92% Completed</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isEditing && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="btn-outline"
                style={{ padding: '9px 18px', fontSize: '15px', background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Upload Photo
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="btn-primary"
              onClick={toggleEdit}
              style={{
                padding: '10px 22px',
                fontSize: '16px',
                fontWeight: '700',
                background: isEditing ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                border: 'none',
                boxShadow: isEditing ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              {isEditing ? '✓ Save Changes' : '✎ Edit Profile'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Details Grid */}
      <motion.div className="card" variants={itemVariants} style={{ padding: '24px' }}>
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2>Personal Information</h2>
            <p>Your verified applicant details for Germany visa and admissions</p>
          </div>
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', background: '#ecfdf5', padding: '4px 12px', borderRadius: '12px' }}
          >
            ● Synced with German Embassy Portal
          </motion.span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {fields.map((field) => (
            <motion.div
              key={field.key}
              className="settings-field-card"
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="settings-field-icon">
                <Icon name={field.icon} size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  {field.label}
                </span>

                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      key={`edit-${field.key}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                    >
                      {field.type === 'select' ? (
                        <select
                          name={field.key}
                          value={profile[field.key]}
                          onChange={handleChange}
                          className="settings-input"
                          style={{ background: 'white' }}
                        >
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          name={field.key}
                          type={field.type}
                          value={profile[field.key]}
                          onChange={handleChange}
                          className="settings-input"
                        />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`view-${field.key}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {profile[field.key] || '—'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Preferences Section with Animated Interactive Switches */}
      <motion.div className="card" variants={itemVariants} style={{ padding: '24px' }}>
        <div className="section-title">
          <h2>Notifications & Preferences</h2>
          <p>Configure how Educaro keeps you updated on deadlines and messages</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {[
            { key: 'email', title: 'Email Notifications', desc: 'Receive instant status updates and interview invites', icon: 'chat' },
            { key: 'sms', title: 'SMS & WhatsApp Alerts', desc: 'Get urgent reminders for visa appointments and deadlines', icon: 'phone' },
            { key: 'darkMode', title: 'Dark Mode Experience', desc: 'Switch visual appearance for comfortable evening reading', icon: 'star' }
          ].map((item) => (
            <motion.div
              key={item.key}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
                  <Icon name={item.icon} size={18} />
                </div>
                <div>
                  <b style={{ fontSize: '16px', color: '#1e293b', display: 'block' }}>{item.title}</b>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{item.desc}</span>
                </div>
              </div>
              <AnimatedToggle
                enabled={preferences[item.key]}
                onToggle={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key] })}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NextActionsDashboard({ applicantId = '123', onUpload, isUploading }) {
  const [actionData, setActionData] = useState(null);

  const fetchAction = useCallback(() => {
    nextActionApi.getRecommendedAction(applicantId)
      .then((res) => {
        setActionData(res.data);
      })
      .catch(() => {
        nextActionApi.getNextAction()
          .then((res) => setActionData(res.data))
          .catch(() => {});
      });
  }, [applicantId]);

  useEffect(() => {
    fetchAction();
    const interval = setInterval(fetchAction, 4000);
    const handleDocUploaded = () => fetchAction();
    window.addEventListener('document-uploaded', handleDocUploaded);
    return () => {
      clearInterval(interval);
      window.removeEventListener('document-uploaded', handleDocUploaded);
    };
  }, [fetchAction]);

  const title = actionData?.title || 'Upload Language Certificate';
  const reason = actionData?.reason || 'Your language qualification is required to proceed with your Germany pathway.';
  const priority = actionData?.priority || 'HIGH';
  const isReady = actionData?.requirementCode === 'READY' || title.toLowerCase().includes('proceed');
  const isMismatch = actionData?.action === 'RESOLVE_CONFLICT' || reason.startsWith('⚠️');

  const badgeText = isReady ? 'READY' : isMismatch ? 'ATTENTION REQUIRED' : priority === 'HIGH' ? 'ACTION REQUIRED' : 'RECOMMENDED';
  const badgeColor = isReady ? '#16a34a' : isMismatch ? '#d97706' : '#ef4444';
  const badgeBg = isReady ? '#dcfce7' : isMismatch ? '#fef3c7' : '#fee2e2';
  const borderColor = isReady ? '#16a34a' : isMismatch ? '#d97706' : '#2563eb';

  return (
    <div className="dashboard">
      <div className="dashboard-card-enhanced">
        <div className="section-title" style={{ marginBottom: '32px' }}>
          <h2>Recommended Next Step</h2>
          <p>Your step-by-step pathway progress based on your requirements, profile, and documents.</p>
        </div>
        
        <div className="action-hero" style={{ borderLeft: `6px solid ${borderColor}`, padding: '32px', borderRadius: '16px', background: 'linear-gradient(to right, #f8fafc, #ffffff)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <span className="action-badge" style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}33`, fontWeight: '800', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>
                {badgeText}
              </span>
              <h3 style={{ marginTop: '16px', fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>{title}</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginTop: '10px', color: '#475569', maxWidth: '650px' }}>{reason}</p>
            </div>
            <div className="action-icon-wrap" style={{ background: isReady ? '#dcfce7' : isMismatch ? '#fef3c7' : '#eff6ff', color: isReady ? '#16a34a' : isMismatch ? '#d97706' : '#2563eb', width: '64px', height: '64px', borderRadius: '16px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={isReady ? 'check' : isMismatch ? 'alert' : 'file'} size={32}/>
            </div>
          </div>
          {!isReady && (
            <div style={{ width: '260px' }}>
              <LoadingButton onUpload={onUpload} label={isMismatch ? "Upload Corrected Document" : "Upload Document"} isUploading={isUploading} />
            </div>
          )}
        </div>

        <div style={{ padding: '0 20px', marginTop: '36px' }}>
          <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '28px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Pathway Overview</h3>
          <div className="timeline-steps">
            <div className={`timeline-step ${isReady ? 'active' : ''}`}>
              <div className="timeline-dot" style={{ background: isReady ? '#16a34a' : '#94a3b8' }} />
              <h4 style={{ color: isReady ? '#16a34a' : '#1e293b' }}>1. Eligibility Assessment</h4>
              <p>{isReady ? 'All requirements and documents verified. Ready for evaluation.' : 'Unlocks after all required documents and profile details are verified.'}</p>
            </div>
            <div className="timeline-step">
              <div className="timeline-dot" style={{ background: '#94a3b8' }} />
              <h4>2. Visa & Career Pathway</h4>
              <p>Attend guidance and visa interview processing once eligibility is confirmed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Session & Authentication State
  const [sessionApplicantId, setSessionApplicantId] = useState(() => localStorage.getItem('educaro_applicant_id') || '');
  const [sessionApplicant, setSessionApplicant] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('educaro_applicant_data') || 'null');
    } catch {
      return null;
    }
  });
  const [pageView, setPageView] = useState(() => (localStorage.getItem('educaro_applicant_id') ? 'app' : 'hero'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const applicantId = sessionApplicantId || sessionApplicant?.id || 'default';

  const [active, setActive] = useState('journey');
  const [view, setView] = useState('globe');
  const inputRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const { execute: uploadDoc } = useApi(documentApi.uploadDocument);
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch updated applicant info if session id exists
  useEffect(() => {
    if (sessionApplicantId && (!sessionApplicant || sessionApplicant.id !== sessionApplicantId)) {
      applicantApi.getProfile(sessionApplicantId)
        .then(data => {
          if (data && data.id) {
            setSessionApplicant(data);
            localStorage.setItem('educaro_applicant_data', JSON.stringify(data));
          }
        })
        .catch(err => console.debug('Session profile lookup note:', err));
    }
  }, [sessionApplicantId]);

  const handleAuthSuccess = (applicant) => {
    setIsAuthModalOpen(false);
    if (applicant && applicant.id) {
      setSessionApplicantId(applicant.id);
      setSessionApplicant(applicant);
      localStorage.setItem('educaro_applicant_id', applicant.id);
      localStorage.setItem('educaro_applicant_data', JSON.stringify(applicant));
      setPageView('app');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('educaro_applicant_id');
    localStorage.removeItem('educaro_applicant_data');
    setSessionApplicantId('');
    setSessionApplicant(null);
    setPageView('hero');
  };

  const handleUpload = () => inputRef.current?.click();
  const handleFile = async (e) => { 
    const file = e.target.files?.[0]; 
    if (file) {
      setIsUploading(true);
      try {
        const uploaded = await uploadDoc(applicantId, file, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        });
        setUploadedFiles(prev => [...prev, file.name]);
        
        // Auto-trigger document processing if document returned
        if (uploaded && uploaded.id) {
          try {
            await documentApi.processDocument(uploaded.id);
          } catch (pErr) {
            console.warn('Auto processing error:', pErr);
          }
        }
        window.dispatchEvent(new CustomEvent('document-uploaded', { detail: uploaded }));
        setIsUploading(false);
      } catch (err) {
        setIsUploading(false);
        console.error('Upload failed', err);
      }
      e.target.value = ''; // Reset input
    }
  };

  const renderContent = () => {
    switch (active) {
      case 'journey':
        return (
          <div className="dashboard">
            <WelcomeBanner onStart={() => setActive('nursing')} onTalkAI={() => setIsChatOpen(true)} />
            <JourneyHero view={view} setView={setView} setActive={setActive} />
            <div className="lower" style={{ display: 'block' }}>
              <div className="lower-left" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                <AccessCard />
                <ApplicationStatus />
              </div>
            </div>
            <TrustStats />
            <ProgramsShowcase onSelectProgram={setActive} />
          </div>
        );
      case 'nursing':
        return <NursingProgramTab onBack={() => setActive('journey')} />;
      case 'study':
        return <StudyProgramTab onBack={() => setActive('journey')} />;
      case 'ausbildung':
        return <AusbildungProgramTab onBack={() => setActive('journey')} />;
      case 'profile':
        return <div className="dashboard"><ProfileView /></div>;
      case 'documents':
        return (
          <DocumentVerificationView
            applicantId={applicantId}
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadedFiles={uploadedFiles}
          />
        );
      case 'requirements':
        return <RequirementsView applicantId={applicantId} />;
      case 'actions':
        return <NextActionsDashboard applicantId={applicantId} onUpload={handleUpload} isUploading={isUploading} />;
      case 'assistant':
      case 'messages':
        return <div className="dashboard"><ChatPanel applicantId={applicantId} /></div>;
      case 'consultant':
        return (
          <div className="dashboard">
            <div className="card">
              <div className="section-title"><h2>Consultant</h2></div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '1rem', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '80px', height: '80px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Icon name="user" size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Sarah Jenkins</h3>
                  <p style={{ color: '#64748b', margin: '0 0 12px 0' }}>Senior Migration Advisor</p>
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '16px' }}>Book a Call</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'eligibility':
        return <div className="dashboard"><EligibilityView /></div>;
      case 'resume':
        return (
          <div className="dashboard">
            <CvGenerationView applicantId={applicantId} />
          </div>
        );
      case 'conclusion':
        return (
          <div className="dashboard">
            <ConclusionView applicantId={applicantId} onNavigate={setActive} />
          </div>
        );
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  // If user is viewing the Hero landing page
  if (pageView === 'hero') {
    return (
      <div className="hero-app-wrapper" style={{ width: '100vw', minHeight: '100vh', background: '#030712' }}>
        <GlobalStatus />
        <Hero
          onLogin={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onGetStarted={() => {
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Authenticated Educaro Dashboard
  return (
    <div className="app">
      <GlobalStatus />
      <Sidebar active={active} setActive={setActive} />
      <div className="main">
        <Topbar onNavigate={setActive} applicant={sessionApplicant} onLogout={handleLogout} />
        <main className="content">
          {renderContent()}
          <RightRail onUpload={handleUpload} isUploading={isUploading} applicantId={applicantId} />
        </main>
      </div>
      <input ref={inputRef} className="hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
      <button 
        className="floating-chatbot-icon" 
        onClick={() => setIsChatOpen(!isChatOpen)}
        title={isChatOpen ? "Close AI Chat" : "Chat with Educaro AI"}
      >
        <Icon name={isChatOpen ? "x" : "bot"} size={28} />
      </button>

      {isChatOpen && (
        <div className="chat-popover" style={{ position: 'fixed', bottom: '100px', right: '24px', width: '380px', height: '600px', maxHeight: 'calc(100vh - 120px)', zIndex: 1000, boxShadow: '0 12px 48px rgba(0,0,0,0.15)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatPanel applicantId={applicantId} onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);

