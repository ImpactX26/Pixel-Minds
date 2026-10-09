import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QualificationService } from './qualification.service';

@Controller('applicants/:id')
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Get('requirements')
  async getRequirements(
    @Param('id') id: string,
  ) {
    return this.qualificationService.getRequirementDefinitions(id);
  }

  @Get('qualification')
  async getQualification(
    @Param('id') id: string,
  ) {
    return this.qualificationService.getLatestQualification(id);
  }

  @Post('requirements/save')
  @HttpCode(HttpStatus.OK)
  async saveRequirements(
    @Param('id') id: string,
    @Body() body: { requirements: any[]; role?: string; country?: string; company?: string },
  ) {
    return this.qualificationService.saveCustomRequirements(id, body.requirements || [], body);
  }

  @Post('qualification/check')
  @HttpCode(HttpStatus.OK)
  async checkQualification(
    @Param('id') id: string,
  ) {
    return this.qualificationService.checkQualification(id);
  }
}
