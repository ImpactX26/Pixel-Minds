import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  // CORS configuration
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
  ];

  const envOrigins =
    corsOrigin && corsOrigin !== '*'
      ? corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
      : [];

  const originWhitelist = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (like curl, mobile apps, or same-origin)
      if (!requestOrigin) {
        return callback(null, true);
      }

      // Check if origin is in whitelist or is any localhost port
      const isAllowed =
        originWhitelist.includes(requestOrigin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter and logging
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 Educaro AI Companion Backend running on port ${port}`);
  logger.log(`🌐 Base API URL: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🩺 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`====================================================`);
}

if (!process.env.VERCEL) {
  bootstrap().catch((err) => {
    const logger = new Logger('BootstrapError');
    logger.error('Failed to bootstrap Educaro backend application', err);
    process.exit(1);
  });
}
