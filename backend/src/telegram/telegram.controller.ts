import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramClientService } from './services/telegram-client.service';
import { TelegramAccountMappingService } from './services/telegram-account-mapping.service';
import { TelegramWebhookDto, TestTelegramChatDto } from './dto/telegram-webhook.dto';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramClient: TelegramClientService,
    private readonly mappingService: TelegramAccountMappingService,
  ) {}

  /**
   * Telegram Webhook Endpoint
   * Telegram calls this endpoint when users send messages to the bot.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: TelegramWebhookDto) {
    if (body?.message?.chat?.id && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const result = await this.telegramService.handleIncomingMessage(chatId, text);
      return { ok: true, result };
    }

    return { ok: true, message: 'No actionable message payload' };
  }

  /**
   * Test/Simulation Endpoint
   * Simulates an incoming Telegram chat message for E2E testing and local debugging.
   */
  @Post('test-chat')
  @HttpCode(HttpStatus.OK)
  async handleTestChat(@Body() dto: TestTelegramChatDto) {
    const result = await this.telegramService.handleIncomingMessage(
      dto.chatId,
      dto.message,
    );
    return {
      success: true,
      chatId: dto.chatId,
      applicantId: result.applicantId || null,
      response: result.message,
      error: !!result.error,
    };
  }

  /**
   * Get Telegram Integration Status
   */
  @Get('status')
  async getStatus() {
    const config = this.mappingService.getMappingConfig();
    return {
      status: 'ok',
      botConfigured: this.telegramClient.isConfigured(),
      testChatIdConfigured: !!config.testChatId,
      testApplicantIdConfigured: !!config.testApplicantId,
      testChatId: config.testChatId,
      testApplicantId: config.testApplicantId,
    };
  }
}
