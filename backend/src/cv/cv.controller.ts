import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CvService } from './cv.service';
import {
  GenerateCvRequestDto,
  GeneratedCvResult,
  SaveCvDto,
} from './interfaces/cv.interface';

@Controller()
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('applicants/:id/cv/generate')
  async generateCv(
    @Param('id') id: string,
    @Body() body: Partial<GenerateCvRequestDto>,
  ): Promise<GeneratedCvResult> {
    return this.cvService.generateCv({
      ...body,
      applicantId: id || '123',
    });
  }

  @Post('applicants/:id/cv/save')
  async saveCv(
    @Param('id') id: string,
    @Body() body: Partial<SaveCvDto>,
  ): Promise<GeneratedCvResult> {
    return this.cvService.saveCv({
      applicantId: id || '123',
      cvData: body.cvData || (body as any),
    });
  }

  @Get('applicants/:id/cv')
  async getCv(@Param('id') id: string): Promise<GeneratedCvResult | null> {
    return this.cvService.getCv(id || '123');
  }

  // Root Aliases for development and general API access
  @Post('cv/generate')
  async generateRootCv(
    @Body() body: Partial<GenerateCvRequestDto>,
  ): Promise<GeneratedCvResult> {
    return this.cvService.generateCv({
      ...body,
      applicantId: body.applicantId || '123',
    });
  }

  @Post('cv/save')
  async saveRootCv(@Body() body: any): Promise<GeneratedCvResult> {
    const applicantId = body.applicantId || '123';
    return this.cvService.saveCv({
      applicantId,
      cvData: body.cvData || body,
    });
  }

  @Get('cv')
  async getRootCv(): Promise<GeneratedCvResult | null> {
    return this.cvService.getCv('123');
  }
}
