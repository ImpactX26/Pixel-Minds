import { IOcrProvider, OcrResult } from './ocr.interface';
import { PdfParserProvider } from './pdf-parser.provider';
import { TesseractOcrProvider } from './tesseract-ocr.provider';

export class OcrManagerService {
  private pdfProvider: IOcrProvider;
  private imageProvider: IOcrProvider;

  constructor(pdfProvider?: IOcrProvider, imageProvider?: IOcrProvider) {
    this.pdfProvider = pdfProvider || new PdfParserProvider();
    this.imageProvider = imageProvider || new TesseractOcrProvider();
  }

  async processDocument(buffer: Buffer, mimeType: string): Promise<OcrResult> {
    // 1. Check if plain text / direct text stream
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      const text = buffer.toString('utf-8').trim();
      return {
        text,
        confidence: 0.99,
        method: 'direct-text-stream',
        characterCount: text.length,
      };
    }

    // 2. Check if PDF
    const isPdf = mimeType.includes('pdf') || (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF');
    if (isPdf) {
      try {
        const result = await this.pdfProvider.extractText(buffer, mimeType);
        if (result.text && result.text.length > 10) {
          return result;
        }
        console.warn('⚠️ [OcrManager] PDF text layer was minimal or empty.');
        return result;
      } catch (err: any) {
        console.warn(`⚠️ [OcrManager] PDF parser failed: ${err.message}`);
        throw err;
      }
    }

    // 3. Image OCR (PNG, JPEG, etc.)
    return await this.imageProvider.extractText(buffer, mimeType);
  }
}
