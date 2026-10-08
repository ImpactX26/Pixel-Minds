import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Applicant } from './entities/applicant.entity';
import { Journey } from '../journey/entities/journey.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { ApplicantsService } from './applicants.service';
import { ApplicantsController } from './applicants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Applicant, Journey, ApplicantProfile])],
  controllers: [ApplicantsController],
  providers: [ApplicantsService],
  exports: [ApplicantsService, TypeOrmModule],
})
export class ApplicantsModule {}
