import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qualification } from './entities/qualification.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Journey } from '../journey/entities/journey.entity';
import { QualificationEngine } from './qualification.engine';
import { QualificationService } from './qualification.service';
import { QualificationController } from './qualification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Qualification,
      Applicant,
      ApplicantProfile,
      Document,
      Journey,
    ]),
  ],
  controllers: [QualificationController],
  providers: [QualificationEngine, QualificationService],
  exports: [QualificationEngine, QualificationService, TypeOrmModule],
})
export class QualificationModule {}
