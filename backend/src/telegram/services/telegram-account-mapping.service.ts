import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramAccountMappingService {
  private readonly logger = new Logger(TelegramAccountMappingService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves a Telegram chatId to an existing Educaro applicantId.
   * Isolated for hackathon environment mapping, easily replaceable with a DB lookup.
   */
  async resolveApplicantId(chatId: string | number): Promise<string | null> {
    if (!chatId) {
      return null;
    }

    const testChatId =
      this.configService.get<string>('TELEGRAM_TEST_CHAT_ID') ||
      process.env.TELEGRAM_TEST_CHAT_ID;
    const testApplicantId =
      this.configService.get<string>('TELEGRAM_TEST_APPLICANT_ID') ||
      process.env.TELEGRAM_TEST_APPLICANT_ID;

    const normalizedChatId = String(chatId).trim();
    const normalizedTestChatId = testChatId ? String(testChatId).trim() : null;

    if (normalizedTestChatId && normalizedChatId === normalizedTestChatId) {
      return testApplicantId || null;
    }

    this.logger.warn(`No applicant mapped for Telegram chat ID: ${normalizedChatId}`);
    return null;
  }

  getMappingConfig() {
    const testChatId =
      this.configService.get<string>('TELEGRAM_TEST_CHAT_ID') ||
      process.env.TELEGRAM_TEST_CHAT_ID ||
      null;
    const testApplicantId =
      this.configService.get<string>('TELEGRAM_TEST_APPLICANT_ID') ||
      process.env.TELEGRAM_TEST_APPLICANT_ID ||
      null;

    return {
      testChatId: testChatId ? testChatId.trim() : null,
      testApplicantId: testApplicantId ? testApplicantId.trim() : null,
    };
  }
}
