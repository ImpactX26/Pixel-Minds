import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Qualification } from './entities/qualification.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Journey } from '../journey/entities/journey.entity';
import { QualificationEngine } from './qualification.engine';
import {
  QualificationEvaluationSummary,
  RequirementDefinition,
} from './interfaces/requirement.interface';
import { DEFAULT_REQUIREMENTS } from './rules/requirement-definitions';
import { JourneyStage, QualificationStatus } from '../common/enums';

import { resolveApplicantUuid } from '../common/utils/uuid.util';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    @InjectRepository(Qualification)
    private readonly qualificationRepository: Repository<Qualification>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Journey)
    private readonly journeyRepository: Repository<Journey>,
    private readonly qualificationEngine: QualificationEngine,
  ) {}

  private async ensureApplicantExists(applicantId: string): Promise<Applicant> {
    const uuid = resolveApplicantUuid(applicantId);
    let applicant = await this.applicantRepository.findOne({
      where: [{ id: uuid }, { id: applicantId }],
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }

    return applicant;
  }

  async getRequirementDefinitions(applicantId: string): Promise<any[]> {
    const applicant = await this.ensureApplicantExists(applicantId);
    const stored = await this.qualificationRepository.findOne({
      where: { applicantId: applicant.id },
    });

    if (stored && Array.isArray(stored.requirements) && stored.requirements.length > 0) {
      return stored.requirements;
    }

    return DEFAULT_REQUIREMENTS;
  }

  async saveCustomRequirements(
    applicantId: string,
    requirements: any[],
    meta?: { role?: string; country?: string; company?: string },
  ): Promise<any> {
    const applicant = await this.ensureApplicantExists(applicantId);
    const uuid = applicant.id;

    // 1. Update applicant goal and country if provided
    if (meta?.role || meta?.country) {
      if (meta.role) {
        applicant.goal = `${meta.role}${meta.country ? ` in ${meta.country}` : ' in Germany'}${meta.company ? ` at ${meta.company}` : ''}`;
      }
      if (meta.country) {
        applicant.country = meta.country;
      }
      await this.applicantRepository.save(applicant);
    }

    // 2. Persist custom requirements in Qualification entity
    let qual = await this.qualificationRepository.findOne({
      where: { applicantId: uuid },
    });

    const formattedRequirements = requirements.map((r, idx) => ({
      id: r.id || `req-custom-${idx + 1}`,
      code: r.code || r.id || `REQ_${idx + 1}`,
      title: r.title || 'Requirement',
      description: r.description || '',
      category: r.category || 'DOCUMENT',
      required: r.status === 'REQUIRED' || r.required !== false,
      status: r.status === 'SATISFIED' ? 'SATISFIED' : 'MISSING',
      stage: 'REQUIREMENTS',
    }));

    if (!qual) {
      qual = this.qualificationRepository.create({
        applicantId: uuid,
        requirements: formattedRequirements,
        completedRequirements: formattedRequirements.filter(r => r.status === 'SATISFIED'),
        missingRequirements: formattedRequirements.filter(r => r.status !== 'SATISFIED'),
        status: QualificationStatus.PENDING,
      });
    } else {
      qual.requirements = formattedRequirements;
      qual.completedRequirements = formattedRequirements.filter(r => r.status === 'SATISFIED');
      qual.missingRequirements = formattedRequirements.filter(r => r.status !== 'SATISFIED');
    }

    await this.qualificationRepository.save(qual);

    // 3. Update Journey stage
    const journey = await this.journeyRepository.findOne({ where: { applicantId: uuid } });
    if (journey) {
      journey.currentStage = JourneyStage.GOAL_IDENTIFIED;
      journey.progress = Math.max(journey.progress, 25);
      await this.journeyRepository.save(journey);
    }

    this.logger.log(`Persisted ${formattedRequirements.length} custom requirements for applicant ${uuid}`);
    return {
      applicantId: uuid,
      requirements: formattedRequirements,
      role: meta?.role || applicant.goal,
      country: meta?.country || applicant.country,
      company: meta?.company || null,
    };
  }

  async getLatestQualification(applicantId: string): Promise<QualificationEvaluationSummary> {
    const applicant = await this.ensureApplicantExists(applicantId);
    const uuid = applicant.id;

    const stored = await this.qualificationRepository.findOne({
      where: { applicantId: uuid },
    });

    if (stored && stored.requirements && stored.requirements.length > 0) {
      // Return formatted summary from stored record
      const reqs = stored.requirements as any[];
      const completed = (stored.completedRequirements as any[]) || [];
      const missing = (stored.missingRequirements as any[]) || [];

      let satisfiedCount = 0;
      let missingCount = 0;
      let incompleteCount = 0;
      let conflictCount = 0;
      let pendingVerificationCount = 0;

      for (const r of reqs) {
        if (r.status === 'SATISFIED') satisfiedCount++;
        else if (r.status === 'MISSING') missingCount++;
        else if (r.status === 'INCOMPLETE') incompleteCount++;
        else if (r.status === 'CONFLICT') conflictCount++;
        else if (r.status === 'PENDING_VERIFICATION') pendingVerificationCount++;
      }

      let overallStatus = 'QUALIFIED';
      if (conflictCount > 0) overallStatus = 'CONFLICT';
      else if (missingCount > 0 || incompleteCount > 0) overallStatus = 'INCOMPLETE';
      else if (pendingVerificationCount > 0) overallStatus = 'PENDING';

      return {
        applicantId,
        status: overallStatus,
        qualificationStatus: stored.status,
        totalRequirements: reqs.length,
        satisfied: satisfiedCount,
        missing: missingCount,
        incomplete: incompleteCount,
        conflicts: conflictCount,
        pendingVerification: pendingVerificationCount,
        completedRequirements: completed,
        missingRequirements: missing,
        requirements: reqs,
        updatedAt: stored.updatedAt,
      };
    }

    // If not yet calculated, calculate and persist
    return this.checkQualification(applicantId);
  }

  async checkQualification(applicantId: string): Promise<QualificationEvaluationSummary> {
    const applicant = await this.ensureApplicantExists(applicantId);
    const profile = await this.profileRepository.findOne({ where: { applicantId } });
    const documents = await this.documentRepository.find({ where: { applicantId } });

    // 1. Evaluate requirements deterministically
    const evaluation = this.qualificationEngine.evaluate(applicant, profile, documents);

    // 2. Persist in PostgreSQL
    let qualification = await this.qualificationRepository.findOne({
      where: { applicantId },
    });

    if (!qualification) {
      qualification = this.qualificationRepository.create({
        applicantId,
        requirements: evaluation.requirements,
        completedRequirements: evaluation.completedRequirements,
        missingRequirements: evaluation.missingRequirements,
        status: evaluation.qualificationStatus,
      });
    } else {
      qualification.requirements = evaluation.requirements;
      qualification.completedRequirements = evaluation.completedRequirements;
      qualification.missingRequirements = evaluation.missingRequirements;
      qualification.status = evaluation.qualificationStatus;
    }

    const saved = await this.qualificationRepository.save(qualification);
    evaluation.updatedAt = saved.updatedAt;

    // 3. Update Journey state appropriately
    const journey = await this.journeyRepository.findOne({ where: { applicantId } });
    if (journey) {
      if (evaluation.status === 'QUALIFIED') {
        journey.currentStage = JourneyStage.QUALIFICATION_COMPLETE;
        journey.progress = Math.max(journey.progress, 75);
      } else {
        journey.currentStage = JourneyStage.QUALIFICATION_PENDING;
        journey.progress = Math.max(journey.progress, 60);
      }
      await this.journeyRepository.save(journey);
    }

    this.logger.log(
      `Saved qualification result for applicant ${applicantId} with status: ${evaluation.status}`,
    );

    return evaluation;
  }
}
