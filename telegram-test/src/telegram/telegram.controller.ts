import { Request, Response } from 'express';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.types';

export class TelegramController {
  private readonly telegramService: TelegramService;

  constructor(telegramService?: TelegramService) {
    this.telegramService = telegramService || new TelegramService();
  }

  /**
   * POST /api/telegram/webhook
   * Receives incoming updates pushed by Telegram.
   */
  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const update = req.body as TelegramUpdate;

      // Validate that request body has update_id (basic Telegram structure check)
      if (!update || typeof update.update_id !== 'number') {
        console.warn('⚠️ [TelegramController] Received invalid webhook payload (missing update_id)');
        res.status(400).json({
          ok: false,
          error: 'Invalid payload: missing update_id',
        });
        return;
      }

      // Process update asynchronously or synchronously
      // Telegram requires an HTTP 200 response to acknowledge receipt.
      const result = await this.telegramService.processUpdate(update);

      res.status(200).json({
        ok: true,
        handled: result.handled,
        reason: result.reason,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('💥 [TelegramController] Unexpected error in handleWebhook:', errorMessage);

      // Return 200 or 500 based on standard webhook practices
      // Returning 200 prevents Telegram from endlessly retrying bad payloads
      res.status(200).json({
        ok: false,
        error: 'Internal processing error handled',
      });
    }
  };

  /**
   * GET /api/telegram/info
   * Optional inspection route to view current webhook status from Telegram.
   */
  public getWebhookStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const info = await this.telegramService.getWebhookInfo();
      res.status(200).json(info);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ ok: false, error: errorMessage });
    }
  };
}
