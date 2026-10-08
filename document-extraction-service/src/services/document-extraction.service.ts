import { DocumentLoaderService } from './document-loader.service';
import { OcrManagerService } from './ocr/ocr-manager.service';
import { AiManagerService } from './ai/ai-manager.service';
import { ConfidenceEvaluatorService } from './confidence-evaluator.service';
import {
  ExtractionRequestDto,
  ExtractionResponseDto,
  ExtractedDataSchema,
} from '../types/extraction.types';

export class DocumentExtractionService {
  private documentLoader: DocumentLoaderService;
  private ocrManager: OcrManagerService;
  private aiManager: AiManagerService;
  private confidenceEvaluator: ConfidenceEvaluatorService;

  constructor(
    documentLoader?: DocumentLoaderService,
    ocrManager?: OcrManagerService,
    aiManager?: AiManagerService,
    confidenceEvaluator?: ConfidenceEvaluatorService
  ) {
    this.documentLoader = documentLoader || new DocumentLoaderService();
    this.ocrManager = ocrManager || new OcrManagerService();
    this.aiManager = aiManager || new AiManagerService();
    this.confidenceEvaluator = confidenceEvaluator || new ConfidenceEvaluatorService();
  }

  /**
   * Main Document Extraction Pipeline:
   * Existing Document -> documentId -> Retrieve/Access -> Detect Type ->
   * PDF/Image Processing -> OCR Text Extraction -> AI Structured Extraction ->
   * Schema Validation -> Confidence Evaluation -> Return Result linked to documentId
   */
  async extractDocumentData(request: ExtractionRequestDto): Promise<ExtractionResponseDto> {
    const startTime = Date.now();
    const documentId = request.documentId || 'unknown-doc';

    console.log(`\n📄 [Extraction Pipeline] Started for documentId: "${documentId}"`);

    try {
      if (!request.documentId) {
        throw new Error('Missing required field: "documentId" must be provided.');
      }

      // Step 1: Retrieve & Load document
      console.log(`📥 [Extraction Pipeline] Loading document for id: ${documentId}`);
      const loadedDoc = await this.documentLoader.loadDocument(request);
      console.log(`✅ [Extraction Pipeline] Document loaded (${loadedDoc.mimeType}, ${loadedDoc.buffer.length} bytes)`);

      // Step 2: OCR / Document Processing
      console.log(`🔍 [Extraction Pipeline] Running OCR/Text extraction...`);
      const ocrResult = await this.ocrManager.processDocument(loadedDoc.buffer, loadedDoc.mimeType);
      console.log(`✅ [Extraction Pipeline] OCR completed (${ocrResult.method}, ${ocrResult.characterCount} chars)`);

      // Step 3: AI Structured Extraction
      console.log(`🤖 [Extraction Pipeline] Extracting structured data via AI (${this.aiManager.getProviderName()})...`);
      const aiResult = await this.aiManager.extractStructuredData(ocrResult.text, request.documentType);
      
      // Step 4: Schema Validation
      const validatedData = ExtractedDataSchema.parse(aiResult.extractedData);
      console.log(`✅ [Extraction Pipeline] Schema validated successfully.`);

      // Step 5: Confidence Calculation
      const confidence = this.confidenceEvaluator.evaluateConfidence(
        ocrResult,
        validatedData,
        aiResult.aiConfidence
      );
      console.log(`📊 [Extraction Pipeline] Extraction confidence: ${confidence}`);

      const processingTimeMs = Date.now() - startTime;

      // Final Structured Response linked to documentId
      const response: ExtractionResponseDto = {
        documentId: request.documentId,
        documentType: aiResult.detectedDocumentType || request.documentType || 'degree_certificate',
        status: 'processed',
        extractedData: validatedData,
        confidence,
        metadata: {
          ocrMethod: ocrResult.method,
          aiProvider: this.aiManager.getProviderName(),
          processingTimeMs,
          charCount: ocrResult.characterCount,
          extractedAt: new Date().toISOString(),
        },
      };

      console.log(`🎉 [Extraction Pipeline] Successfully processed document "${documentId}" in ${processingTimeMs}ms\n`);
      return response;
    } catch (error: any) {
      console.error(`❌ [Extraction Pipeline] Failed for documentId "${documentId}":`, error.message || error);

      return {
        documentId: request.documentId || 'unknown',
        status: 'failed',
        extractedData: null,
        confidence: 0,
        error: error.message || 'Unknown extraction error occurred',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          extractedAt: new Date().toISOString(),
        },
      };
    }
  }
}
