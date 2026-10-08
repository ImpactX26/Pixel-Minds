import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { entities } from './entities';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST;
const isSsl =
  process.env.DB_SSL === 'true' ||
  (databaseUrl &&
    (databaseUrl.includes('supabase.co') ||
      databaseUrl.includes('supabase.com') ||
      databaseUrl.includes('sslmode=require'))) ||
  (dbHost &&
    (dbHost.includes('supabase.co') || dbHost.includes('supabase.com')));

const ssl = isSsl ? { rejectUnauthorized: false } : false;

export const AppDataSource = new DataSource(
  dbHost && dbHost !== 'localhost'
    ? {
        type: 'postgres',
        host: dbHost,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'postgres',
        ssl,
        entities,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
        logging: process.env.DB_LOGGING === 'true' || false,
      }
    : databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        ssl,
        entities,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
        logging: process.env.DB_LOGGING === 'true' || false,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'educaro_companion',
        ssl,
        entities,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
        logging: process.env.DB_LOGGING === 'true' || false,
      },
);
