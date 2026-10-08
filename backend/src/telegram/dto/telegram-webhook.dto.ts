import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TelegramWebhookDto {
  @IsOptional()
  update_id?: number;

  @IsOptional()
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot?: boolean;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number | string;
      first_name?: string;
      username?: string;
      type?: string;
    };
    date: number;
    text?: string;
  };
}

export class TestTelegramChatDto {
  @IsNotEmpty({ message: 'chatId is required' })
  chatId: string | number;

  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message is required' })
  message: string;
}
