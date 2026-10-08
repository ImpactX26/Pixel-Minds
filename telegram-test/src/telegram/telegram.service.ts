import { config, maskToken } from '../config/env';
import {
  TelegramUpdate,
  TelegramMessage,
  ExtractedMessage,
  SendMessagePayload,
  TelegramApiResponse,
} from './telegram.types';

export class TelegramService {
  private readonly baseUrl: string;
  private readonly botToken: string;

  constructor() {
    this.baseUrl = config.telegramApiBaseUrl;
    this.botToken = config.telegramBotToken;
  }

  /**
   * Extract key fields from an incoming Telegram webhook update.
   */
  public extractMessage(update: TelegramUpdate): ExtractedMessage | null {
    // Handle standard message or edited message
    const msg: TelegramMessage | undefined = update.message || update.edited_message;

    if (!msg || !msg.chat) {
      return null;
    }

    const userId = msg.from?.id;
    const chatId = msg.chat.id;
    const username = msg.from?.username;
    const firstName = msg.from?.first_name;
    const text = msg.text;
    const timestamp = msg.date;

    let rawType = 'unknown';
    if (msg.text) rawType = 'text';
    else if (msg.photo) rawType = 'photo';
    else if (msg.sticker) rawType = 'sticker';
    else if (msg.voice) rawType = 'voice';
    else if (msg.audio) rawType = 'audio';
    else if (msg.document) rawType = 'document';

    return {
      userId,
      chatId,
      username,
      firstName,
      text,
      timestamp,
      hasText: typeof text === 'string' && text.trim().length > 0,
      rawType,
    };
  }

  /**
   * Determine the test response based on user input.
   * As specified:
   * - "Hello" -> "Hello! 👋 I received your message successfully."
   * - "What is PixelMind AI?" -> Predefined explanation response.
   * - Any other text -> "Received: \"<user message>\""
   */
  public generateTestResponse(text?: string): string {
    if (!text || text.trim().length === 0) {
      return 'I received your media, but this initial test version only processes text messages! Try sending "Hello" or "What is PixelMind AI?"';
    }

    const trimmed = text.trim();
    const normalized = trimmed.toLowerCase();

    if (normalized === 'hello' || normalized === 'hi') {
      return 'Hello! 👋 I received your message successfully.';
    }

    if (normalized === '/start') {
      return (
        '👋 Welcome to the PixelMind AI Telegram Test Bot!\n\n' +
        'This bot is running the Member 4 communication test.\n\n' +
        'Try sending:\n' +
        '• "Hello"\n' +
        '• "What is PixelMind AI?"\n' +
        '• Or any other custom text message'
      );
    }

    if (
      normalized === 'what is pixelmind ai?' ||
      normalized === 'what is pixelmind ai'
    ) {
      return (
        '🤖 PixelMind AI is our hackathon project companion system!\n\n' +
        'This is the Telegram communication test built by Member 4 (AI + Communication Integrations).\n' +
        'Currently, it verifies live webhook reception, message extraction, and response delivery.'
      );
    }

    // Default test fallback behavior requested
    return `Received: "${trimmed}"`;
  }

  /**
   * Send a text message to a Telegram chat via the official Bot API.
   * Endpoint: POST https://api.telegram.org/bot<TOKEN>/sendMessage
   */
  public async sendMessage(chatId: number | string, text: string): Promise<TelegramApiResponse> {
    if (!this.botToken) {
      const errorMsg = 'Cannot send message: TELEGRAM_BOT_TOKEN is missing or empty in .env';
      console.error(`❌ [TelegramService] ${errorMsg}`);
      return {
        ok: false,
        description: errorMsg,
      };
    }

    const endpoint = `${this.baseUrl}/bot${this.botToken}/sendMessage`;
    const payload: SendMessagePayload = {
      chat_id: chatId,
      text,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TelegramApiResponse;

      if (!response.ok || !data.ok) {
        console.error('❌ [TelegramService] Telegram API error:', {
          statusCode: response.status,
          errorCode: data.error_code,
          description: data.description,
        });
        return {
          ok: false,
          error_code: data.error_code || response.status,
          description: data.description || `HTTP ${response.status}: Failed to send message`,
        };
      }

      console.log(`📤 [TelegramService] Response sent successfully to Chat ID: ${chatId}`);
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ [TelegramService] Network error sending message to Telegram:', errorMessage);
      return {
        ok: false,
        description: `Network error: ${errorMessage}`,
      };
    }
  }

  /**
   * Process an incoming webhook update:
   * 1. Extract details & log them (NEVER logging the token)
   * 2. Generate response text
   * 3. Send response back to the same chat
   */
  public async processUpdate(update: TelegramUpdate): Promise<{ handled: boolean; reason?: string }> {
    const extracted = this.extractMessage(update);

    if (!extracted) {
      console.log('ℹ️ [TelegramService] Received update without a direct message chat. Skipping.');
      return { handled: false, reason: 'No valid message found in update' };
    }

    // Secure logging of received message (no tokens)
    console.log('--------------------------------------------------');
    console.log('📩 Received Telegram Message:');
    console.log(`   - User ID:    ${extracted.userId ?? 'N/A'}`);
    console.log(`   - Chat ID:    ${extracted.chatId}`);
    console.log(`   - Username:   ${extracted.username ? `@${extracted.username}` : (extracted.firstName ?? 'N/A')}`);
    console.log(`   - Type:       ${extracted.rawType}`);
    console.log(`   - Text:       ${extracted.text ? `"${extracted.text}"` : '[No text content]'}`);
    console.log(`   - Timestamp:  ${new Date(extracted.timestamp * 1000).toISOString()}`);
    console.log('--------------------------------------------------');

    // Generate reply text
    const responseText = this.generateTestResponse(extracted.text);

    // Send reply back to the sender's chat
    const sendResult = await this.sendMessage(extracted.chatId, responseText);

    return {
      handled: sendResult.ok,
      reason: sendResult.description,
    };
  }

  /**
   * Set the webhook URL on Telegram.
   */
  public async setWebhook(webhookUrl: string): Promise<TelegramApiResponse> {
    if (!this.botToken) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
    }

    const endpoint = `${this.baseUrl}/bot${this.botToken}/setWebhook`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });

    return (await response.json()) as TelegramApiResponse;
  }

  /**
   * Query the current webhook status on Telegram.
   */
  public async getWebhookInfo(): Promise<TelegramApiResponse> {
    if (!this.botToken) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
    }

    const endpoint = `${this.baseUrl}/bot${this.botToken}/getWebhookInfo`;
    const response = await fetch(endpoint);
    return (await response.json()) as TelegramApiResponse;
  }

  /**
   * Delete the webhook (useful when switching to polling or resetting).
   */
  public async deleteWebhook(): Promise<TelegramApiResponse> {
    if (!this.botToken) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
    }

    const endpoint = `${this.baseUrl}/bot${this.botToken}/deleteWebhook`;
    const response = await fetch(endpoint, { method: 'POST' });
    return (await response.json()) as TelegramApiResponse;
  }
}
