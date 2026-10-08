import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { entities } from './entities';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const isSsl =
  process.env.DB_SSL === 'true' ||
  (databaseUrl &&
    (databaseUrl.includes('supabase.co') ||
      databaseUrl.includes('supabase.com') ||
      databaseUrl.includes('sslmode=require')));

const ssl = isSsl ? { rejectUnauthorized: false } : false;

export const AppDataSource = new DataSource(
  databaseUrl
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
        port: parseInt(process.env.DB_PORT, 10) || 5432,
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
