import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  aiProvider: 'gemini' | 'openai' | 'mock';
  geminiApiKey?: string;
  geminiModel: string;
  ocrProvider: 'tesseract' | 'pdf-native' | 'mock';
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  aiProvider: (process.env.AI_PROVIDER as any) || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  ocrProvider: (process.env.OCR_PROVIDER as any) || 'tesseract',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};

/**
 * Safely masks secret values for secure logging
 */
export function maskSecret(secret?: string): string {
  if (!secret || secret.trim() === '') return '(not configured)';
  if (secret.length <= 8) return '********';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function logConfig(): void {
  console.log('--------------------------------------------------');
  console.log('🔧 Document Extraction Service Config:');
  console.log(`- PORT:          ${config.port}`);
  console.log(`- NODE_ENV:      ${config.nodeEnv}`);
  console.log(`- AI_PROVIDER:   ${config.aiProvider}`);
  console.log(`- GEMINI_MODEL:  ${config.geminiModel}`);
  console.log(`- GEMINI_KEY:    ${maskSecret(config.geminiApiKey)}`);
  console.log(`- OCR_PROVIDER:  ${config.ocrProvider}`);
  console.log('--------------------------------------------------');
}
