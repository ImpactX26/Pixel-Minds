import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NextAction } from './entities/next-action.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { QualificationService } from '../qualification/qualification.service';
import { NextActionEngine } from './next-action.engine';
import { NextActionResult } from './interfaces/next-action.interface';

@Injectable()
export class NextActionService {
  private readonly logger = new Logger(NextActionService.name);

  constructor(
    @InjectRepository(NextAction)
    private readonly nextActionRepository: Repository<NextAction>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly qualificationService: QualificationService,
    private readonly nextActionEngine: NextActionEngine,
  ) {}

  /**
   * Evaluates and returns the single highest-priority Next Best Action for an applicant.
   * Persists / updates the NextAction in PostgreSQL.
   */
  async getNextAction(applicantId: string): Promise<NextActionResult> {
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }

    const profile = await this.profileRepository.findOne({
      where: { applicantId },
    });

    const documents = await this.documentRepository.find({
      where: { applicantId },
    });

    // 1. Get/recalculate latest qualification evaluation from current state
    const qualification = await this.qualificationService.checkQualification(applicantId);

    // 2. Determine highest priority Next Best Action
    const nextActionData = this.nextActionEngine.determineNextAction(
      applicant,
      profile,
      documents,
      qualification,
    );

    // 3. Persist / update NextAction record in PostgreSQL
    let nextActionRecord = await this.nextActionRepository.findOne({
      where: { applicantId },
      order: { updatedAt: 'DESC' },
    });

    if (!nextActionRecord) {
      nextActionRecord = this.nextActionRepository.create({
        applicantId,
        action: nextActionData.action,
        title: nextActionData.title,
        reason: nextActionData.reason,
        priority: nextActionData.priority,
        status: nextActionData.status,
      });
    } else {
      nextActionRecord.action = nextActionData.action;
      nextActionRecord.title = nextActionData.title;
      nextActionRecord.reason = nextActionData.reason;
      nextActionRecord.priority = nextActionData.priority;
      nextActionRecord.status = nextActionData.status;
    }

    const saved = await this.nextActionRepository.save(nextActionRecord);

    this.logger.log(
      `Evaluated Next Best Action for applicant ${applicantId}: [${nextActionData.action}] ${nextActionData.title} (Priority: ${nextActionData.priority})`,
    );

    return {
      id: saved.id,
      applicantId: saved.applicantId,
      action: saved.action,
      title: saved.title,
      reason: saved.reason,
      priority: saved.priority,
      status: saved.status,
      requirementCode: nextActionData.requirementCode,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
