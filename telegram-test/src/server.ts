import express, { Request, Response, NextFunction } from 'express';
import { config, validateConfig } from './config/env';
import { TelegramController } from './telegram/telegram.controller';

const app = express();
const telegramController = new TelegramController();

// 1. Validate environment configuration on startup
validateConfig();

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for incoming API calls
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path !== '/health') {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// 3. Health Check Route (as requested: GET /health returns { status: "ok" })
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PixelMind AI - Telegram Integration Test',
  });
});

// Root route for quick verification in a browser
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'PixelMind AI - Telegram Test Backend',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      webhook: 'POST /api/telegram/webhook',
      webhookInfo: 'GET /api/telegram/info',
    },
  });
});

// 4. Telegram Webhook Endpoint
// Handles incoming updates directly from the Telegram Bot API
app.post('/api/telegram/webhook', telegramController.handleWebhook);

// Helper endpoint to check current Telegram webhook configuration
app.get('/api/telegram/info', telegramController.getWebhookStatus);

// 5. 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    message: 'Check your route. Webhook endpoint is POST /api/telegram/webhook',
  });
});

// 6. Global Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Unhandled application error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 7. Start Server
const server = app.listen(config.port, () => {
  console.log('🚀 ==================================================');
  console.log(`🚀 PixelMind AI - Telegram Test Server is RUNNING!`);
  console.log(`🌐 Local URL:     http://localhost:${config.port}`);
  console.log(`💓 Health Check:  http://localhost:${config.port}/health`);
  console.log(`📨 Webhook Route: http://localhost:${config.port}/api/telegram/webhook`);
  console.log('🚀 ==================================================');
  console.log('👉 Next Steps:');
  console.log('   1. Start ngrok or Cloudflare tunnel on port ' + config.port);
  console.log('   2. Set webhook on Telegram using the tunnel URL');
  console.log('   3. Send "Hello" or "What is PixelMind AI?" to your bot!');
  console.log('==================================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down server...');
  server.close(() => process.exit(0));
});

export default app;
