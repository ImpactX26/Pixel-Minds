import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './common/database/entities';
import { CommonModule } from './common/common.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { ProfileModule } from './profile/profile.module';
import { JourneyModule } from './journey/journey.module';
import { DocumentsModule } from './documents/documents.module';
import { QualificationModule } from './qualification/qualification.module';
import { NextActionModule } from './next-action/next-action.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AiModule } from './ai/ai.module';
import { CvModule } from './cv/cv.module';
import { ConclusionModule } from './conclusion/conclusion.module';
import { TelegramModule } from './telegram/telegram.module';

import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend', '.env'),
        path.resolve(__dirname, '..', '..', '.env'),
        path.resolve(__dirname, '..', '.env'),
        '.env',
        'backend/.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const dbHost = configService.get<string>('DB_HOST');
        const isSync = configService.get<string>('DB_SYNCHRONIZE') === 'true';
        const isLogging = configService.get<string>('DB_LOGGING') === 'true';
        const isSsl =
          configService.get<string>('DB_SSL') === 'true' ||
          (databaseUrl &&
            (databaseUrl.includes('supabase.co') ||
              databaseUrl.includes('supabase.com') ||
              databaseUrl.includes('sslmode=require'))) ||
          (dbHost &&
            (dbHost.includes('supabase.co') || dbHost.includes('supabase.com')));

        const ssl = isSsl ? { rejectUnauthorized: false } : false;

        // Prefer discrete connection parameters to safely handle special characters in passwords
        if (dbHost && dbHost !== 'localhost') {
          return {
            type: 'postgres',
            host: dbHost,
            port: Number(configService.get<number>('DB_PORT', 5432)),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_NAME', 'postgres'),
            ssl,
            entities,
            synchronize: isSync,
            logging: isLogging,
            autoLoadEntities: true,
            retryAttempts: 2,
            retryDelay: 1000,
          };
        }

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl,
            entities,
            synchronize: isSync,
            logging: isLogging,
            autoLoadEntities: true,
            retryAttempts: 2,
            retryDelay: 1000,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number(configService.get<number>('DB_PORT', 5432)),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'educaro_companion'),
          ssl,
          entities,
          synchronize: isSync,
          logging: isLogging,
          autoLoadEntities: true,
          retryAttempts: 2,
          retryDelay: 1000,
        };
      },
    }),
    CommonModule,
    ApplicantsModule,
    ProfileModule,
    JourneyModule,
    DocumentsModule,
    QualificationModule,
    NextActionModule,
    ConversationsModule,
    AiModule,
    CvModule,
    ConclusionModule,
    TelegramModule,
  ],
})
export class AppModule {}
