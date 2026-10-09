import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { resolveApplicantUuid } from '../common/utils/uuid.util';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
  ) {}

  private async ensureApplicantExists(applicantId: string): Promise<string> {
    const uuid = resolveApplicantUuid(applicantId);
    let applicant = await this.applicantRepository.findOne({
      where: { id: uuid },
    });
    if (!applicant) {
      applicant = await this.applicantRepository.findOne({
        where: { email: 'rahul.sharma@demo.pixelmind.ai' },
      });
    }
    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }
    return applicant.id;
  }

  async findByApplicantId(applicantId: string): Promise<ApplicantProfile> {
    const uuid = await this.ensureApplicantExists(applicantId);

    let profile = await this.profileRepository.findOne({
      where: { applicantId: uuid },
    });

    if (!profile) {
      // Lazy-initialize default profile if not yet present
      profile = this.profileRepository.create({
        applicantId: uuid,
        education: {},
        experience: null,
        skills: [],
        languages: [],
        workExperience: [],
        additionalInfo: {},
      });
      profile = await this.profileRepository.save(profile);
      this.logger.log(`Initialized default profile for applicant ${uuid}`);
    }

    return profile;
  }

  async updateByApplicantId(
    applicantId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ApplicantProfile> {
    const uuid = await this.ensureApplicantExists(applicantId);

    let profile = await this.profileRepository.findOne({
      where: { applicantId: uuid },
    });

    if (!profile) {
      profile = this.profileRepository.create({
        applicantId: uuid,
        ...updateProfileDto,
      });
    } else {
      Object.assign(profile, updateProfileDto);
    }

    const saved = await this.profileRepository.save(profile);
    this.logger.log(`Updated profile for applicant ${uuid}`);
    return saved;
  }
}
