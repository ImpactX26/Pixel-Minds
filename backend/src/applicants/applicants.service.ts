import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Applicant } from './entities/applicant.entity';
import { Journey } from '../journey/entities/journey.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { JourneyStage } from '../common/enums';
import { resolveApplicantUuid } from '../common/utils/uuid.util';
import { DemoSeedService } from './demo-seed.service';

@Injectable()
export class ApplicantsService {
  private readonly logger = new Logger(ApplicantsService.name);

  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    private readonly dataSource: DataSource,
    private readonly demoSeedService: DemoSeedService,
  ) {}

  async findById(id: string): Promise<Applicant> {
    const rawId = (id || '').trim();
    if (rawId === 'abc' || rawId === 'demo-fully-populated-123' || rawId === 'abc@demo.pixelmind.ai') {
      return this.demoSeedService.seedFullyPopulatedDemo();
    }
    if (rawId === 'demo-fresh-1' || rawId === 'demo.fresh1@pixelmind.ai') {
      return this.demoSeedService.seedFreshDemo1();
    }
    if (rawId === 'demo-fresh-2' || rawId === 'demo.fresh2@pixelmind.ai') {
      return this.demoSeedService.seedFreshDemo2();
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
    const targetUuid = isUuid ? rawId : resolveApplicantUuid(rawId);

    const applicant = await this.applicantRepository.findOne({
      where: [{ id: targetUuid }, { email: rawId }],
      relations: ['journey', 'profile'],
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with ID or Email "${id}" not found`);
    }

    return applicant;
  }

  async findByEmail(email: string): Promise<Applicant> {
    const rawEmail = (email || '').trim().toLowerCase();
    if (rawEmail === 'abc' || rawEmail === 'abc@demo.pixelmind.ai') {
      return this.demoSeedService.seedFullyPopulatedDemo();
    }
    if (rawEmail === 'demo.fresh1@pixelmind.ai' || rawEmail === 'demo-fresh-1') {
      return this.demoSeedService.seedFreshDemo1();
    }
    if (rawEmail === 'demo.fresh2@pixelmind.ai' || rawEmail === 'demo-fresh-2') {
      return this.demoSeedService.seedFreshDemo2();
    }

    const applicant = await this.applicantRepository.findOne({
      where: { email: rawEmail },
      relations: ['journey', 'profile'],
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with email "${email}" not found`);
    }

    return applicant;
  }

  async create(createApplicantDto: CreateApplicantDto): Promise<Applicant> {
    const existing = await this.applicantRepository.findOne({
      where: { email: createApplicantDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `An applicant with email "${createApplicantDto.email}" already exists`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Applicant
      const applicant = queryRunner.manager.create(Applicant, {
        name: createApplicantDto.name,
        email: createApplicantDto.email,
        phone: createApplicantDto.phone,
        country: createApplicantDto.country,
        goal: createApplicantDto.goal,
      });
      const savedApplicant = await queryRunner.manager.save(applicant);

      // 2. Automatically create initial Journey state
      const initialJourney = queryRunner.manager.create(Journey, {
        applicantId: savedApplicant.id,
        currentStage: JourneyStage.STARTED,
        progress: 0,
        status: 'IN_PROGRESS',
      });
      await queryRunner.manager.save(initialJourney);

      // 3. Initialize default Applicant Profile
      const initialProfile = queryRunner.manager.create(ApplicantProfile, {
        applicantId: savedApplicant.id,
        education: {},
        experience: null,
        skills: [],
        languages: [],
        workExperience: [],
        additionalInfo: {},
      });
      await queryRunner.manager.save(initialProfile);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Created applicant ${savedApplicant.id} (${savedApplicant.email}) with initial journey and profile`,
      );

      // Return created applicant with initialized journey
      savedApplicant.journey = initialJourney;
      savedApplicant.profile = initialProfile;
      return savedApplicant;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create applicant: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Could not create applicant: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateApplicantDto: UpdateApplicantDto): Promise<Applicant> {
    const applicant = await this.findById(id);

    if (
      updateApplicantDto.email &&
      updateApplicantDto.email !== applicant.email
    ) {
      const emailInUse = await this.applicantRepository.findOne({
        where: { email: updateApplicantDto.email },
      });
      if (emailInUse && emailInUse.id !== id) {
        throw new ConflictException(
          `An applicant with email "${updateApplicantDto.email}" already exists`,
        );
      }
    }

    Object.assign(applicant, updateApplicantDto);
    const updated = await this.applicantRepository.save(applicant);

    this.logger.log(`Updated applicant ${id}`);
    return updated;
  }
}
