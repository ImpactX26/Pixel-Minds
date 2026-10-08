import { Injectable, Logger } from '@nestjs/common';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import {
  ActionPriority,
  ActionStatus,
  NextActionType,
  RequirementStatus,
} from '../common/enums';
import { QualificationEvaluationSummary } from '../qualification/interfaces/requirement.interface';
import { NextActionResult } from './interfaces/next-action.interface';

@Injectable()
export class NextActionEngine {
  private readonly logger = new Logger(NextActionEngine.name);

  /**
   * Deterministically decides exactly ONE clear Recommended Next Step for an applicant.
   * Priority:
   * 1. Document verification mismatch / clarification required
   * 2. Missing mandatory profile / pathway requirements
   * 3. Missing mandatory documents (graduation certificate, language certificate, CV)
   * 4. Everything ready -> Proceed to Eligibility Assessment
   */
  determineNextAction(
    applicant: Applicant,
    profile: ApplicantProfile | null,
    documents: Document[] = [],
    qualification?: QualificationEvaluationSummary,
  ): NextActionResult {
    const parseJson = (val: any) => {
      if (!val) return {};
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val;
    };

    const additionalInfo = parseJson(profile?.additionalInfo);
    const reqData = additionalInfo.requirement || {};
    const personalData = additionalInfo.personal || {};
    const educationData = parseJson(profile?.education);

    const getDocCategory = (doc: Document) => {
      const type = (doc.type || '').toLowerCase();
      const name = (doc.name || '').toLowerCase();
      if (
        type.includes('degree') ||
        type.includes('academic') ||
        type.includes('graduation') ||
        name.includes('degree') ||
        name.includes('graduation')
      ) {
        return 'DEGREE_CERTIFICATE';
      }
      if (
        type.includes('lang') ||
        type.includes('german') ||
        name.includes('lang') ||
        name.includes('german')
      ) {
        return 'LANGUAGE_CERTIFICATE';
      }
      if (
        type.includes('cv') ||
        type.includes('resume') ||
        name.includes('cv') ||
        name.includes('resume')
      ) {
        return 'CV';
      }
      if (type.includes('passport') || name.includes('passport')) {
        return 'PASSPORT';
      }
      return doc.type || doc.name || doc.id;
    };

    // Group documents to evaluate the most recent upload for each category
    const activeDocMap = new Map<string, Document>();
    for (const doc of documents) {
      const cat = getDocCategory(doc);
      if (!activeDocMap.has(cat)) {
        activeDocMap.set(cat, doc);
      }
    }
    const activeDocuments = Array.from(activeDocMap.values());

    // =========================================================================
    // 1. DOCUMENT VERIFICATION MISMATCH / CLARIFICATION REQUIRED (Highest Priority)
    // =========================================================================
    for (const doc of activeDocuments) {
      const ext = parseJson(doc.extractedData);
      const vResult = ext.verificationResult;
      const isMismatch =
        vResult?.overallStatus === 'MISMATCH' ||
        vResult?.clarificationRequired === true ||
        vResult?.fields?.some((f: any) => f.status === 'MISMATCH') ||
        doc.status === 'rejected' ||
        doc.status === 'failed';

      if (isMismatch) {
        const docTypeLower = (doc.type || '').toLowerCase();
        const docNameLower = (doc.name || '').toLowerCase();

        const isGradCert =
          docTypeLower.includes('degree') ||
          docTypeLower.includes('academic') ||
          docTypeLower.includes('graduation') ||
          docNameLower.includes('degree') ||
          docNameLower.includes('graduation');

        const isCv =
          docTypeLower.includes('cv') ||
          docTypeLower.includes('resume') ||
          docNameLower.includes('cv') ||
          docNameLower.includes('resume');

        const isLangCert =
          docTypeLower.includes('lang') ||
          docTypeLower.includes('german') ||
          docNameLower.includes('lang') ||
          docNameLower.includes('german');

        const mismatchedField = vResult?.fields?.find((f: any) => f.status === 'MISMATCH');

        let title = 'Check uploaded document';
        let reason = vResult?.clarificationMessage;

        if (isGradCert) {
          title = 'Check graduation certificate';
          if (!reason) {
            if (mismatchedField?.field === 'graduationYear') {
              reason = "⚠️ Please check your graduation certificate — the graduation year doesn't match your profile.";
            } else if (mismatchedField?.field === 'institution') {
              reason = "⚠️ Please check your graduation certificate — the institution doesn't match your profile.";
            } else if (mismatchedField?.field === 'degree') {
              reason = "⚠️ Please check your graduation certificate — the degree doesn't match your profile.";
            } else {
              reason = "⚠️ Please check your graduation certificate — details do not match your profile.";
            }
          } else if (!reason.startsWith('⚠️')) {
            reason = `⚠️ ${reason}`;
          }
        } else if (isLangCert) {
          title = 'Check language certificate';
          if (!reason) {
            reason = "⚠️ Please check your language certificate — details do not match your profile.";
          } else if (!reason.startsWith('⚠️')) {
            reason = `⚠️ ${reason}`;
          }
        } else if (isCv) {
          title = 'Check CV';
          if (!reason) {
            reason = "⚠️ Please check your CV — details do not match your profile.";
          } else if (!reason.startsWith('⚠️')) {
            reason = `⚠️ ${reason}`;
          }
        } else {
          title = `Check ${doc.name || 'document'}`;
          if (!reason) {
            reason = `⚠️ Please check your ${doc.name || 'document'} — discrepancies found.`;
          } else if (!reason.startsWith('⚠️')) {
            reason = `⚠️ ${reason}`;
          }
        }

        return {
          action: NextActionType.RESOLVE_CONFLICT,
          title,
          reason,
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: doc.type || 'DOCUMENT_VERIFICATION',
        };
      }
    }

    // =========================================================================
    // 2. MISSING PROFILE & PATHWAY REQUIREMENTS
    // =========================================================================
    if (!applicant.country && !reqData.country) {
      return {
        action: NextActionType.COMPLETE_PROFILE,
        title: 'Specify target country',
        reason: 'Please complete your pathway requirements — specify your target destination country.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'COUNTRY',
      };
    }

    if (!applicant.goal && !reqData.role) {
      return {
        action: NextActionType.COMPLETE_PROFILE,
        title: 'Specify target job role',
        reason: 'Please complete your pathway requirements — specify your target job role.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'GOAL',
      };
    }

    const hasEducation = Boolean(
      educationData.degree ||
        educationData.field ||
        educationData.institution ||
        (Array.isArray(profile?.education) && profile?.education.length > 0),
    );
    if (!hasEducation) {
      return {
        action: NextActionType.COMPLETE_PROFILE,
        title: 'Complete education details',
        reason: 'Please complete your education details in your profile.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'EDUCATION',
      };
    }

    if (!applicant.name && !personalData.fullName) {
      return {
        action: NextActionType.COMPLETE_PROFILE,
        title: 'Provide full name',
        reason: 'Please complete your personal details (full name).',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'FULL_NAME',
      };
    }

    // =========================================================================
    // 3. MISSING MANDATORY DOCUMENTS
    // =========================================================================
    // Check Graduation / Degree Certificate
    const hasDegreeDoc = activeDocuments.some((d) => {
      const t = (d.type || '').toUpperCase();
      const n = (d.name || '').toUpperCase();
      return (
        t === 'DEGREE_CERTIFICATE' ||
        t.includes('DEGREE') ||
        t.includes('ACADEMIC') ||
        n.includes('DEGREE') ||
        n.includes('GRADUATION')
      );
    });

    if (!hasDegreeDoc) {
      return {
        action: NextActionType.UPLOAD_DOCUMENT,
        title: 'Upload graduation certificate',
        reason: '📄 Please upload your graduation certificate.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'DEGREE_CERTIFICATE',
      };
    }

    // Check Language Certificate
    const hasLangDoc = activeDocuments.some((d) => {
      const t = (d.type || '').toUpperCase();
      const n = (d.name || '').toUpperCase();
      return (
        t === 'LANGUAGE_CERTIFICATE' ||
        t.includes('LANGUAGE') ||
        t.includes('GERMAN') ||
        n.includes('LANGUAGE') ||
        n.includes('GERMAN')
      );
    });

    if (!hasLangDoc) {
      return {
        action: NextActionType.UPLOAD_DOCUMENT,
        title: 'Upload language certificate',
        reason: '📄 Please upload your language certificate.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'GERMAN_LANGUAGE_CERTIFICATE',
      };
    }

    // Check CV
    const hasCvDoc = activeDocuments.some((d) => {
      const t = (d.type || '').toUpperCase();
      const n = (d.name || '').toUpperCase();
      return t === 'CV' || t.includes('RESUME') || n.includes('CV') || n.includes('RESUME');
    });

    if (!hasCvDoc) {
      return {
        action: NextActionType.UPLOAD_DOCUMENT,
        title: 'Upload your CV',
        reason: '📄 Please upload your CV.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: 'CV',
      };
    }

    // =========================================================================
    // 4. EVERYTHING CURRENTLY COMPLETE
    // =========================================================================
    return {
      action: NextActionType.CONTACT_EDUCARO,
      title: 'Proceed to Eligibility Assessment',
      reason: '✅ Your information is ready. Proceed to Eligibility Assessment.',
      priority: ActionPriority.LOW,
      status: ActionStatus.PENDING,
      requirementCode: 'READY',
    };
  }
}

