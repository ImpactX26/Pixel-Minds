import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const server: Express = express();
let cachedServer: Express;

async function bootstrapServerless(): Promise<Express> {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    const configService = app.get(ConfigService);
    const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
    });

    app.setGlobalPrefix(apiPrefix);

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

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();
    cachedServer = server;
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  const expressInstance = await bootstrapServerless();
  expressInstance(req, res);
}
