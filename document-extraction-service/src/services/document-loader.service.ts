import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ExtractionRequestDto, LoadedDocument } from '../types/extraction.types';

export class DocumentLoaderService {
  /**
   * Retrieves and loads document buffer from URL, local file, or Base64
   */
  async loadDocument(request: ExtractionRequestDto): Promise<LoadedDocument> {
    // 1. Check if Base64 is provided directly
    if (request.base64Data) {
      const buffer = Buffer.from(request.base64Data, 'base64');
      const mimeType = request.mimeType || this.detectMimeTypeFromBuffer(buffer);
      return {
        buffer,
        mimeType,
        source: 'base64',
      };
    }

    // 2. Check if local filesystem path is provided
    if (request.documentPath) {
      if (!fs.existsSync(request.documentPath)) {
        throw new Error(`File not found at path: ${request.documentPath}`);
      }
      const buffer = fs.readFileSync(request.documentPath);
      const ext = path.extname(request.documentPath).toLowerCase();
      const mimeType = this.getMimeTypeFromExtension(ext) || this.detectMimeTypeFromBuffer(buffer);
      return {
        buffer,
        mimeType,
        fileName: path.basename(request.documentPath),
        source: 'local_file',
      };
    }

    // 3. Check if document URL is provided (e.g. Supabase storage public or pre-signed URL)
    if (request.documentUrl) {
      return await this.fetchFromUrl(request.documentUrl);
    }

    throw new Error('No document source provided. Provide documentUrl, documentPath, or base64Data.');
  }

  private async fetchFromUrl(url: string): Promise<LoadedDocument> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'PixelMind-DocumentIntelligence/1.0',
      },
    });

    const buffer = Buffer.from(response.data);
    const contentTypeHeader = response.headers['content-type'];
    let mimeType: string = typeof contentTypeHeader === 'string' ? contentTypeHeader.split(';')[0]?.trim() : '';

    if (!mimeType || mimeType === 'application/octet-stream') {
      mimeType = this.detectMimeTypeFromBuffer(buffer);
    }

    const urlPathname = new URL(url, 'http://localhost').pathname;
    const fileName = path.basename(urlPathname) || 'downloaded_document';

    return {
      buffer,
      mimeType,
      fileName,
      source: 'url',
    };
  }

  /**
   * Detects MIME type by inspecting leading magic bytes in the buffer
   */
  detectMimeTypeFromBuffer(buffer: Buffer): string {
    if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF') {
      return 'application/pdf';
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    return 'application/octet-stream';
  }

  private getMimeTypeFromExtension(ext: string): string | null {
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      default:
        return null;
    }
  }
}
