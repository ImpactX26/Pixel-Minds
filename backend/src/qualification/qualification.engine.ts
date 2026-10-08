import { Injectable, Logger } from '@nestjs/common';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { RequirementStatus, QualificationStatus } from '../common/enums';
import {
  EvaluatedRequirement,
  QualificationEvaluationSummary,
  RequirementDefinition,
} from './interfaces/requirement.interface';
import { DEFAULT_REQUIREMENTS } from './rules/requirement-definitions';

@Injectable()
export class QualificationEngine {
  private readonly logger = new Logger(QualificationEngine.name);

  /**
   * Deterministically evaluates an applicant's qualification status
   */
  evaluate(
    applicant: Applicant,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): QualificationEvaluationSummary {
    const evaluatedRequirements: EvaluatedRequirement[] = [];

    for (const def of DEFAULT_REQUIREMENTS) {
      const result = this.evaluateSingleRequirement(def, applicant, profile, documents);
      evaluatedRequirements.push(result);
    }

    // Counts
    let satisfied = 0;
    let missing = 0;
    let incomplete = 0;
    let conflicts = 0;
    let pendingVerification = 0;

    const completedRequirements: EvaluatedRequirement[] = [];
    const missingRequirements: EvaluatedRequirement[] = [];

    for (const req of evaluatedRequirements) {
      switch (req.status) {
        case RequirementStatus.SATISFIED:
          satisfied++;
          completedRequirements.push(req);
          break;
        case RequirementStatus.MISSING:
          missing++;
          missingRequirements.push(req);
          break;
        case RequirementStatus.INCOMPLETE:
          incomplete++;
          missingRequirements.push(req);
          break;
        case RequirementStatus.CONFLICT:
          conflicts++;
          missingRequirements.push(req);
          break;
        case RequirementStatus.PENDING_VERIFICATION:
          pendingVerification++;
          missingRequirements.push(req);
          break;
        default:
          break;
      }
    }

    // Determine overall qualification status
    let overallStatus = 'QUALIFIED';
    let qualificationStatus = QualificationStatus.QUALIFIED;

    const hasRequiredConflict = evaluatedRequirements.some(
      r => r.required && r.status === RequirementStatus.CONFLICT,
    );
    const hasRequiredMissingOrIncomplete = evaluatedRequirements.some(
      r => r.required && (r.status === RequirementStatus.MISSING || r.status === RequirementStatus.INCOMPLETE),
    );
    const hasRequiredPendingVerification = evaluatedRequirements.some(
      r => r.required && r.status === RequirementStatus.PENDING_VERIFICATION,
    );

    if (hasRequiredConflict) {
      overallStatus = 'CONFLICT';
      qualificationStatus = QualificationStatus.NOT_QUALIFIED;
    } else if (hasRequiredMissingOrIncomplete) {
      overallStatus = 'INCOMPLETE';
      qualificationStatus = QualificationStatus.PENDING;
    } else if (hasRequiredPendingVerification) {
      overallStatus = 'PENDING';
      qualificationStatus = QualificationStatus.IN_REVIEW;
    } else {
      overallStatus = 'QUALIFIED';
      qualificationStatus = QualificationStatus.QUALIFIED;
    }

    this.logger.log(
      `Evaluated qualification for applicant ${applicant.id}: Status = ${overallStatus} (${satisfied}/${evaluatedRequirements.length} satisfied, ${conflicts} conflicts, ${missing + incomplete} missing/incomplete)`,
    );

    return {
      applicantId: applicant.id,
      status: overallStatus,
      qualificationStatus,
      totalRequirements: evaluatedRequirements.length,
      satisfied,
      missing,
      incomplete,
      conflicts,
      pendingVerification,
      completedRequirements,
      missingRequirements,
      requirements: evaluatedRequirements,
    };
  }

  private parseJsonField<T>(field: any, defaultValue: T): T {
    if (!field) return defaultValue;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return defaultValue;
      }
    }
    return field as T;
  }

  private evaluateSingleRequirement(
    def: RequirementDefinition,
    applicant: Applicant,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    switch (def.code) {
      case 'FULL_NAME':
        return this.evalFullName(def, applicant, profile);
      case 'DATE_OF_BIRTH':
        return this.evalDateOfBirth(def, applicant, profile, documents);
      case 'GOAL':
        return this.evalGoal(def, applicant);
      case 'DEGREE_CERTIFICATE':
        return this.evalDegreeCertificate(def, profile, documents);
      case 'UNIVERSITY':
        return this.evalUniversity(def, profile, documents);
      case 'GRADUATION_YEAR':
        return this.evalGraduationYear(def, profile, documents);
      case 'PASSPORT':
        return this.evalPassport(def, documents);
      case 'GERMAN_LANGUAGE_CERTIFICATE':
        return this.evalGermanLanguage(def, profile, documents);
      default:
        return {
          ...def,
          status: RequirementStatus.NOT_APPLICABLE,
          reason: 'Requirement rule not configured',
        };
    }
  }

  private evalFullName(
    def: RequirementDefinition,
    applicant: Applicant,
    profile?: ApplicantProfile | null,
  ): EvaluatedRequirement {
    const additionalInfo = this.parseJsonField<Record<string, any>>(profile?.additionalInfo, {});
    const name = applicant.name || additionalInfo.fullName || additionalInfo.name;
    if (name && typeof name === 'string' && name.trim().length > 0) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `Full name verified: ${name.trim()}`,
        details: { name: name.trim() },
      };
    }
    return {
      ...def,
      status: RequirementStatus.MISSING,
      reason: 'Full name is missing from applicant profile',
    };
  }

  private evalDateOfBirth(
    def: RequirementDefinition,
    applicant: Applicant,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    const additionalInfo = this.parseJsonField<Record<string, any>>(profile?.additionalInfo, {});
    const profileDob = additionalInfo.dateOfBirth || additionalInfo.dob;

    const docWithDob = documents.find(d => {
      const ext = this.parseJsonField<Record<string, any>>(d.extractedData, {});
      return ext.dateOfBirth || ext.dob;
    });
    const docExtracted = this.parseJsonField<Record<string, any>>(docWithDob?.extractedData, {});
    const docDob = docExtracted.dateOfBirth || docExtracted.dob;
    const confidence = docExtracted.confidence;

    if (confidence !== undefined && confidence < 0.7) {
      return {
        ...def,
        status: RequirementStatus.PENDING_VERIFICATION,
        reason: `Date of birth extracted with low confidence (${confidence}), manual review required`,
        details: { dateOfBirth: docDob, confidence },
        confidence,
      };
    }

    const dob = profileDob || docDob;
    if (dob && typeof dob === 'string' && dob.trim().length > 0) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `Date of birth verified: ${dob}`,
        details: { dateOfBirth: dob },
      };
    }

    return {
      ...def,
      status: RequirementStatus.MISSING,
      reason: 'Date of birth is not provided in profile or documents',
    };
  }

  private evalGoal(
    def: RequirementDefinition,
    applicant: Applicant,
  ): EvaluatedRequirement {
    if (applicant.goal && typeof applicant.goal === 'string' && applicant.goal.trim().length > 0) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `Target academic/career goal specified: ${applicant.goal.trim()}`,
        details: { goal: applicant.goal.trim() },
      };
    }
    return {
      ...def,
      status: RequirementStatus.MISSING,
      reason: 'Target goal in Germany has not been specified',
    };
  }

  private evalDegreeCertificate(
    def: RequirementDefinition,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    const education = this.parseJsonField<Record<string, any>>(profile?.education, {});
    const degreeDocs = documents.filter(d => {
      const type = (d.type || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return (
        type.includes('degree') ||
        type.includes('academic') ||
        type.includes('transcript') ||
        type.includes('education') ||
        name.includes('degree') ||
        name.includes('transcript') ||
        name.includes('certificate')
      );
    });

    if (degreeDocs.length === 0) {
      return {
        ...def,
        status: RequirementStatus.MISSING,
        reason: 'Degree certificate or academic transcript has not been uploaded',
      };
    }

    const processedDoc = degreeDocs.find(d => d.status === 'processed' || d.status === 'verified');
    if (!processedDoc) {
      const activeDoc = degreeDocs[0];
      return {
        ...def,
        status: RequirementStatus.INCOMPLETE,
        reason: `Degree certificate uploaded (${activeDoc.name}) but pending processing (status: ${activeDoc.status})`,
        details: { documentId: activeDoc.id, status: activeDoc.status },
      };
    }

    const ext = this.parseJsonField<Record<string, any>>(processedDoc.extractedData, {});
    const confidence = ext.confidence;
    if (confidence !== undefined && confidence < 0.7) {
      return {
        ...def,
        status: RequirementStatus.PENDING_VERIFICATION,
        reason: `Degree certificate extracted with low confidence (${confidence}), verification required`,
        details: { documentId: processedDoc.id, confidence },
        confidence,
      };
    }

    const degreeTitle = ext.degree || ext.degreeName || education.degree;

    if (degreeTitle) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `Degree certificate verified: ${degreeTitle}`,
        details: {
          documentId: processedDoc.id,
          degree: degreeTitle,
          extractedData: ext,
        },
      };
    }

    return {
      ...def,
      status: RequirementStatus.INCOMPLETE,
      reason: 'Degree certificate processed but degree title could not be identified',
      details: { documentId: processedDoc.id },
    };
  }

  private evalUniversity(
    def: RequirementDefinition,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    const education = this.parseJsonField<Record<string, any>>(profile?.education, {});
    const profileUni = education.university?.trim();

    const docWithUni = documents.find(d => {
      if (d.status !== 'processed' && d.status !== 'verified') return false;
      const ext = this.parseJsonField<Record<string, any>>(d.extractedData, {});
      return ext.university;
    });

    const docExt = this.parseJsonField<Record<string, any>>(docWithUni?.extractedData, {});
    const docUni = docExt.university?.trim();

    if (profileUni && docUni) {
      const normProfile = profileUni.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normDoc = docUni.toLowerCase().replace(/[^a-z0-9]/g, '');

      const isMatch = normProfile.includes(normDoc) || normDoc.includes(normProfile);

      if (!isMatch) {
        return {
          ...def,
          status: RequirementStatus.CONFLICT,
          reason: `Conflict detected: Profile states "${profileUni}" while uploaded degree document extracted "${docUni}"`,
          details: { profileUniversity: profileUni, documentUniversity: docUni },
        };
      }

      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `University verified: ${docUni}`,
        details: { university: docUni },
      };
    }

    if (docUni) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `University verified from document: ${docUni}`,
        details: { university: docUni },
      };
    }

    if (profileUni) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `University recorded from profile: ${profileUni}`,
        details: { university: profileUni },
      };
    }

    return {
      ...def,
      status: RequirementStatus.MISSING,
      reason: 'University or academic institution information is missing',
    };
  }

  private evalGraduationYear(
    def: RequirementDefinition,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    const education = this.parseJsonField<Record<string, any>>(profile?.education, {});
    const profileYear = education.year || education.graduationYear;

    const docWithYear = documents.find(d => {
      if (d.status !== 'processed' && d.status !== 'verified') return false;
      const ext = this.parseJsonField<Record<string, any>>(d.extractedData, {});
      return ext.graduationYear || ext.year;
    });

    const docExt = this.parseJsonField<Record<string, any>>(docWithYear?.extractedData, {});
    const docYear = docExt.graduationYear || docExt.year;

    const year = docYear || profileYear;
    if (year) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `Graduation year verified: ${year}`,
        details: { graduationYear: year },
      };
    }

    return {
      ...def,
      status: RequirementStatus.MISSING,
      reason: 'Graduation year is missing from profile and academic documents',
    };
  }

  private evalPassport(
    def: RequirementDefinition,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    const passportDocs = documents.filter(d => {
      const type = (d.type || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return type.includes('passport') || name.includes('passport');
    });

    if (passportDocs.length === 0) {
      return {
        ...def,
        status: RequirementStatus.MISSING,
        reason: 'Valid passport identity document has not been uploaded',
      };
    }

    const processedDoc = passportDocs.find(d => d.status === 'processed' || d.status === 'verified');
    if (!processedDoc) {
      const activeDoc = passportDocs[0];
      return {
        ...def,
        status: RequirementStatus.INCOMPLETE,
        reason: `Passport document uploaded (${activeDoc.name}) but pending processing`,
        details: { documentId: activeDoc.id, status: activeDoc.status },
      };
    }

    const ext = this.parseJsonField<Record<string, any>>(processedDoc.extractedData, {});
    const confidence = ext.confidence;
    if (confidence !== undefined && confidence < 0.7) {
      return {
        ...def,
        status: RequirementStatus.PENDING_VERIFICATION,
        reason: `Passport extracted with low confidence (${confidence}), manual verification required`,
        details: { documentId: processedDoc.id, confidence },
        confidence,
      };
    }

    return {
      ...def,
      status: RequirementStatus.SATISFIED,
      reason: 'Passport document uploaded and verified',
      details: { documentId: processedDoc.id, extractedData: ext },
    };
  }

  private evalGermanLanguage(
    def: RequirementDefinition,
    profile?: ApplicantProfile | null,
    documents: Document[] = [],
  ): EvaluatedRequirement {
    let languages = this.parseJsonField<any[]>(profile?.languages, []);
    if (!Array.isArray(languages)) languages = [];

    const germanEntry = languages.find(l => {
      if (!l) return false;
      if (typeof l === 'string') return /german|deutsch/i.test(l);
      const langName = l.language || l.name || l.lang || '';
      return /german|deutsch/i.test(langName);
    });

    const langDoc = documents.find(d => {
      const type = (d.type || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return (
        type.includes('language') ||
        type.includes('german') ||
        type.includes('goethe') ||
        type.includes('testdaf') ||
        name.includes('german') ||
        name.includes('language')
      );
    });

    if (germanEntry) {
      const level = typeof germanEntry === 'object' ? germanEntry.level || 'Documented' : 'Documented';
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `German language proficiency recorded: ${level}`,
        details: { language: 'German', level },
      };
    }

    if (langDoc && (langDoc.status === 'processed' || langDoc.status === 'verified')) {
      return {
        ...def,
        status: RequirementStatus.SATISFIED,
        reason: `German language certificate document verified (${langDoc.name})`,
        details: { documentId: langDoc.id },
      };
    }

    if (langDoc) {
      return {
        ...def,
        status: RequirementStatus.INCOMPLETE,
        reason: `German language certificate uploaded (${langDoc.name}) but not yet processed`,
        details: { documentId: langDoc.id },
      };
    }

    return {
      ...def,
      status: RequirementStatus.MISSING,
      reason: 'German language proficiency certificate or level has not been provided',
    };
  }
}
