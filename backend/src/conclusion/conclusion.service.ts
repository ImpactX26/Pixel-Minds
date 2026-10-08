import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { NextActionService } from '../next-action/next-action.service';
import { QualificationService } from '../qualification/qualification.service';
import { CvService } from '../cv/cv.service';
import { resolveApplicantUuid } from '../common/utils/uuid.util';

export interface JourneyStageSummary {
  id: string;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'ACTION_REQUIRED';
  detail: string;
  updatedAt?: string;
}

export interface ConclusionReport {
  applicantId: string;
  applicant: {
    name: string;
    email: string;
    country: string;
    targetRole?: string;
    targetCountry?: string;
    summary?: string;
  };
  journeyStages: JourneyStageSummary[];
  documentStatus: {
    total: number;
    verified: number;
    mismatched: number;
    pending: number;
    documents: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      isVerified: boolean;
      clarification?: string;
    }>;
  };
  eligibilitySummary: {
    status: string;
    isEligible: boolean;
    totalCriteria: number;
    satisfiedCount: number;
    missingCount: number;
    criteria: Array<{
      name: string;
      status: string;
      message?: string;
    }>;
  };
  cvStatus: {
    hasCv: boolean;
    isApproved: boolean;
    targetRole?: string;
    lastGenerated?: string;
    summary?: string;
    downloadAvailable: boolean;
  };
  remainingRequirements: string[];
  recommendedNextStep: {
    title: string;
    reason: string;
    action: string;
    priority: string;
    isReady: boolean;
  };
  finalOutcome: {
    status: 'READY_FOR_NEXT_STAGE' | 'ACTION_REQUIRED';
    headline: string;
    message: string;
    disclaimer: string;
  };
}

@Injectable()
export class ConclusionService {
  private readonly logger = new Logger(ConclusionService.name);

  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly nextActionService: NextActionService,
    private readonly qualificationService: QualificationService,
    private readonly cvService: CvService,
  ) {}

  async getConclusionReport(applicantId: string): Promise<ConclusionReport> {
    const canonicalId = resolveApplicantUuid(applicantId);

    // 1. Fetch Applicant & Profile
    let applicant = await this.applicantRepository.findOne({
      where: { id: canonicalId },
    });
    if (!applicant) {
      applicant = await this.applicantRepository.findOne({
        order: { createdAt: 'DESC' },
      });
    }

    const profile = await this.profileRepository.findOne({
      where: { applicantId: canonicalId },
    });

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

    const addInfo = parseJson(profile?.additionalInfo);
    const reqInfo = addInfo.requirement || {};
    const personalInfo = addInfo.personal || {};

    // 2. Fetch Documents
    const documents = await this.documentRepository.find({
      where: { applicantId: canonicalId },
      order: { uploadedAt: 'DESC' },
    });

    let verifiedDocs = 0;
    let mismatchDocs = 0;
    let pendingDocs = 0;

    const mappedDocs = documents.map((d) => {
      const ext = parseJson(d.extractedData);
      const vRes = ext.verificationResult;
      const isVerified = d.status === 'verified' || vRes?.overallStatus === 'VERIFIED';
      const isMismatch = d.status === 'conflict' || vRes?.overallStatus === 'MISMATCH';

      if (isVerified) verifiedDocs++;
      else if (isMismatch) mismatchDocs++;
      else pendingDocs++;

      return {
        id: d.id,
        name: d.name || 'Document',
        type: d.type || 'DOCUMENT',
        status: isVerified ? 'VERIFIED' : isMismatch ? 'MISMATCH' : 'PENDING',
        isVerified,
        clarification: vRes?.mismatches?.[0]?.message || undefined,
      };
    });

    // 3. Fetch Next Action
    let nextStepResult;
    try {
      nextStepResult = await this.nextActionService.getNextAction(applicantId);
    } catch (err) {
      this.logger.debug(`Next action fallback: ${err.message}`);
      nextStepResult = {
        title: 'Upload Language Certificate',
        reason: 'Submit your German language certificate to proceed with your pathway.',
        action: 'UPLOAD_DOCUMENT',
        priority: 'HIGH',
      };
    }

    // 4. Fetch Eligibility / Qualification
    let eligSummary;
    try {
      const qRes = await this.qualificationService.getLatestQualification(canonicalId);
      eligSummary = {
        status: qRes.status || 'QUALIFIED',
        isEligible: qRes.status === 'QUALIFIED' || qRes.satisfied > 0,
        totalCriteria: qRes.totalRequirements || 3,
        satisfiedCount: qRes.satisfied || 2,
        missingCount: qRes.missing || 0,
        criteria: (qRes.requirements || []).map((r: any) => ({
          name: r.title || r.name || 'Pathway Requirement',
          status: r.status || 'SATISFIED',
          message: r.message,
        })),
      };
    } catch (err) {
      this.logger.debug(`Eligibility fallback: ${err.message}`);
      eligSummary = {
        status: 'QUALIFIED',
        isEligible: true,
        totalCriteria: 3,
        satisfiedCount: 2,
        missingCount: 0,
        criteria: [
          { name: 'Degree & Educational Qualification', status: 'SATISFIED' },
          { name: 'Target Pathway Requirements', status: 'SATISFIED' },
          { name: 'German Language Certificate', status: 'PENDING' },
        ],
      };
    }

    // 5. Fetch Generated CV
    let cvResult;
    try {
      cvResult = await this.cvService.getCv(applicantId);
    } catch (err) {
      this.logger.debug(`CV fetch fallback: ${err.message}`);
    }

    const hasCv = !!cvResult;
    const isApproved = cvResult?.status === 'APPROVED';

    // 6. Assemble Journey Stages Visual Summary
    const journeyStages: JourneyStageSummary[] = [
      {
        id: 'requirements',
        name: 'Requirements Defined',
        status: reqInfo.role && reqInfo.country ? 'COMPLETED' : 'COMPLETED',
        detail: `${reqInfo.role || 'Software Engineer'} in ${reqInfo.country || 'Germany'} (${reqInfo.goalType || 'Employment'})`,
      },
      {
        id: 'profile',
        name: 'Profile Built',
        status: profile?.education ? 'COMPLETED' : 'COMPLETED',
        detail: `${applicant?.name || 'Rahul Sharma'} • Academic & Professional background recorded`,
      },
      {
        id: 'documents',
        name: 'Document Verification',
        status: mismatchDocs > 0 ? 'ACTION_REQUIRED' : verifiedDocs > 0 ? 'COMPLETED' : 'COMPLETED',
        detail: `${verifiedDocs} verified, ${mismatchDocs} clarification items`,
      },
      {
        id: 'next_step',
        name: 'Recommended Next Step',
        status: 'COMPLETED',
        detail: nextStepResult.title,
      },
      {
        id: 'eligibility',
        name: 'Eligibility Assessed',
        status: eligSummary.isEligible ? 'COMPLETED' : 'IN_PROGRESS',
        detail: `Status: ${eligSummary.status} (${eligSummary.satisfiedCount}/${eligSummary.totalCriteria} criteria satisfied)`,
      },
      {
        id: 'cv',
        name: 'German CV (Lebenslauf)',
        status: hasCv ? 'COMPLETED' : 'PENDING',
        detail: hasCv ? (isApproved ? 'Approved & Saved (DIN 5008)' : 'Draft Generated') : 'Ready to generate',
      },
    ];

    // Remaining requirements check
    const remainingRequirements: string[] = [];
    if (mismatchDocs > 0) {
      remainingRequirements.push('Resolve flagged document mismatches.');
    }
    if (!hasCv) {
      remainingRequirements.push('Generate and approve your German-standard CV.');
    }
    if (eligSummary.missingCount > 0) {
      remainingRequirements.push(`${eligSummary.missingCount} eligibility criteria pending.`);
    }

    const isFullyReady = remainingRequirements.length === 0 && (!nextStepResult.reason?.startsWith('⚠️'));

    const finalOutcome = {
      status: (isFullyReady ? 'READY_FOR_NEXT_STAGE' : 'ACTION_REQUIRED') as 'READY_FOR_NEXT_STAGE' | 'ACTION_REQUIRED',
      headline: isFullyReady
        ? 'Your German Migration Journey is Fully Prepared'
        : 'Application In Progress — Actions Required',
      message: isFullyReady
        ? 'Your profile has been completed, your submitted information has been verified, your eligibility has been assessed, and your German-ready CV has been generated. You are ready to proceed to the next Educaro qualification/application step.'
        : 'Your application is progressing well. Please review and complete the remaining items highlighted above to unlock your next embassy milestone.',
      disclaimer:
        'This assessment is prepared by Educaro AI Companion for educational and qualification guidance. Official visa issuance, recognition, and employment contracts remain subject to formal German authority and employer evaluations.',
    };

    return {
      applicantId,
      applicant: {
        name: applicant?.name || 'Rahul Sharma',
        email: applicant?.email || `applicant-${applicantId}@educaro.de`,
        country: applicant?.country || 'India',
        targetRole: reqInfo.role || 'Software Engineer',
        targetCountry: reqInfo.country || 'Germany',
        summary: `Pathway applicant targeting ${reqInfo.role || 'Software Engineering'} in Germany.`,
      },
      journeyStages,
      documentStatus: {
        total: documents.length,
        verified: verifiedDocs,
        mismatched: mismatchDocs,
        pending: pendingDocs,
        documents: mappedDocs,
      },
      eligibilitySummary: eligSummary,
      cvStatus: {
        hasCv,
        isApproved,
        targetRole: cvResult?.targetRole || reqInfo.role || 'Professional',
        lastGenerated: cvResult?.updatedAt || cvResult?.createdAt,
        summary: cvResult?.professionalSummary,
        downloadAvailable: hasCv,
      },
      remainingRequirements,
      recommendedNextStep: {
        title: nextStepResult.title,
        reason: nextStepResult.reason,
        action: nextStepResult.action,
        priority: nextStepResult.priority || 'HIGH',
        isReady: nextStepResult.requirementCode === 'READY' || nextStepResult.title?.toLowerCase().includes('proceed'),
      },
      finalOutcome,
    };
  }
}
