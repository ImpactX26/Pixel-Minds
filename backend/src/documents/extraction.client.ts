import {
  Injectable,
  Logger,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DocumentExtractionRequest {
  documentId: string;
  documentUrl: string;
  documentType: string;
}

export interface DocumentExtractionResponse {
  documentId: string;
  documentType: string;
  status: string;
  extractedData: Record<string, any>;
  confidence?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class DocumentExtractionClient {
  private readonly logger = new Logger(DocumentExtractionClient.name);
  private readonly serviceUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const rawUrl =
      this.configService.get<string>('DOCUMENT_EXTRACTION_SERVICE_URL') ||
      'http://localhost:3001';
    // Strip trailing slash if present
    this.serviceUrl = rawUrl.replace(/\/+$/, '');
    this.timeoutMs =
      parseInt(
        this.configService.get<string>('DOCUMENT_EXTRACTION_TIMEOUT_MS') || '30000',
        10,
      ) || 30000;
  }

  async extractDocument(
    request: DocumentExtractionRequest,
  ): Promise<DocumentExtractionResponse> {
    const endpoint = `${this.serviceUrl}/api/v1/document-extraction/extract`;
    this.logger.log(
      `Sending document ${request.documentId} (${request.documentType}) to extraction service at ${endpoint}`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          documentId: request.documentId,
          documentUrl: request.documentUrl,
          documentType: request.documentType,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (err) {
        responseData = null;
      }

      if (!response.ok) {
        const errorDetail =
          responseData?.message ||
          responseData?.error ||
          `HTTP ${response.status} ${response.statusText}`;
        this.logger.error(
          `Extraction service returned error status ${response.status}: ${errorDetail}`,
        );
        throw new BadGatewayException(
          `Document extraction service failed with status ${response.status}: ${errorDetail}`,
        );
      }

      this.logger.log(
        `Received successful extraction response for document ${request.documentId}`,
      );
      return responseData as DocumentExtractionResponse;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError' || error.code === 20) {
        this.logger.error(
          `Extraction service request timed out after ${this.timeoutMs}ms for document ${request.documentId}`,
        );
        throw new GatewayTimeoutException(
          `Document extraction service timed out after ${this.timeoutMs}ms`,
        );
      }

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('fetch failed')
      ) {
        this.logger.error(
          `Extraction service is unavailable at ${this.serviceUrl}: ${error.message}`,
        );
        throw new ServiceUnavailableException(
          `Document extraction service is unavailable at ${this.serviceUrl}`,
        );
      }

      // Re-throw NestJS HTTP exceptions as-is
      if (error instanceof BadGatewayException || error instanceof GatewayTimeoutException || error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error calling extraction service: ${error.message}`,
        error.stack,
      );
      throw new BadGatewayException(
        `Document extraction service communication error: ${error.message}`,
      );
    }
  }
}
