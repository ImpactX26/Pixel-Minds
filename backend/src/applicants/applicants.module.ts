import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Applicant } from './entities/applicant.entity';
import { Journey } from '../journey/entities/journey.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Qualification } from '../qualification/entities/qualification.entity';
import { NextAction } from '../next-action/entities/next-action.entity';
import { CvModule } from '../cv/cv.module';
import { ApplicantsService } from './applicants.service';
import { ApplicantsController } from './applicants.controller';
import { DemoSeedService } from './demo-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Applicant,
      Journey,
      ApplicantProfile,
      Document,
      Qualification,
      NextAction,
    ]),
    ConfigModule,
    CvModule,
  ],
  controllers: [ApplicantsController],
  providers: [ApplicantsService, DemoSeedService],
  exports: [ApplicantsService, DemoSeedService, TypeOrmModule],
})
export class ApplicantsModule {}
