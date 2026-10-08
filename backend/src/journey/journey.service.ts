import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journey } from './entities/journey.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { JourneyStage } from '../common/enums';

@Injectable()
export class JourneyService {
  private readonly logger = new Logger(JourneyService.name);

  constructor(
    @InjectRepository(Journey)
    private readonly journeyRepository: Repository<Journey>,
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

  async findByApplicantId(applicantId: string): Promise<Journey> {
    await this.ensureApplicantExists(applicantId);

    let journey = await this.journeyRepository.findOne({
      where: { applicantId },
    });

    if (!journey) {
      journey = this.journeyRepository.create({
        applicantId,
        currentStage: JourneyStage.STARTED,
        progress: 0,
        status: 'IN_PROGRESS',
      });
      journey = await this.journeyRepository.save(journey);
      this.logger.log(`Initialized default journey for applicant ${applicantId}`);
    }

    return journey;
  }

  async updateByApplicantId(
    applicantId: string,
    updateJourneyDto: UpdateJourneyDto,
  ): Promise<Journey> {
    await this.ensureApplicantExists(applicantId);

    let journey = await this.journeyRepository.findOne({
      where: { applicantId },
    });

    if (!journey) {
      journey = this.journeyRepository.create({
        applicantId,
        currentStage: updateJourneyDto.currentStage || JourneyStage.STARTED,
        progress: updateJourneyDto.progress !== undefined ? updateJourneyDto.progress : 0,
        status: updateJourneyDto.status || 'IN_PROGRESS',
      });
    } else {
      Object.assign(journey, updateJourneyDto);
    }

    const saved = await this.journeyRepository.save(journey);
    this.logger.log(
      `Updated journey for applicant ${applicantId} to stage ${saved.currentStage} (${saved.progress}%)`,
    );
    return saved;
  }
}
