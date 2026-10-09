import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cvApi, documentApi } from '../api';

const Icon = ({ name, size = 20, stroke = 2, className = '' }) => {
  const paths = {
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    sparkles: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
    download: <><path d="M12 4v12M7 11l5 5 5-5"/><path d="M5 20h14"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    refresh: <><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>
  };
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.file}
    </svg>
  );
};

export default function CvGenerationView({ applicantId }) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'edit'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // CV state
  const [cvData, setCvData] = useState(null);
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Load existing saved CV on initial load
  const loadSavedCv = useCallback(async () => {
    try {
      const res = await cvApi.getCv(applicantId);
      const data = res?.data || res;
      if (data && (data.personalInfo || data.formattedMarkdown || data.cvData)) {
        setCvData(data.cvData || data);
      }
    } catch (err) {
      console.log('No prior CV found:', err);
    }
  }, [applicantId]);

  useEffect(() => {
    loadSavedCv();
  }, [loadSavedCv]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  // Trigger CV Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setSaveSuccess(null);

    try {
      let documentId = undefined;

      // Upload file to document repo first if selected
      if (selectedFile) {
        try {
          const uploadRes = await documentApi.uploadDocument(applicantId, selectedFile);
          const uploadedDoc = uploadRes?.data || uploadRes;
          documentId = uploadedDoc?.id;
        } catch (uploadErr) {
          console.warn('Doc storage upload skipped:', uploadErr);
        }
      }

      const res = await cvApi.generateCv(applicantId, {
        documentId,
        rawCvText: rawText.trim() || undefined,
        rawText: rawText.trim() || undefined,
      });

      const payload = res?.data || res;
      if (payload && (payload.personalInfo || payload.education || payload.cvData)) {
        setCvData(payload.cvData || payload);
        setActiveTab('preview');
      } else {
        throw new Error(payload?.message || 'Failed to generate CV');
      }
    } catch (err) {
      console.error('CV Generation error:', err);
      setErrorMsg(err?.response?.data?.message || err.message || 'An error occurred during CV generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Final CV
  const handleSave = async () => {
    if (!cvData) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await cvApi.saveCv(applicantId, cvData);
      const payload = res?.data || res;
      if (payload && (payload.status === 'APPROVED' || payload.success || payload.id)) {
        setCvData(prev => ({ ...prev, status: 'APPROVED' }));
        setSaveSuccess('German CV successfully verified, approved, and saved to your applicant profile!');
        setTimeout(() => setSaveSuccess(null), 6000);
      }
    } catch (err) {
      console.error('Failed to save CV:', err);
      setErrorMsg('Failed to save CV: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    const textToCopy = cvData?.formattedMarkdown || cvData?.markdownCv;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Print CV
  const handlePrint = () => {
    window.print();
  };

  // Helpers to safely get structured fields
  const personal = cvData?.personalInfo || cvData?.contactInfo || {};
  const workExperience = cvData?.workExperience || cvData?.experience || [];
  const education = cvData?.education || [];
  const skills = cvData?.skills || { technical: [], tools: [], soft: [] };
  const languages = cvData?.languages || [];
  const projects = cvData?.projects || [];
  const conflicts = cvData?.conflicts || [];

  return (
    <div className="dashboard-card-enhanced" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: '#ffffff',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{
              background: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
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
              <Icon name="sparkles" size={14} /> German Market Standard • DIN 5008
            </span>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Icon name="shield" size={14} /> Verified Journey Priority
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px', color: '#ffffff', letterSpacing: '-0.5px' }}>
            Build your German-ready CV from your verified applicant profile
          </h1>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, maxWidth: '780px', lineHeight: '1.5' }}>
            PixelMind AI fuses your uploaded resume with your entire verified journey—profile data, requirements, and document evidence—ensuring verified facts strictly take priority.
          </p>
        </div>
      </div>

      {/* Agentic Pipeline Indicator */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '28px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          PixelMind AI Agentic Pipeline
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {[
            { step: '1. Verified State', desc: 'Requirements & Docs', icon: 'shield', done: true },
            { step: '2. Uploaded CV', desc: selectedFile ? selectedFile.name : 'Upload PDF/DOCX', icon: 'upload', done: !!selectedFile || !!cvData },
            { step: '3. AI Extraction', desc: 'Structured Data', icon: 'sparkles', done: !!cvData },
            { step: '4. Conflict Check', desc: conflicts.length > 0 ? `${conflicts.length} Reconciled` : 'Strict Priority', icon: 'alert', done: !!cvData, highlight: conflicts.length > 0 },
            { step: '5. German CV', desc: 'Lebenslauf Format', icon: 'file', done: !!cvData },
            { step: '6. Review & Save', desc: cvData?.status === 'APPROVED' ? 'Saved to PostgreSQL' : 'Review & Approve', icon: 'check', done: cvData?.status === 'APPROVED' || !!saveSuccess }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: item.highlight ? '#fffbeb' : item.done ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${item.highlight ? '#fde68a' : item.done ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: item.highlight ? '#b45309' : item.done ? '#15803d' : '#475569' }}>
                  {item.step}
                </span>
                <Icon
                  name={item.done ? 'check' : item.icon}
                  size={14}
                  className={item.highlight ? 'text-amber-600' : item.done ? 'text-green-600' : 'text-slate-400'}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Clarification Banner */}
      <AnimatePresence>
        {conflicts && conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '28px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                background: '#fef3c7',
                color: '#d97706',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}>
                <Icon name="alert" size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#92400e' }}>
                    Data Conflicts Detected & Automatically Reconciled
                  </h3>
                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                    {conflicts.length} Item{conflicts.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#78350f', lineHeight: '1.4' }}>
                  PixelMind AI detected discrepancies between your uploaded CV and previously verified documents/profile. In accordance with German employer and embassy standards, verified applicant data takes strict precedence over unverified claims.
                </p>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {conflicts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #fef08a',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        display: 'grid',
                        gridTemplateColumns: '150px 1fr 1fr',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{c.field || 'Attribute'}:</strong>
                      <div>
                        <span style={{ color: '#15803d', fontWeight: '700', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                          ✓ Verified: {String(c.verifiedValue || 'N/A')}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#b91c1c', textDecoration: 'line-through', background: '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>
                          CV: {String(c.cvValue || 'N/A')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Success Alert */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#166534'
            }}
          >
            <Icon name="check" size={20} />
            <span style={{ fontSize: '14px', fontWeight: '700' }}>{saveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {errorMsg && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b'
        }}>
          <Icon name="alert" size={20} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{errorMsg}</span>
        </div>
      )}

      {/* Upload & Generator Control Panel */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px' }}>
              Upload Existing CV (PDF / DOCX)
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Upload your existing CV or let PixelMind AI assemble your German Lebenslauf directly from your verified journey.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadSavedCv}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="refresh" size={14} /> Reload Saved CV
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: selectedFile ? '#f0fdf4' : '#f8fafc',
              borderColor: selectedFile ? '#86efac' : '#cbd5e1',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
            />
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: selectedFile ? '#dcfce7' : '#e0f2fe',
              color: selectedFile ? '#16a34a' : '#0284c7',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 12px'
            }}>
              <Icon name={selectedFile ? 'check' : 'upload'} size={22} />
            </div>
            <strong style={{ display: 'block', fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>
              {selectedFile ? selectedFile.name : 'Select or Drop Existing CV'}
            </strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract` : 'Supports PDF, DOCX, TXT format'}
            </span>
          </div>

          {/* Paste Raw Text or Notes Area */}
          <div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Or paste your existing CV text, extra experience bullets, or specific German job requirements here..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                background: '#f8fafc'
              }}
            />
          </div>
        </div>

        {/* Generate Button Row */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          {isGenerating && (
            <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
              Extracting, verifying against database & formatting German Lebenslauf...
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderRadius: '10px',
              color: '#ffffff',
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            <Icon name="sparkles" size={18} />
            {isGenerating ? 'Optimizing CV...' : cvData ? 'Re-Generate German CV' : 'Generate German-Ready CV'}
          </button>
        </div>
      </div>

      {/* CV Review, Edit & Display Workspace */}
      {cvData && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          {/* Workspace Tabs & Actions Bar */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: '#f8fafc'
          }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                  color: activeTab === 'preview' ? '#0f172a' : '#64748b',
                  boxShadow: activeTab === 'preview' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon name="eye" size={15} /> Lebenslauf Preview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'edit' ? '#0f172a' : '#64748b',
                  boxShadow: activeTab === 'edit' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon name="edit" size={15} /> Review & Edit Fields
              </button>
            </div>

            {/* Quick Export / Persistence Actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleCopyMarkdown}
                className="btn-outline"
                title="Copy Markdown representation"
                style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="copy" size={15} />
                {copied ? 'Copied!' : 'Copy Markdown'}
              </button>
              <button
                onClick={handlePrint}
                className="btn-outline"
                title="Print or Save as PDF"
                style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="printer" size={15} /> Print / PDF
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                <Icon name="check" size={15} />
                {isSaving ? 'Saving...' : 'Approve & Save Final CV'}
              </button>
            </div>
          </div>

          {/* TAB 1: PREVIEW (German Lebenslauf Document View) */}
          {activeTab === 'preview' && (
            <div style={{ padding: '40px', background: '#ffffff', minHeight: '600px' }} className="print-cv-container">
              <div style={{
                maxWidth: '820px',
                margin: '0 auto',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '48px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                color: '#1e293b'
              }}>
                {/* Header / Personal Data */}
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '24px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 6px', color: '#0f172a', letterSpacing: '-0.5px' }}>
                        {personal.fullName || 'Applicant Name'}
                      </h1>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb', marginBottom: '12px' }}>
                        {cvData.targetRole || personal.title || 'Qualified Professional'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                      {personal.email && <div>{personal.email}</div>}
                      {personal.phone && <div>{personal.phone}</div>}
                      {personal.location && <div>{personal.location}</div>}
                      {personal.linkedin && (
                        <div style={{ color: '#0284c7' }}>{personal.linkedin}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Kurzprofil (Professional Summary) */}
                {cvData.professionalSummary && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
                      Kurzprofil / Professional Summary
                    </h2>
                    <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
                      {cvData.professionalSummary}
                    </p>
                  </div>
                )}

                {/* Section: Berufserfahrung (Work Experience) */}
                {workExperience.length > 0 && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '16px' }}>
                      Berufserfahrung / Work Experience
                    </h2>
                    <div style={{ display: 'grid', gap: '18px' }}>
                      {workExperience.map((exp, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{exp.jobTitle || exp.position}</strong>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{exp.period || exp.duration || exp.experience}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', marginBottom: '6px' }}>
                            {exp.company} {exp.location ? `• ${exp.location}` : ''}
                          </div>
                          {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                              {exp.responsibilities.map((r, ri) => (
                                <li key={ri}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Ausbildung (Education) */}
                {education.length > 0 && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '16px' }}>
                      Ausbildung / Education & Qualifications
                    </h2>
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {education.map((edu, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</strong>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{edu.graduationYear || edu.year || edu.duration}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#475569' }}>
                            {edu.institution} {edu.grade ? `• Note: ${edu.grade}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Fachliche Kompetenzen (Skills) */}
                {(skills.technical?.length > 0 || skills.tools?.length > 0 || skills.soft?.length > 0) && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
                      Fachliche Kompetenzen / Skills & Competencies
                    </h2>
                    <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                      {skills.technical && skills.technical.length > 0 && (
                        <div>
                          <strong style={{ color: '#0f172a' }}>Technical Skills: </strong>
                          <span style={{ color: '#475569' }}>{skills.technical.join(', ')}</span>
                        </div>
                      )}
                      {skills.tools && skills.tools.length > 0 && (
                        <div>
                          <strong style={{ color: '#0f172a' }}>Tools & Frameworks: </strong>
                          <span style={{ color: '#475569' }}>{skills.tools.join(', ')}</span>
                        </div>
                      )}
                      {skills.soft && skills.soft.length > 0 && (
                        <div>
                          <strong style={{ color: '#0f172a' }}>Soft Skills: </strong>
                          <span style={{ color: '#475569' }}>{skills.soft.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section: Sprachkenntnisse (Languages) */}
                {languages.length > 0 && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
                      Sprachkenntnisse / Language Proficiency
                    </h2>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {languages.map((lang, idx) => (
                        <div key={idx} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}>
                          <strong style={{ color: '#0f172a' }}>{lang.language}: </strong>
                          <span style={{ color: '#2563eb', fontWeight: '600' }}>{lang.proficiency || lang.level || 'Competent'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Projekte (Projects) */}
                {projects.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
                      Projekte / Projects
                    </h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {projects.map((proj, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{proj.title}</strong>
                            {proj.technologies && proj.technologies.length > 0 && (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>{proj.technologies.join(', ')}</span>
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EDIT (Interactive Form Workspace) */}
          {activeTab === 'edit' && (
            <div style={{ padding: '32px', display: 'grid', gap: '28px' }}>
              {/* Contact Information */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px', color: '#1e293b' }}>
                  Personal & Contact Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      value={personal.fullName || ''}
                      onChange={(e) => setCvData({
                        ...cvData,
                        personalInfo: { ...personal, fullName: e.target.value }
                      })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      value={personal.email || ''}
                      onChange={(e) => setCvData({
                        ...cvData,
                        personalInfo: { ...personal, email: e.target.value }
                      })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Phone</label>
                    <input
                      type="text"
                      value={personal.phone || ''}
                      onChange={(e) => setCvData({
                        ...cvData,
                        personalInfo: { ...personal, phone: e.target.value }
                      })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Location / City</label>
                    <input
                      type="text"
                      value={personal.location || ''}
                      onChange={(e) => setCvData({
                        ...cvData,
                        personalInfo: { ...personal, location: e.target.value }
                      })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px', color: '#1e293b' }}>
                  Kurzprofil / Professional Summary
                </h3>
                <textarea
                  value={cvData.professionalSummary || ''}
                  onChange={(e) => setCvData({ ...cvData, professionalSummary: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Education (Ausbildung) */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                    Ausbildung / Education
                  </h3>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {education.map((edu, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '10px', alignItems: 'center', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        placeholder="Degree / Qualification"
                        value={edu.degree || ''}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...updated[i], degree: e.target.value };
                          setCvData({ ...cvData, education: updated });
                        }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution || ''}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...updated[i], institution: e.target.value };
                          setCvData({ ...cvData, education: updated });
                        }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        placeholder="Graduation Year"
                        value={edu.graduationYear || edu.year || ''}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...updated[i], graduationYear: e.target.value };
                          setCvData({ ...cvData, education: updated });
                        }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                    Berufserfahrung / Work Experience
                  </h3>
                </div>
                <div style={{ display: 'grid', gap: '14px' }}>
                  {workExperience.map((exp, i) => (
                    <div key={i} style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={exp.jobTitle || exp.position || ''}
                          onChange={(e) => {
                            const updated = [...workExperience];
                            updated[i] = { ...updated[i], jobTitle: e.target.value, position: e.target.value };
                            setCvData({ ...cvData, workExperience: updated });
                          }}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const updated = [...workExperience];
                            updated[i] = { ...updated[i], company: e.target.value };
                            setCvData({ ...cvData, workExperience: updated });
                          }}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <input
                          type="text"
                          placeholder="Period"
                          value={exp.period || exp.duration || exp.experience || ''}
                          onChange={(e) => {
                            const updated = [...workExperience];
                            updated[i] = { ...updated[i], period: e.target.value, duration: e.target.value };
                            setCvData({ ...cvData, workExperience: updated });
                          }}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <textarea
                        placeholder="Key responsibilities (one per line)"
                        rows={2}
                        value={Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : ''}
                        onChange={(e) => {
                          const updated = [...workExperience];
                          updated[i] = { ...updated[i], responsibilities: e.target.value.split('\n').filter(Boolean) };
                          setCvData({ ...cvData, workExperience: updated });
                        }}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
