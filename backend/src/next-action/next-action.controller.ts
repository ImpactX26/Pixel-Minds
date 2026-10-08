import { Controller, Get, Param } from '@nestjs/common';
import { NextActionService } from './next-action.service';
import { NextActionResult } from './interfaces/next-action.interface';

@Controller()
export class NextActionController {
  constructor(private readonly nextActionService: NextActionService) {}

  @Get('applicants/:id/next-action')
  async getNextAction(
    @Param('id') id: string,
  ): Promise<NextActionResult> {
    return this.nextActionService.getNextAction(id || '123');
  }

  @Get('next-action')
  async getRootNextAction(): Promise<NextActionResult> {
    return this.nextActionService.getNextAction('123');
  }
}

