import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async getHealth(@Res() res: Response) {
    let dbStatus = 'disconnected';
    let dbError: string | null = null;

    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        // Run a lightweight query to confirm active connection
        await this.dataSource.query('SELECT 1');
        dbStatus = 'connected';
      }
    } catch (err: any) {
      dbStatus = 'error';
      dbError = err?.message || 'Database query failed';
    }

    const isHealthy = dbStatus === 'connected';

    return res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'educaro-backend',
      database: {
        status: dbStatus,
        error: dbError,
      },
    });
  }
}
