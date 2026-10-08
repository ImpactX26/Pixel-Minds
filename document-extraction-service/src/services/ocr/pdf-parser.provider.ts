import pdfParse from 'pdf-parse';
import { IOcrProvider, OcrResult } from './ocr.interface';

export class PdfParserProvider implements IOcrProvider {
  name = 'pdf-parse';

  async extractText(buffer: Buffer, _mimeType: string): Promise<OcrResult> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text ? data.text.trim() : '';

      return {
        text,
        confidence: text.length > 30 ? 0.95 : 0.4,
        method: 'pdf-native-text-extraction',
        pageCount: data.numpages || 1,
        characterCount: text.length,
      };
    } catch (error: any) {
      throw new Error(`PDF Parsing failed: ${error?.message || error}`);
    }
  }
}
