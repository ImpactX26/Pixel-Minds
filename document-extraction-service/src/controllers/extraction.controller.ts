import { Request, Response } from 'express';
import { DocumentExtractionService } from '../services/document-extraction.service';
import { ExtractionRequestDto } from '../types/extraction.types';

export class ExtractionController {
  private extractionService: DocumentExtractionService;

  constructor(extractionService?: DocumentExtractionService) {
    this.extractionService = extractionService || new DocumentExtractionService();
  }

  /**
   * Main API Endpoint:
   * POST /api/v1/document-extraction/extract
   *
   * Body:
   * {
   *   "documentId": "doc-12345",
   *   "documentUrl": "https://...",
   *   "documentType": "degree_certificate" (optional)
   * }
   */
  extract = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId, documentUrl, documentPath, documentType, base64Data, mimeType } = req.body;

      if (!documentId) {
        res.status(400).json({
          documentId: null,
          status: 'failed',
          extractedData: null,
          confidence: 0,
          error: 'documentId is required in request body',
        });
        return;
      }

      if (!documentUrl && !documentPath && !base64Data) {
        res.status(400).json({
          documentId,
          status: 'failed',
          extractedData: null,
          confidence: 0,
          error: 'Either documentUrl, documentPath, or base64Data must be provided',
        });
        return;
      }

      const requestDto: ExtractionRequestDto = {
        documentId,
        documentUrl,
        documentPath,
        documentType,
        base64Data,
        mimeType,
      };

      const result = await this.extractionService.extractDocumentData(requestDto);

      if (result.status === 'failed') {
        res.status(422).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Unhandled Extraction Controller Error:', error);
      res.status(500).json({
        documentId: req.body?.documentId || 'unknown',
        status: 'failed',
        extractedData: null,
        confidence: 0,
        error: error.message || 'Internal Server Error during extraction',
      });
    }
  };

  /**
   * Testing Endpoint: Direct multipart file upload test
   * POST /api/v1/document-extraction/upload-test
   */
  uploadTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = (req as any).file;
      const documentId = req.body.documentId || `test-upload-${Date.now()}`;
      const documentType = req.body.documentType || 'degree_certificate';

      if (!file) {
        res.status(400).json({
          documentId,
          status: 'failed',
          extractedData: null,
          confidence: 0,
          error: 'No file uploaded in form field "file"',
        });
        return;
      }

      const requestDto: ExtractionRequestDto = {
        documentId,
        base64Data: file.buffer.toString('base64'),
        mimeType: file.mimetype,
        documentType,
      };

      const result = await this.extractionService.extractDocumentData(requestDto);
      res.status(result.status === 'processed' ? 200 : 422).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: 'failed',
        error: error.message || 'File upload test failed',
      });
    }
  };

  /**
   * Demo & Diagnostic Endpoint: Sample Certificate Test
   * GET /api/v1/document-extraction/sample-test
   */
  sampleTest = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Synthetic sample degree certificate text simulation
      const sampleCertificateText = `
        VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI
        KARNATAKA, INDIA
        
        BACHELOR OF ENGINEERING
        
        This is to certify that
        NITHIN N
        
        bearing USN: 1RN22CS099 has been duly admitted to the Degree of
        BACHELOR OF ENGINEERING in COMPUTER SCIENCE AND ENGINEERING
        
        having passed the prescribed examinations held in July 2028.
        Date of Birth: 2008-01-01
        
        Given under the seal of the University on 15th August 2028.
      `;

      const aiManager = (this.extractionService as any).aiManager;
      const aiResult = await aiManager.extractStructuredData(sampleCertificateText, 'degree_certificate');
      
      res.status(200).json({
        documentId: 'sample-degree-001',
        documentType: 'degree_certificate',
        status: 'processed',
        sampleText: sampleCertificateText.trim(),
        extractedData: aiResult.extractedData,
        confidence: 0.96,
        metadata: {
          aiProvider: aiManager.getProviderName(),
          notes: 'Built-in synthetic verification test for instant demo verification.',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'failed',
        error: error.message,
      });
    }
  };
}
