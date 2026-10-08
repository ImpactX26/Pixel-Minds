import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { NextActionService } from './next-action.service';
import { NextActionResult } from './interfaces/next-action.interface';

@Controller('applicants/:id/next-action')
export class NextActionController {
  constructor(private readonly nextActionService: NextActionService) {}

  @Get()
  async getNextAction(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<NextActionResult> {
    return this.nextActionService.getNextAction(id);
  }
}
