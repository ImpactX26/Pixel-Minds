import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { applicantApi, journeyApi, documentApi, qualificationApi, nextActionApi, chatApi } from './api';
import useApi from './hooks/useApi';
import FlipCard from './components/FlipCard';
import LoadingButton from './components/LoadingButton';
import MagicBento from './components/MagicBento';
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
  const items = [
    ['journey', 'Journey Map', 'plane'],
    ['application', 'My Application', 'file'],
    ['documents', 'Documents', 'docs'],
    ['requirements', 'Requirements', 'target'],
    ['actions', 'Next Actions', 'checklist'],
  ];
  return <aside className="sidebar">
    <Logo />
    <nav>
      {items.map(([id, label, icon]) => <button key={id} className={`nav-item ${active === id ? 'selected' : ''}`} onClick={() => setActive(id)}><Icon name={icon} size={20}/><span>{label}</span></button>)}
    </nav>
    <div className="sidebar-bottom">
      <button className={`nav-item ${active === 'messages' ? 'selected' : ''}`} onClick={() => setActive('messages')}><Icon name="chat"/><span>Messages</span><b className="badge">2</b></button>
      <button className={`nav-item ${active === 'consultant' ? 'selected' : ''}`} onClick={() => setActive('consultant')}><Icon name="user"/><span>Consultant</span></button>
      <button className={`nav-item ${active === 'settings' ? 'selected' : ''}`} onClick={() => setActive('settings')}><Icon name="settings"/><span>Settings</span></button>
      <div className="help-card"><strong>Need Help?</strong><span>Talk to Educaro AI</span><div className="help-actions"><span>◉</span><span>➤</span><span>☎</span><Icon name="chevron" size={17}/></div></div>
    </div>
  </aside>;
}

function Topbar() {
  return <header className="topbar">
    <div className="search"><Icon name="search" size={18}/><span>Ask Educaro anything... (e.g. What is missing from my application?)</span></div>
    <div className="contact-pills"><button><span className="whatsapp">◉</span> WhatsApp</button><button><span className="telegram">➤</span> Telegram</button><button><span className="call">◉</span> Call AI</button></div>
    <button className="bell"><Icon name="bell" size={20}/><i/></button>
    <div className="profile"><div className="avatar">R</div><div><strong>Rahul Sharma</strong><small>Applicant</small></div><span>⌄</span></div>
  </header>;
}

function JourneyHero({ view, setView, setActive }) {
  const [activeStep, setActiveStep] = useState(3);
  return <section className="hero">
    <div className="hero-bg"/>
    <div className="hero-header">
      <div className="journey-title"><span className="title-icon"><Icon name="target" size={20}/></span><div><h1>Your Germany Journey</h1><p>Don’t just navigate. Let the AI navigate for you.</p></div></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.75)', padding: '4px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setActive?.('nursing')} 
            style={{ border: 0, background: 'rgba(244, 63, 94, 0.25)', color: '#fda4af', padding: '6px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="heart" size={14} /> Nursing
          </button>
          <button 
            onClick={() => setActive?.('study')} 
            style={{ border: 0, background: 'rgba(14, 165, 233, 0.25)', color: '#7dd3fc', padding: '6px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="book" size={14} /> Study
          </button>
          <button 
            onClick={() => setActive?.('ausbildung')} 
            style={{ border: 0, background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', padding: '6px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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
        <path d="M855 365 C740 330 680 295 585 270 C500 246 430 205 350 190 C280 177 210 135 125 90"/>
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
              <b style={{ color: '#10b981', fontSize: '18px' }}>On Track</b>
              <p style={{ marginTop: '5px', fontSize: '13px', color: '#cbd5e1' }}>You are closer to your Germany journey!</p>
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

function NextAction({ onUpload, isUploading }) {
  return (
    <div className="next-action card">
      <div className="card-heading">
        <span><Icon name="file" size={17}/> Next Action</span><em>HIGH PRIORITY</em>
      </div>
      <div className="action-main">
        <div className="doc-icon"><Icon name="file" size={30}/></div>
        <div>
          <h3>Upload your German<br/>language certificate</h3>
          <p>This is required for your employment pathway.</p>
        </div>
      </div>
      <div style={{ marginTop: '15px', width: '100%' }}>
        <LoadingButton onUpload={onUpload} label="Upload Document" isUploading={isUploading} />
      </div>
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
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
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
                fontSize: '17px',
                fontWeight: '700',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                flexShrink: 0
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '13px', color: '#1e293b', fontWeight: '700' }}>{item.title}</b>
              <small style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{item.desc}</small>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: item.color, background: '#ffffff', padding: '3px 8px', borderRadius: '6px', border: `1px solid ${item.border}` }}>
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

function ChatPanel({ applicantId = '123' }) {
  const { data: history, execute: loadHistory } = useApi(chatApi.getHistory);
  const { execute: sendMsgApi } = useApi(chatApi.sendMessage);
  
  const [messages, setMessages] = useState([{role:'ai', text:'Hi Rahul! I checked your application. Your German language certificate is still pending.'}]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    loadHistory(applicantId).then(data => {
      if (data && data.length > 0) setMessages(data);
    }).catch(e => console.error("Chat history load failed", e));
  }, [applicantId, loadHistory]);

  const send = async () => { 
    if (!input.trim()) return; 
    const t = input.trim(); 
    setMessages(m => [...m, {role:'user',text:t}]); 
    setInput('');
    try {
      const response = await sendMsgApi(applicantId, t);
      if (response && response.reply) {
        setMessages(m => [...m, {role:'ai', text: response.reply}]);
      } else {
        setMessages(m => [...m, {role:'ai', text: `I'll check that for you.`}]);
      }
    } catch (e) {
      setMessages(m => [...m, {role:'ai', text: 'Sorry, I am having trouble connecting right now.'}]);
    }
  };
  
  return <section className="chat-panel card" id="ai-assistant"><div className="chat-title"><div className="robot"><Icon name="bot" size={21}/></div><div><b>Chat with Educaro AI</b><span><i/> Online</span></div><button>⌗</button></div><div className="messages">{messages.map((m,i)=><div key={i} className={`bubble ${m.role}`}>{m.text}{m.role==='ai' && i===0 ? <time>10:24 AM</time> : null}</div>)}</div><div className="quick"><button onClick={()=>setInput('What is missing?')}>What is missing?</button><button onClick={()=>setInput('Am I qualified?')}>Am I qualified?</button><button onClick={()=>setInput('What should I do next?')}>What should I do next?</button></div><div className="composer"><button><Icon name="paperclip" size={18}/></button><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask anything..."/><button className="send" onClick={send}><Icon name="send" size={17}/></button></div></section>;
}

function RightRail({ onUpload, isUploading, applicantId = '123' }) { 
  return (
    <aside className="right-rail">
      <ProgressCard/>
      <NextAction onUpload={onUpload} isUploading={isUploading} />
      <ChatPanel applicantId={applicantId} />
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
            onClick={() => document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' })}
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
      color: 'rose',
    },
    {
      id: 'study',
      icon: 'book',
      title: 'Study German / in Germany',
      desc: 'Learn German from A1 to C1 with certified instructors — online or on-site in Germany.',
      tag: 'Flexible',
      color: 'sky',
    },
    {
      id: 'ausbildung',
      icon: 'graduation',
      title: 'Ausbildung',
      desc: 'Combine vocational training with real-world experience through Germany\'s dual education system.',
      tag: 'Career Path',
      color: 'violet',
    },
  ];
  return (
    <section className="programs-section">
      <div className="programs-header">
        <h2>Our Programs</h2>
        <p>Choose the pathway that fits your career goals (click to open)</p>
      </div>
      <div className="programs-grid">
        {programs.map((p) => (
          <div 
            className={`program-card program-${p.color}`} 
            key={p.title}
            onClick={() => onSelectProgram?.(p.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="program-tag">{p.tag}</div>
            <div className="program-icon-wrap"><Icon name={p.icon} size={28}/></div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <button className="program-cta" onClick={(e) => { e.stopPropagation(); onSelectProgram?.(p.id); }}>
              Open Pathway <Icon name="arrow" size={16}/>
            </button>
          </div>
        ))}
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
            fontSize: '13px',
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
            fontSize: '13px',
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
        <div style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
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
            fontSize: '13px',
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
                  fontSize: '32px',
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
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>{profile.fullName}</h1>
                <span style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="check" size={12} /> Verified Applicant
                </span>
              </div>
              <p style={{ margin: '6px 0 12px 0', color: '#94a3b8', fontSize: '14px' }}>
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
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#38bdf8' }}>92% Completed</span>
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
                style={{ padding: '9px 18px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
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
                fontSize: '14px',
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
            style={{ fontSize: '12px', fontWeight: '600', color: '#10b981', background: '#ecfdf5', padding: '4px 12px', borderRadius: '12px' }}
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
                <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
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
                      style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
                  <b style={{ fontSize: '14px', color: '#1e293b', display: 'block' }}>{item.title}</b>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{item.desc}</span>
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

function App() {
  const [active, setActive] = useState('journey');
  const [view, setView] = useState('globe');
  const inputRef = useRef(null);
  const applicantId = '123';
  
  const { execute: uploadDoc } = useApi(documentApi.uploadDocument);
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => inputRef.current?.click();
  const handleFile = async (e) => { 
    const file = e.target.files?.[0]; 
    if (file) {
      setIsUploading(true);
      try {
        await uploadDoc(applicantId, file, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        });
        setUploadedFiles(prev => [...prev, file.name]);
        setTimeout(() => {
          setIsUploading(false);
          alert(`${file.name} uploaded successfully!`);
        }, 500);
      } catch (err) {
        setIsUploading(false);
        // Global error will be handled by GlobalStatus component
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
            <WelcomeBanner onStart={() => setActive('nursing')} />
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
      case 'application':
        return <div className="dashboard"><div className="card"><div className="section-title"><h2>My Application</h2></div><p style={{marginBottom: '1rem'}}>Review and edit your application details here.</p><ApplicationStatus /></div></div>;
      case 'documents':
        return (
          <div className="dashboard">
            <div className="card">
              <div className="section-title"><h2>Documents</h2></div>
              <p>View and upload your documents.</p>
              
              <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#475569' }}>Uploaded Files</h3>
                {uploadedFiles.length === 0 ? (
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', textAlign: 'center' }}>
                    No documents uploaded yet.
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {uploadedFiles.map((file, i) => (
                      <li key={i} style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', color: '#334155' }}>
                        <Icon name="file" size={18} /> {file}
                        <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: '13px' }}>Verified</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{marginTop: '1rem', width: '220px'}}>
                <LoadingButton onUpload={handleUpload} label="Upload Document" isUploading={isUploading} />
              </div>
            </div>
          </div>
        );
      case 'requirements':
        return <div className="dashboard"><div className="card"><div className="section-title"><h2>Requirements</h2></div><p>Check the requirements for your Germany journey.</p></div></div>;
      case 'actions':
        return <div className="dashboard"><div className="card" style={{paddingBottom: '2rem'}}><div className="section-title"><h2>Next Actions</h2></div><p style={{marginBottom: '1rem'}}>Complete the following actions to proceed.</p><NextAction onUpload={handleUpload} isUploading={isUploading} /></div></div>;
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
                  <h3 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>Sarah Jenkins</h3>
                  <p style={{ color: '#64748b', margin: '0 0 12px 0' }}>Senior Migration Advisor</p>
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Book a Call</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <GlobalStatus />
      <Sidebar active={active} setActive={setActive} />
      <div className="main">
        <Topbar />
        <main className="content">
          {renderContent()}
          <RightRail onUpload={handleUpload} isUploading={isUploading} applicantId={applicantId} />
        </main>
      </div>
      <input ref={inputRef} className="hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
