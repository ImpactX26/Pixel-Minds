/**
 * Telegram Bot API Types
 * Based on official Telegram Bot API specification: https://core.telegram.org/bots/api
 */

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  photo?: unknown[];
  sticker?: unknown;
  voice?: unknown;
  audio?: unknown;
  document?: unknown;
  video?: unknown;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

/**
 * Clean data extracted from an incoming Telegram update
 */
export interface ExtractedMessage {
  userId?: number;
  chatId: number;
  username?: string;
  firstName?: string;
  text?: string;
  timestamp: number;
  hasText: boolean;
  rawType: string;
}

/**
 * Payload sent to Telegram sendMessage endpoint
 */
export interface SendMessagePayload {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
}

/**
 * Standard response envelope from Telegram Bot API
 */
export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}
