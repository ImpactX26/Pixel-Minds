import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { conclusionApi, cvApi } from '../api';

const Icon = ({ name, size = 20, stroke = 2, className = '' }) => {
  const paths = {
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></>,
    sparkles: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    graduation: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    refresh: <><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M15.5 14 17 22l-5-3-5 3 1.5-8"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>
  };
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.file}
    </svg>
  );
};

export default function ConclusionView({ applicantId = '123', onNavigate }) {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvText, setCvText] = useState('');

  const fetchConclusion = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await conclusionApi.getConclusionReport(applicantId);
      const data = res?.data || res;
      setReport(data);
    } catch (err) {
      console.error('Failed to load conclusion report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    fetchConclusion();
  }, [fetchConclusion]);

  const handleViewCv = async () => {
    try {
      const res = await cvApi.getCv(applicantId);
      const data = res?.data || res;
      const md = data?.formattedMarkdown || data?.cvData?.formattedMarkdown || data?.markdownCv;
      if (md) {
        setCvText(md);
        setCvModalOpen(true);
      } else if (onNavigate) {
        onNavigate('resume');
      }
    } catch {
      if (onNavigate) onNavigate('resume');
    }
  };

  const handleCopySummary = () => {
    if (!report) return;
    const summaryText = `Educaro Migration Dossier Summary
Applicant: ${report.applicant?.name}
Target: ${report.applicant?.targetRole} in ${report.applicant?.targetCountry}
Eligibility: ${report.eligibilitySummary?.status}
CV Status: ${report.cvStatus?.isApproved ? 'Approved' : 'Generated'}
Recommended Action: ${report.recommendedNextStep?.title} - ${report.recommendedNextStep?.reason}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading && !report) {
    return (
      <div className="dashboard-card-enhanced" style={{ padding: '60px', textAlign: 'center' }}>
        <div className="global-loader" style={{ margin: '0 auto 20px', display: 'block' }} />
        <h3 style={{ color: '#1e293b' }}>Consolidating Verified Applicant Journey...</h3>
        <p style={{ color: '#64748b' }}>PixelMind AI is aggregating profile, documents, eligibility, and CV data from PostgreSQL.</p>
      </div>
    );
  }

  const {
    applicant = {},
    journeyStages = [],
    documentStatus = {},
    eligibilitySummary = {},
    cvStatus = {},
    remainingRequirements = [],
    recommendedNextStep = {},
    finalOutcome = {}
  } = report || {};

  const isReady = finalOutcome.status === 'READY_FOR_NEXT_STAGE';

  return (
    <div className="dashboard-card-enhanced" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Header Banner & Applicant Overview */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                background: isReady ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                color: isReady ? '#4ade80' : '#facc15',
                border: `1px solid ${isReady ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Icon name={isReady ? 'check' : 'alert'} size={14} />
                {isReady ? 'Journey Assessment Complete' : 'Application In Progress'}
              </span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Icon name="globe" size={14} /> Destination: {applicant.targetCountry || 'Germany'}
              </span>
            </div>

            <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {applicant.name || 'Rahul Sharma'}
            </h1>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#93c5fd', marginBottom: '8px' }}>
              {applicant.targetRole || 'Software Engineer'} • Employment Pathway
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', maxWidth: '750px', lineHeight: '1.5' }}>
              {applicant.summary || 'Applicant dossier verified across all journey stages. Source of truth backed by PostgreSQL.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopySummary}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="copy" size={14} /> {copied ? 'Copied!' : 'Copy Dossier Summary'}
            </button>
            <button
              onClick={fetchConclusion}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="refresh" size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 2. Agentic Story & Journey Pipeline Progression */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px' }}>
              PixelMind Continuous Applicant State
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Every stage seamlessly maintained and enriched the applicant's single source of truth.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {journeyStages.map((stg) => {
            const isDone = stg.status === 'COMPLETED';
            const isWarn = stg.status === 'ACTION_REQUIRED';
            return (
              <div
                key={stg.id}
                onClick={() => onNavigate && onNavigate(stg.id === 'next_step' ? 'actions' : stg.id === 'cv' ? 'resume' : stg.id)}
                style={{
                  background: isWarn ? '#fffbeb' : isDone ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${isWarn ? '#fde68a' : isDone ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: onNavigate ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: isWarn ? '#b45309' : isDone ? '#15803d' : '#475569' }}>
                    {stg.name}
                  </span>
                  <Icon
                    name={isDone ? 'check' : isWarn ? 'alert' : 'file'}
                    size={15}
                    className={isWarn ? 'text-amber-600' : isDone ? 'text-green-600' : 'text-slate-400'}
                  />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                  {stg.detail}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Core Verdict & Final Outcome Hero */}
      <div style={{
        background: isReady ? 'linear-gradient(to right, #f0fdf4, #ffffff)' : 'linear-gradient(to right, #fffbeb, #ffffff)',
        border: `1px solid ${isReady ? '#bbf7d0' : '#fde68a'}`,
        borderLeft: `6px solid ${isReady ? '#16a34a' : '#d97706'}`,
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <span style={{
              background: isReady ? '#dcfce7' : '#fef3c7',
              color: isReady ? '#166534' : '#92400e',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.5px'
            }}>
              {isReady ? 'FINAL STAGE VERDICT: READY' : 'FINAL STAGE VERDICT: ACTION REQUIRED'}
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '14px 0 8px' }}>
              {finalOutcome.headline}
            </h2>
            <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }}>
              {finalOutcome.message}
            </p>
            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
              ⚠️ {finalOutcome.disclaimer}
            </div>
          </div>

          {/* Action Hero Box */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 22px',
            width: '320px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Final Recommended Next Step
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '8px 0 4px' }}>
              {recommendedNextStep.title || 'Proceed with Educaro Qualification'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px', lineHeight: '1.4' }}>
              {recommendedNextStep.reason}
            </p>
            <button
              onClick={() => onNavigate && onNavigate('actions')}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563eb',
                borderRadius: '8px',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Take Action <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Deep-Dive Status Cards (Eligibility, Documents, CV) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Card A: Eligibility Summary */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
                <Icon name="award" size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                Eligibility Outcome
              </h3>
            </div>
            <span style={{
              background: eligibilitySummary.isEligible ? '#dcfce7' : '#fef3c7',
              color: eligibilitySummary.isEligible ? '#15803d' : '#b45309',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {eligibilitySummary.status || 'QUALIFIED'}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>
            Evaluated against standard German qualification and employment criteria:
          </p>

          <div style={{ display: 'grid', gap: '8px' }}>
            {eligibilitySummary.criteria?.map((c, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: '#1e293b', fontWeight: '600' }}>{c.name}</span>
                <span style={{
                  color: c.status === 'SATISFIED' ? '#16a34a' : '#d97706',
                  fontWeight: '700',
                  fontSize: '12px'
                }}>
                  {c.status === 'SATISFIED' ? '✓ Satisfied' : '● Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Document Verification Status */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center' }}>
                <Icon name="shield" size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                Document Evidence Status
              </h3>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
              {documentStatus.verified} Verified / {documentStatus.total} Total
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>
            Evidence verified via AI optical extraction and cross-checked with profile:
          </p>

          <div style={{ display: 'grid', gap: '8px' }}>
            {documentStatus.documents?.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: doc.isVerified ? '#f0fdf4' : '#fffbeb',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${doc.isVerified ? '#bbf7d0' : '#fde68a'}`,
                  fontSize: '13px'
                }}
              >
                <div>
                  <strong style={{ color: '#1e293b', display: 'block' }}>{doc.name}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{doc.type}</span>
                </div>
                <span style={{
                  color: doc.isVerified ? '#15803d' : '#b45309',
                  fontWeight: '700',
                  fontSize: '12px'
                }}>
                  {doc.isVerified ? '✓ Verified' : '⚠️ Clarification'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card C: German CV (Lebenslauf) Status */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#9333ea', display: 'grid', placeItems: 'center' }}>
                <Icon name="file" size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                German CV (Lebenslauf)
              </h3>
            </div>
            <span style={{
              background: cvStatus.isApproved ? '#dcfce7' : cvStatus.hasCv ? '#e0f2fe' : '#fef3c7',
              color: cvStatus.isApproved ? '#15803d' : cvStatus.hasCv ? '#0369a1' : '#b45309',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {cvStatus.isApproved ? '✓ APPROVED' : cvStatus.hasCv ? 'DRAFT' : 'PENDING'}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>
            {cvStatus.hasCv
              ? 'Generated & formatted according to German DIN 5008 market standards with verified priority.'
              : 'Generate your German-standard CV in the CV stage to complete your application.'}
          </p>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Target Role:</span>
              <strong style={{ color: '#1e293b' }}>{cvStatus.targetRole || applicant.targetRole}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Standard:</span>
              <strong style={{ color: '#2563eb' }}>DIN 5008 Lebenslauf</strong>
            </div>
          </div>

          <button
            onClick={handleViewCv}
            className="btn-outline"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Icon name="file" size={14} /> View & Export German CV
          </button>
        </div>
      </div>

      {/* 5. Remaining Requirements Section (If any) */}
      {remainingRequirements.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Icon name="alert" size={20} className="text-amber-600" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#92400e' }}>
              Remaining Action Items
            </h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '24px', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
            {remainingRequirements.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Stage Jump Navigation Bar for Judges & Evaluators */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
          Explore Applicant Journey Stages:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'requirements', label: 'Requirements' },
            { id: 'profile', label: 'Profile' },
            { id: 'documents', label: 'Documents' },
            { id: 'actions', label: 'Next Step' },
            { id: 'eligibility', label: 'Eligibility' },
            { id: 'resume', label: 'CV / Resume' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate && onNavigate(s.id)}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
            >
              {s.label} →
            </button>
          ))}
        </div>
      </div>

      {/* CV Modal Viewer if requested */}
      <AnimatePresence>
        {cvModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                  Generated German Lebenslauf (DIN 5008)
                </h3>
                <button
                  onClick={() => setCvModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
                  {cvText}
                </pre>
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cvText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  onClick={() => setCvModalOpen(false)}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
