/**
 * Telegram Bot API TypeScript Definitions
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
  photo?: Array<{ file_id: string; file_size?: number; width: number; height: number }>;
  sticker?: { file_id: string; emoji?: string };
  voice?: { file_id: string; duration: number };
  audio?: { file_id: string; duration: number };
  document?: { file_id: string; file_name?: string; mime_type?: string; file_size?: number };
  video?: { file_id: string; duration: number };
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
export interface ExtractedTelegramMessage {
  updateId: number;
  userId?: number;
  chatId: number;
  username?: string;
  firstName?: string;
  text?: string;
  timestamp: number;
  hasText: boolean;
  rawType: 'text' | 'photo' | 'sticker' | 'voice' | 'audio' | 'document' | 'video' | 'unknown';
}

/**
 * Payload sent to Telegram sendMessage endpoint
 */
export interface SendMessagePayload {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  disable_web_page_preview?: boolean;
}

/**
 * Standard response envelope from Telegram Bot API
 */
export interface TelegramApiResponse<T = any> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}
