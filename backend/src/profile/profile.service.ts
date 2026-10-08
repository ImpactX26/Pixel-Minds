import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
  ) {}

  private async ensureApplicantExists(applicantId: string): Promise<void> {
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId },
    });
    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }
  }

  async findByApplicantId(applicantId: string): Promise<ApplicantProfile> {
    await this.ensureApplicantExists(applicantId);

    let profile = await this.profileRepository.findOne({
      where: { applicantId },
    });

    if (!profile) {
      // Lazy-initialize default profile if not yet present
      profile = this.profileRepository.create({
        applicantId,
        education: {},
        experience: null,
        skills: [],
        languages: [],
        workExperience: [],
        additionalInfo: {},
      });
      profile = await this.profileRepository.save(profile);
      this.logger.log(`Initialized default profile for applicant ${applicantId}`);
    }

    return profile;
  }

  async updateByApplicantId(
    applicantId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ApplicantProfile> {
    await this.ensureApplicantExists(applicantId);

    let profile = await this.profileRepository.findOne({
      where: { applicantId },
    });

    if (!profile) {
      profile = this.profileRepository.create({
        applicantId,
        ...updateProfileDto,
      });
    } else {
      Object.assign(profile, updateProfileDto);
    }

    const saved = await this.profileRepository.save(profile);
    this.logger.log(`Updated profile for applicant ${applicantId}`);
    return saved;
  }
}
