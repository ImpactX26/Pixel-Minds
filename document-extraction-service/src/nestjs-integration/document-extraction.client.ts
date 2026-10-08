import axios from 'axios';

export interface ExtractedDocumentResult {
  documentId: string;
  documentType?: string;
  status: 'processed' | 'failed';
  extractedData: {
    fullName: string | null;
    dateOfBirth: string | null;
    degree: string | null;
    university: string | null;
    graduationYear: string | null;
    [key: string]: any;
  } | null;
  confidence: number;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Client helper for Member 3's NestJS backend to call Member 4's Document Extraction Service
 */
export class DocumentExtractionClient {
  private serviceUrl: string;

  constructor(serviceUrl: string = process.env.EXTRACTION_SERVICE_URL || 'http://localhost:3001') {
    this.serviceUrl = serviceUrl;
  }

  /**
   * Calls the Document Intelligence extraction service
   */
  async extractDocument(params: {
    documentId: string;
    documentUrl: string;
    documentType?: string;
  }): Promise<ExtractedDocumentResult> {
    const response = await axios.post<ExtractedDocumentResult>(
      `${this.serviceUrl}/api/v1/document-extraction/extract`,
      {
        documentId: params.documentId,
        documentUrl: params.documentUrl,
        documentType: params.documentType,
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }
}
