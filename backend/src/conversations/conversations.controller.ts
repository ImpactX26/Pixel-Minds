import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ConversationsService, FormattedChatMessage } from './conversations.service';

@Controller('applicants')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get(':applicantId/chat/history')
  @HttpCode(HttpStatus.OK)
  async getChatHistory(
    @Param('applicantId') applicantId: string,
  ): Promise<FormattedChatMessage[]> {
    return this.conversationsService.getHistory(applicantId);
  }
}

@Controller('chat')
export class DirectChatController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getDefaultChatHistory(): Promise<FormattedChatMessage[]> {
    return this.conversationsService.getHistory('default');
  }
}
