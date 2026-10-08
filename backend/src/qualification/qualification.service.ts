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
import { JourneyStage } from '../common/enums';

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
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }

    return applicant;
  }

  async getRequirementDefinitions(applicantId: string): Promise<RequirementDefinition[]> {
    await this.ensureApplicantExists(applicantId);
    return DEFAULT_REQUIREMENTS;
  }

  async getLatestQualification(applicantId: string): Promise<QualificationEvaluationSummary> {
    await this.ensureApplicantExists(applicantId);

    const stored = await this.qualificationRepository.findOne({
      where: { applicantId },
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
