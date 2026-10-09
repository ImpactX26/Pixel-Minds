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

  @Post('demo-login')
  @HttpCode(HttpStatus.OK)
  async demoLogin(@Body() body: { username?: string; password?: string; applicantId?: string; preset?: string }) {
    const target = body.preset || body.applicantId || body.username || 'abc';
    const applicant = await this.applicantsService.findById(target);
    return {
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      country: applicant.country,
      goal: applicant.goal,
      journey: applicant.journey,
      profile: applicant.profile,
      applicant,
      message: 'Login successful',
    };
  }

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
