import {
  Controller,
  Get,
  Post,
  Param,
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
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.qualificationService.getRequirementDefinitions(id);
  }

  @Get('qualification')
  async getQualification(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.qualificationService.getLatestQualification(id);
  }

  @Post('qualification/check')
  @HttpCode(HttpStatus.OK)
  async checkQualification(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.qualificationService.checkQualification(id);
  }
}
