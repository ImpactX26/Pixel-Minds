import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Qualification } from '../qualification/entities/qualification.entity';
import { AiModule } from '../ai/ai.module';
import { CvEngine } from './cv.engine';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Applicant,
      ApplicantProfile,
      Document,
      Qualification,
    ]),
    AiModule,
  ],
  controllers: [CvController],
  providers: [CvEngine, CvService],
  exports: [CvService, CvEngine],
})
export class CvModule {}
