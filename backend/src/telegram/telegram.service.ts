import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiOrchestrator } from '../ai/ai.orchestrator';
import { ConversationChannel } from '../common/enums';
import { TelegramAccountMappingService } from './services/telegram-account-mapping.service';
import { TelegramClientService } from './services/telegram-client.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private pollingActive = false;
  private pollingOffset = 0;
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountMappingService: TelegramAccountMappingService,
    private readonly telegramClient: TelegramClientService,
    private readonly aiOrchestrator: AiOrchestrator,
  ) {}

  async onModuleInit() {
    const enablePolling =
      this.configService.get<string>('TELEGRAM_ENABLE_POLLING') === 'true' ||
      process.env.TELEGRAM_ENABLE_POLLING === 'true';

    if (enablePolling) {
      this.logger.log('Telegram long-polling enabled');

      if (!this.telegramClient.isConfigured()) {
        this.logger.warn(
          'Telegram polling cannot start: TELEGRAM_BOT_TOKEN is missing or empty in backend/.env',
        );
        return;
      }

      // Verify connection and obtain bot username
      const botInfo = await this.telegramClient.getMe();
      if (!botInfo) {
        this.logger.error(
          'Telegram polling cannot start: Failed to authenticate with Telegram Bot API. Please check your TELEGRAM_BOT_TOKEN.',
        );
        return;
      }

      const botHandle = botInfo.username ? `@${botInfo.username}` : botInfo.first_name;
      this.logger.log(`Telegram bot connected successfully: ${botHandle}`);

      // Clear any prior active webhooks so Telegram permits long-polling getUpdates
      await this.telegramClient.deleteWebhook();

      // Start the single long-polling loop
      this.startPolling();
    }
  }

  onModuleDestroy() {
    this.pollingActive = false;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Main entry point to handle incoming message from a Telegram chat.
   */
  async handleIncomingMessage(
    chatId: string | number,
    rawText?: string,
  ): Promise<{ message: string; applicantId?: string; error?: boolean }> {
    if (!rawText || !rawText.trim()) {
      const reply = 'Please send a valid message or command.';
      await this.telegramClient.sendMessage(chatId, reply);
      return { message: reply };
    }

    const text = rawText.trim();
    const normalizedChatId = String(chatId).trim();

    // 1. Resolve Telegram chat ID to Applicant ID
    const applicantId = await this.accountMappingService.resolveApplicantId(normalizedChatId);

    if (!applicantId) {
      const unlinkedReply =
        `👋 Your Telegram account is not linked to an Educaro applicant profile yet.\n\n` +
        `📱 Your Telegram Chat ID is: ${normalizedChatId}\n\n` +
        `To link your account, add this to your backend/.env:\n` +
        `TELEGRAM_TEST_CHAT_ID=${normalizedChatId}`;

      await this.telegramClient.sendMessage(chatId, unlinkedReply);
      return { message: unlinkedReply };
    }

    // 2. Handle /start and /help command special presentations
    if (text === '/start') {
      const welcomeReply =
        '👋 Welcome to Educaro AI Companion!\n\n' +
        'I am your AI assistant guiding your journey to study or work in Germany.\n\n' +
        'Available commands:\n' +
        '• /status - Check your current application progress\n' +
        '• /documents - View missing or required documents\n' +
        '• /qualification - Check your qualification status\n' +
        '• /next - Get your next recommended action\n' +
        '• /help - Show available commands\n\n' +
        'You can also send any question in plain text!';

      await this.telegramClient.sendMessage(chatId, welcomeReply);
      return { message: welcomeReply, applicantId };
    }

    if (text === '/help') {
      const helpReply =
        'ℹ️ *Educaro AI Assistant Help*\n\n' +
        'Commands:\n' +
        '• /status - Check application status\n' +
        '• /documents - View missing documents\n' +
        '• /qualification - Check qualification evaluation\n' +
        '• /next - Get your highest priority next step\n' +
        '• /help - Display this menu\n\n' +
        'Example questions you can type directly:\n' +
        '- "What documents am I missing?"\n' +
        '- "Am I qualified?"\n' +
        '- "What should I do next?"\n' +
        '- "What is my profile summary?"';

      await this.telegramClient.sendMessage(chatId, helpReply);
      return { message: helpReply, applicantId };
    }

    // 3. Map commands to natural language prompts for AI Orchestrator
    let prompt = text;
    if (text === '/documents') {
      prompt = 'What documents am I missing?';
    } else if (text === '/qualification') {
      prompt = 'What is my qualification status?';
    } else if (text === '/next') {
      prompt = 'What should I do next?';
    } else if (text === '/status') {
      prompt = 'What is my application status?';
    }

    // 4. Delegate to existing AI Orchestrator with TELEGRAM channel
    try {
      const response = await this.aiOrchestrator.processChat({
        applicantId,
        message: prompt,
        channel: ConversationChannel.TELEGRAM,
      });

      const reply = response.message;
      await this.telegramClient.sendMessage(chatId, reply);
      return { message: reply, applicantId };
    } catch (err: any) {
      this.logger.error(`Error processing Telegram message for applicant ${applicantId}:`, err);
      const errorReply =
        'An error occurred while processing your request. Please try again later.';
      await this.telegramClient.sendMessage(chatId, errorReply);
      return { message: errorReply, applicantId, error: true };
    }
  }

  /**
   * Background long-polling loop. Guarantees a single polling loop.
   */
  private async startPolling() {
    if (this.pollingActive) {
      return;
    }

    this.pollingActive = true;

    const poll = async () => {
      if (!this.pollingActive) return;

      try {
        const updates = await this.telegramClient.getUpdates(this.pollingOffset, 15);
        for (const update of updates) {
          this.pollingOffset = update.update_id + 1;
          if (update.message && update.message.chat && update.message.text) {
            await this.handleIncomingMessage(
              update.message.chat.id,
              update.message.text,
            );
          }
        }
      } catch (e: any) {
        this.logger.error(`Telegram polling loop error: ${e.message || e}`);
      }

      if (this.pollingActive) {
        this.pollingTimer = setTimeout(poll, 1000);
      }
    };

    poll();
  }
}
