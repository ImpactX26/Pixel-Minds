import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Mask sensitive tokens for safe logging.
 * Example: "123456789:ABCdefGhIJKlmNo" -> "1234...kNo"
 */
export function maskToken(token: string | undefined): string {
  if (!token) return '[NOT_SET]';
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/**
 * Application environment configuration
 */
export interface AppConfig {
  port: number;
  telegramBotToken: string;
  webhookDomain: string;
  telegramApiBaseUrl: string;
}

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
const port = parseInt(process.env.PORT || '3000', 10);
const webhookDomain = process.env.WEBHOOK_DOMAIN || '';

export const config: AppConfig = {
  port: isNaN(port) ? 3000 : port,
  telegramBotToken,
  webhookDomain,
  telegramApiBaseUrl: 'https://api.telegram.org',
};

/**
 * Helper to validate environment configuration on startup
 */
export function validateConfig(): void {
  console.log('--------------------------------------------------');
  console.log('🔧 Configuration Check:');
  console.log(`- PORT: ${config.port}`);
  console.log(`- TELEGRAM_BOT_TOKEN: ${maskToken(config.telegramBotToken)}`);
  if (config.webhookDomain) {
    console.log(`- WEBHOOK_DOMAIN: ${config.webhookDomain}`);
  }
  console.log('--------------------------------------------------');

  if (!config.telegramBotToken) {
    console.warn(
      '⚠️ WARNING: TELEGRAM_BOT_TOKEN is not set in .env!\n' +
      '   The server will run, but messages cannot be sent to Telegram.\n' +
      '   Please open .env and add your BotFather token.'
    );
  }
}
