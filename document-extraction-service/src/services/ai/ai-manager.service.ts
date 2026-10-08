import { config } from '../../config/env';
import { IAiExtractionProvider, AiExtractionResult } from './ai.interface';
import { GeminiExtractionProvider } from './gemini-extraction.provider';
import { MockFallbackExtractionProvider } from './mock-fallback-extraction.provider';

export class AiManagerService {
  private activeProvider: IAiExtractionProvider;

  constructor(customProvider?: IAiExtractionProvider) {
    if (customProvider) {
      this.activeProvider = customProvider;
    } else if (config.aiProvider === 'gemini' && config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
      this.activeProvider = new GeminiExtractionProvider(config.geminiApiKey, config.geminiModel);
    } else {
      if (config.aiProvider === 'gemini' && (!config.geminiApiKey || config.geminiApiKey.trim().length === 0)) {
        console.warn('⚠️ [AiManager] GEMINI_API_KEY is not set in .env. Falling back to local deterministic extractor for development/testing.');
      }
      this.activeProvider = new MockFallbackExtractionProvider();
    }
  }

  async extractStructuredData(rawText: string, suggestedType?: string): Promise<AiExtractionResult> {
    return await this.activeProvider.extract(rawText, suggestedType);
  }

  getProviderName(): string {
    return this.activeProvider.name;
  }
}
