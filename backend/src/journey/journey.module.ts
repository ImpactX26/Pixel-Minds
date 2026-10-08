import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from './entities/journey.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { JourneyService } from './journey.service';
import { JourneyController } from './journey.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Journey, Applicant])],
  controllers: [JourneyController],
  providers: [JourneyService],
  exports: [JourneyService, TypeOrmModule],
})
export class JourneyModule {}
