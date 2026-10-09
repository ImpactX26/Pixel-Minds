import { Controller, Get, Delete, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Delete(':applicantId/chat/history')
  @HttpCode(HttpStatus.OK)
  async clearChatHistory(
    @Param('applicantId') applicantId: string,
  ): Promise<{ message: string; success: boolean }> {
    await this.conversationsService.clearHistory(applicantId);
    return { message: 'Chat history cleared successfully', success: true };
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

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  async clearDefaultChatHistory(): Promise<{ message: string; success: boolean }> {
    await this.conversationsService.clearHistory('default');
    return { message: 'Chat history cleared successfully', success: true };
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  async clearChat(
    @Body() body: { applicantId?: string },
  ): Promise<{ message: string; success: boolean }> {
    await this.conversationsService.clearHistory(body?.applicantId || 'default');
    return { message: 'Chat history cleared successfully', success: true };
  }
}
