export interface OcrResult {
  text: string;
  confidence?: number;
  method: string;
  pageCount?: number;
  characterCount: number;
}

export interface IOcrProvider {
  name: string;
  extractText(buffer: Buffer, mimeType: string): Promise<OcrResult>;
}
