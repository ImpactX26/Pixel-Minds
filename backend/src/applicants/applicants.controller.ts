import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';

@Controller('applicants')
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createApplicantDto: CreateApplicantDto) {
    return this.applicantsService.create(createApplicantDto);
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.applicantsService.findByEmail(email);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.applicantsService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateApplicantDto: UpdateApplicantDto,
  ) {
    return this.applicantsService.update(id, updateApplicantDto);
  }
}
