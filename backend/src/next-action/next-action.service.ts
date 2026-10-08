import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NextAction } from './entities/next-action.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { NextActionEngine } from './next-action.engine';
import { NextActionResult } from './interfaces/next-action.interface';
import { resolveApplicantUuid } from '../common/utils/uuid.util';

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
    private readonly nextActionEngine: NextActionEngine,
  ) {}

  /**
   * Evaluates and returns the single highest-priority Recommended Next Step for an applicant.
   * Persists / updates the NextAction in PostgreSQL/Supabase.
   */
  async getNextAction(applicantId: string): Promise<NextActionResult> {
    const canonicalId = resolveApplicantUuid(applicantId);

    let applicant = await this.applicantRepository.findOne({
      where: { id: canonicalId },
    });

    if (!applicant) {
      applicant = this.applicantRepository.create({
        id: canonicalId,
        name: 'Applicant',
        email: `applicant-${applicantId || '123'}@educaro.io`,
      });
      try {
        applicant = await this.applicantRepository.save(applicant);
      } catch (err) {
        this.logger.debug(`Could not create applicant: ${err.message}`);
      }
    }

    const profile = await this.profileRepository.findOne({
      where: { applicantId: canonicalId },
    });

    const documents = await this.documentRepository.find({
      where: { applicantId: canonicalId },
      order: { uploadedAt: 'DESC' },
    });

    // Determine highest priority Next Action deterministically
    const nextActionData = this.nextActionEngine.determineNextAction(
      applicant || ({ id: canonicalId, name: 'Applicant' } as Applicant),
      profile,
      documents,
    );

    // Persist / update NextAction record in PostgreSQL
    let nextActionRecord = await this.nextActionRepository.findOne({
      where: { applicantId: canonicalId },
      order: { updatedAt: 'DESC' },
    });

    if (!nextActionRecord) {
      nextActionRecord = this.nextActionRepository.create({
        applicantId: canonicalId,
        action: nextActionData.action as any,
        title: nextActionData.title,
        reason: nextActionData.reason,
        priority: nextActionData.priority,
        status: nextActionData.status,
      });
    } else {
      nextActionRecord.action = nextActionData.action as any;
      nextActionRecord.title = nextActionData.title;
      nextActionRecord.reason = nextActionData.reason;
      nextActionRecord.priority = nextActionData.priority;
      nextActionRecord.status = nextActionData.status;
    }

    try {
      const saved = await this.nextActionRepository.save(nextActionRecord);
      this.logger.log(
        `Evaluated Recommended Next Step for applicant ${applicantId} [${canonicalId}]: [${nextActionData.action}] ${nextActionData.title}`,
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
    } catch {
      return {
        applicantId: canonicalId,
        action: nextActionData.action,
        title: nextActionData.title,
        reason: nextActionData.reason,
        priority: nextActionData.priority,
        status: nextActionData.status,
        requirementCode: nextActionData.requirementCode,
      };
    }
  }
}
