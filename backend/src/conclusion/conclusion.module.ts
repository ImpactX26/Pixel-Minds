import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConclusionController } from './conclusion.controller';
import { ConclusionService } from './conclusion.service';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { NextActionModule } from '../next-action/next-action.module';
import { QualificationModule } from '../qualification/qualification.module';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Applicant, ApplicantProfile, Document]),
    NextActionModule,
    QualificationModule,
    CvModule,
  ],
  controllers: [ConclusionController],
  providers: [ConclusionService],
  exports: [ConclusionService],
})
export class ConclusionModule {}
