import { createWorker } from 'tesseract.js';
import { IOcrProvider, OcrResult } from './ocr.interface';

export class TesseractOcrProvider implements IOcrProvider {
  name = 'tesseract.js';

  async extractText(buffer: Buffer, _mimeType: string): Promise<OcrResult> {
    let worker: any = null;
    try {
      worker = await createWorker('eng');
      const ret = await worker.recognize(buffer);
      const text = ret.data.text ? ret.data.text.trim() : '';
      const confidence = typeof ret.data.confidence === 'number' ? ret.data.confidence / 100 : 0.85;

      await worker.terminate();

      return {
        text,
        confidence: Math.max(0, Math.min(1, confidence)),
        method: 'tesseract-ocr',
        characterCount: text.length,
      };
    } catch (error: any) {
      if (worker) {
        try {
          await worker.terminate();
        } catch (_) {}
      }
      throw new Error(`Tesseract OCR failed: ${error?.message || error}`);
    }
  }
}
