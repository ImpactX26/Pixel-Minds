import { Controller, Get, Param } from '@nestjs/common';
import { ConclusionService, ConclusionReport } from './conclusion.service';

@Controller()
export class ConclusionController {
  constructor(private readonly conclusionService: ConclusionService) {}

  @Get('applicants/:id/conclusion')
  async getConclusion(@Param('id') id: string): Promise<ConclusionReport> {
    return this.conclusionService.getConclusionReport(id || '123');
  }

  @Get('conclusion')
  async getRootConclusion(): Promise<ConclusionReport> {
    return this.conclusionService.getConclusionReport('123');
  }
}
