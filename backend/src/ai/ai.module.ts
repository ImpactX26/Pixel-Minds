import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Journey } from '../journey/entities/journey.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { QualificationModule } from '../qualification/qualification.module';
import { NextActionModule } from '../next-action/next-action.module';
import { IntentDetectorService } from './services/intent-detector.service';
import { AiOrchestrator } from './ai.orchestrator';
import { AiController } from './ai.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Applicant,
      ApplicantProfile,
      Document,
      Journey,
      Conversation,
    ]),
    QualificationModule,
    NextActionModule,
  ],
  controllers: [AiController],
  providers: [IntentDetectorService, AiOrchestrator],
  exports: [AiOrchestrator, IntentDetectorService],
})
export class AiModule {}
