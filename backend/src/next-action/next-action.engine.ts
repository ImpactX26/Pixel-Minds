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
   * Deterministically decides exactly ONE highest-priority Next Best Action
   */
  determineNextAction(
    applicant: Applicant,
    profile: ApplicantProfile | null,
    documents: Document[] = [],
    qualification: QualificationEvaluationSummary,
  ): NextActionResult {
    const reqs = qualification.requirements || [];

    // ----------------------------------------------------
    // PRIORITY 1: Resolve CONFLICT
    // ----------------------------------------------------
    const conflictReq = reqs.find((r) => r.status === RequirementStatus.CONFLICT);
    if (conflictReq) {
      if (conflictReq.code === 'UNIVERSITY') {
        return {
          action: NextActionType.RESOLVE_CONFLICT,
          title: 'Resolve your university information',
          reason:
            conflictReq.reason ||
            'Your profile university does not match your degree certificate.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: conflictReq.code,
        };
      }

      return {
        action: NextActionType.RESOLVE_CONFLICT,
        title: `Resolve your ${conflictReq.title.toLowerCase()}`,
        reason:
          conflictReq.reason ||
          `Conflicting data found for ${conflictReq.title.toLowerCase()}. Please resolve the discrepancy.`,
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: conflictReq.code,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 2: Complete mandatory missing profile information
    // ----------------------------------------------------
    const missingProfileReq = reqs.find(
      (r) =>
        r.required &&
        r.category === 'PROFILE' &&
        (r.status === RequirementStatus.MISSING || r.status === RequirementStatus.INCOMPLETE),
    );

    if (missingProfileReq) {
      if (missingProfileReq.code === 'DATE_OF_BIRTH') {
        return {
          action: NextActionType.COMPLETE_PROFILE,
          title: 'Add your date of birth',
          reason: 'Your date of birth is required to continue your application.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: missingProfileReq.code,
        };
      }

      if (missingProfileReq.code === 'FULL_NAME') {
        return {
          action: NextActionType.COMPLETE_PROFILE,
          title: 'Provide your full name',
          reason: 'Your full name is required to continue your application.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: missingProfileReq.code,
        };
      }

      if (missingProfileReq.code === 'GOAL') {
        return {
          action: NextActionType.COMPLETE_PROFILE,
          title: 'Specify your target goal in Germany',
          reason: 'Your academic or career goal in Germany is required to tailor your pathway.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: missingProfileReq.code,
        };
      }

      return {
        action: NextActionType.COMPLETE_PROFILE,
        title: `Provide your ${missingProfileReq.title.toLowerCase()}`,
        reason: missingProfileReq.reason || 'Mandatory profile information is required.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: missingProfileReq.code,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 3: Upload mandatory missing document
    // ----------------------------------------------------
    const missingDocReq = reqs.find((r) => {
      if (!r.required) return false;
      if (r.status !== RequirementStatus.MISSING && r.status !== RequirementStatus.INCOMPLETE) {
        return false;
      }
      return (
        r.category === 'DOCUMENTS' ||
        r.code === 'DEGREE_CERTIFICATE' ||
        r.code === 'PASSPORT' ||
        r.code === 'GERMAN_LANGUAGE_CERTIFICATE'
      );
    });

    if (missingDocReq) {
      if (missingDocReq.code === 'GERMAN_LANGUAGE_CERTIFICATE') {
        return {
          action: NextActionType.UPLOAD_DOCUMENT,
          title: 'Upload your German language certificate',
          reason: 'Your German language qualification is still pending.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: missingDocReq.code,
        };
      }

      if (missingDocReq.code === 'DEGREE_CERTIFICATE') {
        return {
          action: NextActionType.UPLOAD_DOCUMENT,
          title: 'Upload your degree certificate',
          reason: 'Your academic degree certificate is required to verify your eligibility.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: missingDocReq.code,
        };
      }

      if (missingDocReq.code === 'PASSPORT') {
        return {
          action: NextActionType.UPLOAD_DOCUMENT,
          title: 'Upload your passport',
          reason: 'A valid passport copy is required for international student verification.',
          priority: ActionPriority.HIGH,
          status: ActionStatus.PENDING,
          requirementCode: missingDocReq.code,
        };
      }

      return {
        action: NextActionType.UPLOAD_DOCUMENT,
        title: `Upload your ${missingDocReq.title.toLowerCase()}`,
        reason: missingDocReq.reason || `Please upload your ${missingDocReq.title.toLowerCase()} to proceed.`,
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: missingDocReq.code,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 4: Complete pending verification
    // ----------------------------------------------------
    const pendingVerificationReq = reqs.find(
      (r) => r.status === RequirementStatus.PENDING_VERIFICATION,
    );

    if (pendingVerificationReq) {
      return {
        action: NextActionType.VERIFY_DOCUMENT,
        title: `Verify your ${pendingVerificationReq.title.toLowerCase()}`,
        reason:
          pendingVerificationReq.reason ||
          'Document extraction confidence requires manual review or re-upload of a clearer document.',
        priority: ActionPriority.HIGH,
        status: ActionStatus.PENDING,
        requirementCode: pendingVerificationReq.code,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 5: Complete remaining qualification requirement
    // ----------------------------------------------------
    const remainingReq = reqs.find(
      (r) =>
        r.required &&
        (r.status === RequirementStatus.MISSING || r.status === RequirementStatus.INCOMPLETE),
    );

    if (remainingReq) {
      return {
        action: NextActionType.COMPLETE_REQUIREMENT,
        title: `Provide your ${remainingReq.title.toLowerCase()}`,
        reason: remainingReq.reason || `Please fulfill your ${remainingReq.title.toLowerCase()} to proceed.`,
        priority: ActionPriority.MEDIUM,
        status: ActionStatus.PENDING,
        requirementCode: remainingReq.code,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 6: Educaro next-step action (All mandatory requirements satisfied / QUALIFIED)
    // ----------------------------------------------------
    if (qualification.status === 'QUALIFIED') {
      return {
        action: NextActionType.CONTACT_EDUCARO,
        title: 'Your profile is ready for the next step',
        reason: 'Your required information and documents are complete.',
        priority: ActionPriority.MEDIUM,
        status: ActionStatus.PENDING,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 7: Optional profile improvement
    // ----------------------------------------------------
    const workExp = profile?.workExperience || [];
    const skills = profile?.skills || [];
    if (workExp.length === 0 || skills.length === 0) {
      return {
        action: NextActionType.OPTIONAL_IMPROVEMENT,
        title: 'Enhance your profile',
        reason: 'Add work experience or additional skills to improve your German university admission chances.',
        priority: ActionPriority.LOW,
        status: ActionStatus.PENDING,
      };
    }

    // ----------------------------------------------------
    // PRIORITY 8: No Action
    // ----------------------------------------------------
    return {
      action: NextActionType.NO_ACTION,
      title: 'Application is up to date',
      reason: 'No pending actions at this time.',
      priority: ActionPriority.LOW,
      status: ActionStatus.PENDING,
    };
  }
}
