import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JourneyService } from './journey.service';
import { UpdateJourneyDto } from './dto/update-journey.dto';

@Controller('applicants/:id/journey')
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Get()
  async getJourney(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.journeyService.findByApplicantId(id);
  }

  @Patch()
  async updateJourney(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateJourneyDto: UpdateJourneyDto,
  ) {
    return this.journeyService.updateByApplicantId(id, updateJourneyDto);
  }
}
