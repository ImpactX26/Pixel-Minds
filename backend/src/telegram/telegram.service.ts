import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiOrchestrator } from '../ai/ai.orchestrator';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationChannel } from '../common/enums';
import { resolveApplicantUuid } from '../common/utils/uuid.util';
import {
  TelegramUpdate,
  TelegramMessage,
  ExtractedTelegramMessage,
  SendMessagePayload,
  TelegramApiResponse,
  TelegramBotInfo,
  WebhookInfo,
} from './telegram.types';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly baseUrl = 'https://api.telegram.org';
  private readonly botToken: string;
  private readonly authorizedUserIds: Set<number> = new Set();
  private readonly defaultApplicantId: string;
  private readonly pollingEnabled: boolean;

  private isPolling = false;
  private pollingAbortController: AbortController | null = null;
  private lastUpdateId = 0;
  private processedUpdateIds = new Set<number>();
  private botInfo: TelegramBotInfo | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiOrchestrator: AiOrchestrator,
    private readonly conversationsService: ConversationsService,
  ) {
    this.botToken =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '';

    this.defaultApplicantId =
      this.configService.get<string>('TELEGRAM_DEFAULT_APPLICANT_ID') ||
      process.env.TELEGRAM_DEFAULT_APPLICANT_ID ||
      'demo-applicant-123';

    // Parse authorized Telegram user IDs
    const rawAuthorized =
      this.configService.get<string>('TELEGRAM_AUTHORIZED_USER_IDS') ||
      process.env.TELEGRAM_AUTHORIZED_USER_IDS ||
      '';

    if (rawAuthorized.trim() && rawAuthorized.trim() !== '*') {
      rawAuthorized
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((idStr) => {
          const idNum = parseInt(idStr, 10);
          if (!isNaN(idNum)) {
            this.authorizedUserIds.add(idNum);
          }
        });
    }

    const pollingConfig =
      this.configService.get<string>('TELEGRAM_POLLING_ENABLED') ||
      process.env.TELEGRAM_POLLING_ENABLED;

    this.pollingEnabled = pollingConfig ? pollingConfig === 'true' : true;
  }

  async onModuleInit() {
    // Re-evaluate config in onModuleInit to guarantee ConfigModule has fully populated
    const token = (
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      this.botToken ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    (this as any).botToken = token;

    const rawAuthorized = (
      this.configService.get<string>('TELEGRAM_AUTHORIZED_USER_IDS') ||
      process.env.TELEGRAM_AUTHORIZED_USER_IDS ||
      ''
    ).trim();

    this.authorizedUserIds.clear();
    if (rawAuthorized && rawAuthorized !== '*') {
      rawAuthorized
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((idStr) => {
          const idNum = parseInt(idStr, 10);
          if (!isNaN(idNum)) {
            this.authorizedUserIds.add(idNum);
          }
        });
    }

    if (!this.botToken) {
      this.logger.warn(
        'ℹ️ TELEGRAM_BOT_TOKEN is not configured in backend/.env. Telegram integration is inactive. (To enable, add your BotFather token to backend/.env)',
      );
      return;
    }

    this.logger.log(`🤖 Initializing Telegram Bot Service... (Token: ${this.maskToken(this.botToken)})`);
    if (this.authorizedUserIds.size > 0) {
      this.logger.log(`🔒 Authorized Telegram User IDs: ${Array.from(this.authorizedUserIds).join(', ')}`);
    } else {
      this.logger.log('🔓 Authorized User IDs: Open (all users permitted, or configure TELEGRAM_AUTHORIZED_USER_IDS)');
    }

    // Verify token with Telegram
    try {
      const meRes = await this.getMe();
      if (meRes.ok && meRes.result) {
        this.botInfo = meRes.result;
        this.logger.log(`✅ Connected to Telegram Bot: @${this.botInfo.username} (${this.botInfo.first_name})`);

        if (this.pollingEnabled) {
          // Check if webhook is currently active before starting polling
          const webhookInfo = await this.getWebhookInfo();
          if (webhookInfo.ok && webhookInfo.result?.url) {
            this.logger.log(
              `ℹ️ Webhook is active at ${webhookInfo.result.url}. Deleting webhook to enable local long polling...`,
            );
            await this.deleteWebhook();
          }

          this.startPolling();
        }
      } else {
        this.logger.error(
          `❌ Telegram authentication failed: ${meRes.description || 'Invalid token (HTTP ' + meRes.error_code + ')'}. Please check TELEGRAM_BOT_TOKEN in backend/.env.`,
        );
      }
    } catch (err: any) {
      this.logger.error(`❌ Failed to connect to Telegram API: ${err.message}`);
    }
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  public maskToken(token: string): string {
    if (!token) return '[NOT_SET]';
    if (token.length <= 8) return '****';
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  }

  public getBotInfo(): {
    configured: boolean;
    bot?: TelegramBotInfo | null;
    polling: boolean;
    authorizedUsersCount: number;
    defaultApplicantId: string;
  } {
    return {
      configured: Boolean(this.botToken),
      bot: this.botInfo,
      polling: this.isPolling,
      authorizedUsersCount: this.authorizedUserIds.size,
      defaultApplicantId: this.defaultApplicantId,
    };
  }

  // ==========================================
  // Long Polling Implementation
  // ==========================================

  public startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.pollingAbortController = new AbortController();
    this.logger.log('🚀 Starting Telegram Long Polling listener...');

    // Run polling loop in background
    (async () => {
      while (this.isPolling) {
        try {
          const updates = await this.getUpdates(this.lastUpdateId + 1, 20, 15);
          if (updates.ok && Array.isArray(updates.result)) {
            for (const update of updates.result) {
              this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
              if (!this.processedUpdateIds.has(update.update_id)) {
                this.processedUpdateIds.add(update.update_id);
                // Keep set bounded
                if (this.processedUpdateIds.size > 2000) {
                  const firstItems = Array.from(this.processedUpdateIds).slice(0, 500);
                  firstItems.forEach((id) => this.processedUpdateIds.delete(id));
                }
                await this.processUpdate(update);
              }
            }
          }
        } catch (err: any) {
          if (!this.isPolling) break;
          this.logger.warn(`Polling error (retrying in 3s): ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    })();
  }

  public stopPolling() {
    if (!this.isPolling) return;
    this.logger.log('⏹️ Stopping Telegram Long Polling listener...');
    this.isPolling = false;
    if (this.pollingAbortController) {
      this.pollingAbortController.abort();
      this.pollingAbortController = null;
    }
  }

  // ==========================================
  // Message Extraction & Routing
  // ==========================================

  public extractMessage(update: TelegramUpdate): ExtractedTelegramMessage | null {
    const msg: TelegramMessage | undefined = update.message || update.edited_message;
    if (!msg || !msg.chat) return null;

    let rawType: ExtractedTelegramMessage['rawType'] = 'unknown';
    if (msg.text) rawType = 'text';
    else if (msg.photo) rawType = 'photo';
    else if (msg.sticker) rawType = 'sticker';
    else if (msg.voice) rawType = 'voice';
    else if (msg.audio) rawType = 'audio';
    else if (msg.document) rawType = 'document';
    else if (msg.video) rawType = 'video';

    return {
      updateId: update.update_id,
      userId: msg.from?.id,
      chatId: msg.chat.id,
      username: msg.from?.username,
      firstName: msg.from?.first_name,
      text: msg.text || msg.caption || '',
      timestamp: msg.date,
      hasText: Boolean((msg.text || msg.caption)?.trim()),
      rawType,
    };
  }

  /**
   * Main incoming update processor.
   */
  public async processUpdate(update: TelegramUpdate): Promise<{ handled: boolean; replySent?: boolean; reason?: string }> {
    const extracted = this.extractMessage(update);
    if (!extracted) {
      return { handled: false, reason: 'No valid message in update' };
    }

    this.logger.log(
      `📩 [Telegram] Message from User ${extracted.userId} (@${extracted.username || extracted.firstName}): "${extracted.text || '[' + extracted.rawType + ']'}"`,
    );

    // 1. Authorization Check
    if (this.authorizedUserIds.size > 0 && extracted.userId && !this.authorizedUserIds.has(extracted.userId)) {
      this.logger.warn(`🚫 Unauthorized Telegram User ID ${extracted.userId} attempted access.`);
      await this.sendMessage(
        extracted.chatId,
        `🔒 *Access Restricted*\n\nYour Telegram User ID is \`${extracted.userId}\`.\n\nTo link your Telegram account to PixelMind AI and applicant records, add your User ID to \`TELEGRAM_AUTHORIZED_USER_IDS\` in your backend \`.env\` file.`,
        { parse_mode: 'Markdown' },
      );
      return { handled: true, replySent: true, reason: 'Unauthorized user' };
    }

    // 2. Handle Non-Text Media
    if (!extracted.hasText) {
      let mediaHelp = '📎 I received your attachment!';
      if (extracted.rawType === 'document' || extracted.rawType === 'photo') {
        mediaHelp =
          '📄 *Document Received*\n\nTo have your certificates or transcripts verified against German visa requirements, please upload them directly to the Educaro Web Portal (Document Verification tab).\n\nFeel free to ask me questions like "Which documents do I have uploaded?" or "What is missing?".';
      } else if (extracted.rawType === 'voice' || extracted.rawType === 'audio') {
        mediaHelp =
          '🎙️ *Voice Note Received*\n\nFor real-time voice conversations with low-latency AI speech, open the PixelMind AI Voice interface on your Educaro dashboard!';
      } else {
        mediaHelp = '👋 Send me a question about your career goals, documents, eligibility, or profile in Germany!';
      }

      await this.sendMessage(extracted.chatId, mediaHelp, { parse_mode: 'Markdown' });
      return { handled: true, replySent: true };
    }

    const text = extracted.text!.trim();
    const lowerText = text.toLowerCase();

    // 3. Send "typing" action to Telegram while AI thinks
    await this.sendChatAction(extracted.chatId, 'typing');

    // 4. Handle Dedicated Telegram Slash Commands
    if (lowerText === '/start') {
      const welcome = await this.buildWelcomeMessage(extracted.firstName);
      await this.sendMessage(extracted.chatId, welcome, { parse_mode: 'Markdown' });
      return { handled: true, replySent: true };
    }

    if (lowerText === '/help') {
      const help = this.buildHelpMessage();
      await this.sendMessage(extracted.chatId, help, { parse_mode: 'Markdown' });
      return { handled: true, replySent: true };
    }

    if (lowerText === '/clear') {
      const applicantUuid = resolveApplicantUuid(this.defaultApplicantId);
      await this.conversationsService.clearHistory(applicantUuid);
      await this.sendMessage(
        extracted.chatId,
        '✨ *Conversation Cleared*\n\nYour chat context has been reset! All your profile records, verified documents, requirements, and journey progress remain safely intact. What would you like to explore next?',
        { parse_mode: 'Markdown' },
      );
      return { handled: true, replySent: true };
    }

    if (lowerText === '/status') {
      const statusMsg = await this.buildStatusMessage();
      await this.sendMessage(extracted.chatId, statusMsg, { parse_mode: 'Markdown' });
      return { handled: true, replySent: true };
    }

    // 5. Route Natural Language Message through existing AiOrchestrator
    try {
      const chatResponse = await this.aiOrchestrator.processChat({
        applicantId: this.defaultApplicantId,
        message: text,
      });

      const replyText = chatResponse.message || 'I processed your request, but received no response message.';

      // Split long replies if > 4000 characters
      const chunks = this.chunkMessage(replyText, 4000);
      for (const chunk of chunks) {
        await this.sendMessage(extracted.chatId, chunk);
      }

      return { handled: true, replySent: true };
    } catch (err: any) {
      this.logger.error(`💥 Error processing AI response for Telegram: ${err.message}`, err.stack);
      await this.sendMessage(
        extracted.chatId,
        '⚠️ Sorry, I encountered an issue retrieving your applicant records. Please ensure the backend server and database are healthy.',
      );
      return { handled: true, replySent: false, reason: err.message };
    }
  }

  // ==========================================
  // Dynamic Telegram Response Builders
  // ==========================================

  private async buildWelcomeMessage(firstName?: string): Promise<string> {
    const snapshot = await this.aiOrchestrator.getApplicantContextSnapshot(this.defaultApplicantId);
    const name = snapshot.applicant.name || firstName || 'Applicant';
    const goal = snapshot.applicant.goal || 'Career in Germany';

    return (
      `👋 *Welcome to PixelMind AI, ${name}!* 🇩🇪\n\n` +
      `I am your intelligent companion for your journey to Germany. You are connected as *${name}* targeting: *${goal}*.\n\n` +
      `💡 *Things you can ask me:*\n` +
      `• _"Which documents have I uploaded?"_\n` +
      `• _"What is missing for my German visa?"_\n` +
      `• _"Am I eligible to work in Germany?"_\n` +
      `• _"What should I do next?"_\n` +
      `• _"Change my name to Rahul Sharma"_\n` +
      `• _"Generate my German CV"_\n\n` +
      `📌 *Available Commands:*\n` +
      `• \`/status\` - View live journey and qualification status\n` +
      `• \`/clear\` - Reset chat history without losing profile data\n` +
      `• \`/help\` - View command guide\n\n` +
      `How can I assist your application today?`
    );
  }

  private buildHelpMessage(): string {
    return (
      `📚 *PixelMind AI Telegram Guide*\n\n` +
      `Every feature available on the Educaro Web Portal is connected right here through the Telegram Bot!\n\n` +
      `🔹 *Profile & Goals:*\n` +
      `Ask about your education, work experience, target role, or update personal information directly.\n\n` +
      `🔹 *Document Verification:*\n` +
      `Check statuses of Degree Certificates, Goethe German Certificates, and Passport verification results.\n\n` +
      `🔹 *Eligibility & Next Actions:*\n` +
      `Get real-time evaluation of your German Opportunity Card (Chancenkarte) or EU Blue Card eligibility.\n\n` +
      `🔹 *CV & Application:*\n` +
      `Check your approved German-standard CV contents.\n\n` +
      `Commands: \`/status\`, \`/clear\`, \`/help\``
    );
  }

  private async buildStatusMessage(): Promise<string> {
    const snapshot = await this.aiOrchestrator.getApplicantContextSnapshot(this.defaultApplicantId);
    const { applicant, documents, qualification, journey, nextAction } = snapshot;

    let docSummary = '';
    if (documents.length === 0) {
      docSummary = '• No documents uploaded yet';
    } else {
      docSummary = documents
        .map((d) => `• *${d.name}*: \`${d.status?.toUpperCase() || 'PENDING'}\``)
        .join('\n');
    }

    return (
      `📊 *Live Application Status: ${applicant.name}*\n\n` +
      `🎯 *Career Goal:* ${applicant.goal}\n` +
      `🚀 *Journey Stage:* \`${journey.currentStage}\` (${journey.progress}% complete)\n` +
      `⚖️ *Qualification Status:* \`${qualification.status}\` (${qualification.satisfied}/${qualification.totalRequirements} satisfied)\n\n` +
      `📄 *Uploaded Documents (${documents.length}):*\n${docSummary}\n\n` +
      `👉 *Recommended Next Action:*\n${nextAction ? `*${nextAction.title}*\n_${nextAction.reason}_` : 'All current steps complete!'}`
    );
  }

  // ==========================================
  // Telegram Bot API Low-Level Methods
  // ==========================================

  public async sendMessage(
    chatId: number | string,
    text: string,
    options?: Partial<SendMessagePayload>,
  ): Promise<TelegramApiResponse> {
    if (!this.botToken) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
    }

    const endpoint = `${this.baseUrl}/bot${this.botToken}/sendMessage`;
    const payload: SendMessagePayload = {
      chat_id: chatId,
      text,
      ...options,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TelegramApiResponse;

      if (!response.ok || !data.ok) {
        // If Markdown parsing failed, retry as plain text
        if (options?.parse_mode && data.description?.includes("can't parse entities")) {
          this.logger.warn(`Markdown parse failed. Retrying sendMessage in plain text...`);
          return this.sendMessage(chatId, text, { ...options, parse_mode: undefined });
        }

        this.logger.error(`❌ Telegram sendMessage error: ${data.description}`);
        return data;
      }

      return data;
    } catch (err: any) {
      this.logger.error(`❌ Network error sending to Telegram: ${err.message}`);
      return { ok: false, description: err.message };
    }
  }

  public async sendChatAction(chatId: number | string, action: 'typing' | 'upload_document'): Promise<void> {
    if (!this.botToken) return;
    try {
      await fetch(`${this.baseUrl}/bot${this.botToken}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action }),
      });
    } catch {}
  }

  public async getMe(): Promise<TelegramApiResponse<TelegramBotInfo>> {
    if (!this.botToken) return { ok: false, description: 'No token' };
    const res = await fetch(`${this.baseUrl}/bot${this.botToken}/getMe`);
    return (await res.json()) as TelegramApiResponse<TelegramBotInfo>;
  }

  public async getUpdates(offset?: number, limit = 100, timeout = 10): Promise<TelegramApiResponse<TelegramUpdate[]>> {
    if (!this.botToken) return { ok: false, result: [] };
    const url = new URL(`${this.baseUrl}/bot${this.botToken}/getUpdates`);
    if (offset !== undefined) url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('timeout', String(timeout));

    const res = await fetch(url.toString());
    return (await res.json()) as TelegramApiResponse<TelegramUpdate[]>;
  }

  public async setWebhook(webhookUrl: string): Promise<TelegramApiResponse> {
    if (!this.botToken) return { ok: false, description: 'No token' };
    const res = await fetch(`${this.baseUrl}/bot${this.botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    return (await res.json()) as TelegramApiResponse;
  }

  public async getWebhookInfo(): Promise<TelegramApiResponse<WebhookInfo>> {
    if (!this.botToken) return { ok: false, description: 'No token' };
    const res = await fetch(`${this.baseUrl}/bot${this.botToken}/getWebhookInfo`);
    return (await res.json()) as TelegramApiResponse<WebhookInfo>;
  }

  public async deleteWebhook(): Promise<TelegramApiResponse> {
    if (!this.botToken) return { ok: false, description: 'No token' };
    const res = await fetch(`${this.baseUrl}/bot${this.botToken}/deleteWebhook`, {
      method: 'POST',
    });
    return (await res.json()) as TelegramApiResponse;
  }

  private chunkMessage(text: string, maxLen = 4000): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let current = '';

    const lines = text.split('\n');
    for (const line of lines) {
      if ((current + '\n' + line).length > maxLen) {
        if (current.trim()) chunks.push(current.trim());
        current = line;
      } else {
        current = current ? current + '\n' + line : line;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }
}
