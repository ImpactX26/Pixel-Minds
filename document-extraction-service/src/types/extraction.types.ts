import { z } from 'zod';

export type DocumentType =
  | 'degree_certificate'
  | 'academic_transcript'
  | 'experience_letter'
  | 'language_certificate'
  | 'cv'
  | 'passport_identity'
  | 'other';

export type ExtractionStatus = 'processed' | 'failed';

/**
 * Strict Zod validation schema for standard extracted education/degree document fields.
 * Ensures missing or uncertain fields evaluate strictly to null rather than fabricated strings.
 */
export const ExtractedDataSchema = z.object({
  fullName: z.string().nullable().default(null),
  dateOfBirth: z.string().nullable().default(null),
  degree: z.string().nullable().default(null),
  university: z.string().nullable().default(null),
  graduationYear: z.string().nullable().default(null),
  // Additional optional metadata fields for future extensibility
  documentType: z.string().nullable().optional().default(null),
  institutionLocation: z.string().nullable().optional().default(null),
  gradeOrGpa: z.string().nullable().optional().default(null),
});

export type ExtractedData = z.infer<typeof ExtractedDataSchema>;

export interface ExtractionRequestDto {
  documentId: string;
  documentUrl?: string;
  documentPath?: string;
  documentType?: DocumentType;
  base64Data?: string;
  mimeType?: string;
}

export interface ExtractionResponseDto {
  documentId: string;
  documentType?: string;
  status: ExtractionStatus;
  extractedData: ExtractedData | null;
  confidence: number;
  metadata?: {
    ocrMethod?: string;
    aiProvider?: string;
    processingTimeMs?: number;
    charCount?: number;
    extractedAt?: string;
  };
  error?: string;
}

export interface LoadedDocument {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
  source: string;
}
