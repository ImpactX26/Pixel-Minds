import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

@Injectable()
export class TelegramClientService {
  private readonly logger = new Logger(TelegramClientService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dynamically retrieves the bot token from ConfigService or process.env.
   */
  getBotToken(): string | null {
    const raw =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '';
    const token = typeof raw === 'string' ? raw.trim() : '';
    return token.length > 0 ? token : null;
  }

  private getApiBase(): string {
    const token = this.getBotToken();
    return token ? `https://api.telegram.org/bot${token}` : '';
  }

  isConfigured(): boolean {
    return !!this.getBotToken();
  }

  /**
   * Get authenticated Bot profile details from Telegram.
   */
  async getMe(): Promise<TelegramBotInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.getApiBase()}/getMe`, {
        method: 'GET',
      });

      const data = (await response.json()) as any;
      if (data.ok && data.result) {
        return data.result as TelegramBotInfo;
      }

      this.logger.warn(`Telegram getMe check failed: ${data.description || 'Unknown error'}`);
      return null;
    } catch (err: any) {
      this.logger.error(`Network error connecting to Telegram Bot API: ${err.message || err}`);
      return null;
    }
  }

  /**
   * Deletes active webhook so that long polling (getUpdates) is permitted by Telegram.
   */
  async deleteWebhook(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.getApiBase()}/deleteWebhook`, {
        method: 'POST',
      });

      const data = (await response.json()) as any;
      return !!data.ok;
    } catch (err: any) {
      this.logger.warn(`Failed to delete existing Telegram webhook: ${err.message || err}`);
      return false;
    }
  }

  /**
   * Send a text message to a Telegram chat.
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    parseMode: 'Markdown' | 'HTML' | undefined = undefined,
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.debug(
        `TELEGRAM_BOT_TOKEN not configured. Skipping outbound Telegram message to chat ${chatId}.`,
      );
      return false;
    }

    try {
      const payload: any = {
        chat_id: chatId,
        text,
      };

      if (parseMode) {
        payload.parse_mode = parseMode;
      }

      const response = await fetch(`${this.getApiBase()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as any;

      if (!data.ok) {
        this.logger.error(
          `Telegram API error sending message to ${chatId}: ${data.description || 'Unknown error'}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send Telegram message to chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Fetch updates via long polling.
   */
  async getUpdates(offset?: number, timeout: number = 20): Promise<any[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const url = new URL(`${this.getApiBase()}/getUpdates`);
      if (offset) url.searchParams.append('offset', String(offset));
      url.searchParams.append('timeout', String(timeout));

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      const data = (await response.json()) as any;
      if (data.ok && Array.isArray(data.result)) {
        return data.result;
      }

      if (data.error_code === 409) {
        // Webhook was active or duplicate polling instance
        this.logger.warn('Telegram getUpdates conflict (409). Clearing webhook and retrying...');
        await this.deleteWebhook();
      }

      return [];
    } catch (error: any) {
      this.logger.error(`Failed to get updates from Telegram: ${error.message || error}`);
      return [];
    }
  }
}
