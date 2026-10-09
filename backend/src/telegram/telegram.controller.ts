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
import { TelegramUpdate } from './telegram.types';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * POST /api/v1/telegram/webhook
   * Endpoint registered with Telegram Bot API when running in webhook mode.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() update: TelegramUpdate) {
    if (!update || typeof update.update_id !== 'number') {
      this.logger.warn('⚠️ Received invalid webhook payload (missing update_id)');
      return { ok: true, status: 'ignored_invalid_payload' };
    }

    try {
      const result = await this.telegramService.processUpdate(update);
      return { ok: true, ...result };
    } catch (err: any) {
      this.logger.error(`💥 Webhook handler error: ${err.message}`, err.stack);
      // Return 200 OK so Telegram doesn't endlessly retry bad updates
      return { ok: true, status: 'error_handled', error: err.message };
    }
  }

  /**
   * GET /api/v1/telegram/status
   * Health and diagnostic inspection endpoint.
   */
  @Get('status')
  async getStatus() {
    const info = this.telegramService.getBotInfo();
    let webhookInfo = null;

    if (info.configured) {
      try {
        const whRes = await this.telegramService.getWebhookInfo();
        webhookInfo = whRes.result || null;
      } catch {}
    }

    return {
      status: 'success',
      data: {
        ...info,
        webhook: webhookInfo,
      },
    };
  }

  /**
   * POST /api/v1/telegram/simulate
   * Simulates an incoming Telegram update for testing and validation.
   */
  @Post('simulate')
  async simulateUpdate(@Body() body: { text: string; userId?: number; chatId?: number; username?: string }) {
    const update: TelegramUpdate = {
      update_id: Date.now(),
      message: {
        message_id: Math.floor(Math.random() * 10000),
        from: {
          id: body.userId || 99999999,
          is_bot: false,
          first_name: body.username || 'TestUser',
          username: body.username || 'testuser',
        },
        chat: {
          id: body.chatId || 99999999,
          type: 'private',
          first_name: body.username || 'TestUser',
        },
        date: Math.floor(Date.now() / 1000),
        text: body.text,
      },
    };

    return await this.telegramService.processUpdate(update);
  }
}
