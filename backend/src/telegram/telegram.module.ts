import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramClientService } from './services/telegram-client.service';
import { TelegramAccountMappingService } from './services/telegram-account-mapping.service';

@Module({
  imports: [ConfigModule, AiModule],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    TelegramClientService,
    TelegramAccountMappingService,
  ],
  exports: [TelegramService, TelegramAccountMappingService],
})
export class TelegramModule {}
