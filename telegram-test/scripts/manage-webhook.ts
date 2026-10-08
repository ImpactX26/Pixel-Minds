import { config, maskToken } from '../src/config/env';
import { TelegramService } from '../src/telegram/telegram.service';

const action = process.argv[2] || 'get';
const customUrl = process.argv[3];

async function main() {
  console.log('🤖 Telegram Webhook Manager');
  console.log(`🔑 Bot Token: ${maskToken(config.telegramBotToken)}`);

  if (!config.telegramBotToken) {
    console.error('\n❌ ERROR: TELEGRAM_BOT_TOKEN is not set in .env');
    console.error('Please add your Telegram bot token from BotFather to .env first.\n');
    process.exit(1);
  }

  const telegramService = new TelegramService();

  switch (action) {
    case 'set': {
      let targetDomain = customUrl || config.webhookDomain;

      if (!targetDomain) {
        console.error('\n❌ ERROR: Missing tunnel domain!');
        console.error('Usage:');
        console.error('  npm run webhook:set https://your-tunnel.ngrok-free.app');
        console.error('OR define WEBHOOK_DOMAIN=https://your-tunnel.ngrok-free.app in .env\n');
        process.exit(1);
      }

      // Ensure proper protocol and format
      if (!targetDomain.startsWith('http://') && !targetDomain.startsWith('https://')) {
        targetDomain = `https://${targetDomain}`;
      }

      // Remove trailing slash if present
      targetDomain = targetDomain.replace(/\/+$/, '');

      const fullWebhookUrl = `${targetDomain}/api/telegram/webhook`;
      console.log(`\n⏳ Setting Telegram webhook to: ${fullWebhookUrl}...`);

      const result = await telegramService.setWebhook(fullWebhookUrl);
      console.log('\nTelegram API Response:');
      console.log(JSON.stringify(result, null, 2));

      if (result.ok) {
        console.log('\n✅ SUCCESS! Webhook is set and active.');
      } else {
        console.log('\n❌ FAILED to set webhook. Check the description above.');
      }
      break;
    }

    case 'get':
    case 'info': {
      console.log('\n⏳ Fetching current webhook status from Telegram...');
      const result = await telegramService.getWebhookInfo();
      console.log('\nCurrent Webhook Status:');
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'delete':
    case 'remove': {
      console.log('\n⏳ Deleting webhook on Telegram...');
      const result = await telegramService.deleteWebhook();
      console.log('\nTelegram API Response:');
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.log(`Unknown action: "${action}". Available actions: set, get, delete`);
      break;
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
