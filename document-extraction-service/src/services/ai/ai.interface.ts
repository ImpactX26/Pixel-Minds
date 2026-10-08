import { ExtractedData } from '../../types/extraction.types';

export interface AiExtractionResult {
  extractedData: ExtractedData;
  detectedDocumentType?: string;
  modelUsed: string;
  rawResponse?: string;
  aiConfidence?: number;
}

export interface IAiExtractionProvider {
  name: string;
  extract(rawText: string, suggestedType?: string): Promise<AiExtractionResult>;
}
