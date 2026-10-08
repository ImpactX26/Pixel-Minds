import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NextAction } from './entities/next-action.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { QualificationModule } from '../qualification/qualification.module';
import { NextActionEngine } from './next-action.engine';
import { NextActionService } from './next-action.service';
import { NextActionController } from './next-action.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NextAction,
      Applicant,
      ApplicantProfile,
      Document,
    ]),
    QualificationModule,
  ],
  controllers: [NextActionController],
  providers: [NextActionEngine, NextActionService],
  exports: [NextActionEngine, NextActionService, TypeOrmModule],
})
export class NextActionModule {}
