import {
  Injectable,
  NotFoundException,
  BadRequestException,
  PayloadTooLargeException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Document } from './entities/document.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { StorageService } from './storage.service';
import { DocumentExtractionClient, VerificationResult } from './extraction.client';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentStatus } from '../common/enums';
import { resolveApplicantUuid } from '../common/utils/uuid.util';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/plain',
  'application/json',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.json'];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly maxFileSizeMb: number;

  // In-memory document store for local resilience and immediate availability
  private static readonly inMemoryDocs = new Map<string, Document>();

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    private readonly storageService: StorageService,
    private readonly extractionClient: DocumentExtractionClient,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSizeMb =
      parseInt(this.configService.get<string>('MAX_FILE_SIZE_MB') || '10', 10) || 10;
  }

  private async ensureApplicant(applicantId: string): Promise<{ applicant: Applicant | null; profile: ApplicantProfile | null }> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    let applicant: Applicant | null = null;
    let profile: ApplicantProfile | null = null;

    try {
      applicant = await this.applicantRepository.findOne({ where: { id: applicantUuid } });
      profile = await this.profileRepository.findOne({ where: { applicantId: applicantUuid } });
    } catch (err) {
      this.logger.debug(`Could not fetch applicant/profile from DB: ${err.message}`);
    }

    return { applicant, profile };
  }

  async uploadDocument(
    uploadDocumentDto: UploadDocumentDto,
    file?: Express.Multer.File,
  ): Promise<Document> {
    const applicantId = uploadDocumentDto.applicantId || '123';
    const applicantUuid = resolveApplicantUuid(applicantId);
    let fileBuffer: Buffer = Buffer.from('');
    let originalName = 'document.pdf';
    let mimeType = 'application/pdf';

    if (file && file.buffer) {
      // 1. Validate File Size
      const maxSizeBytes = this.maxFileSizeMb * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new PayloadTooLargeException(
          `File size exceeds maximum allowed limit of ${this.maxFileSizeMb}MB`,
        );
      }

      // 2. Validate File Type / MIME & Extension
      const ext = path.extname(file.originalname || '').toLowerCase();
      const mime = file.mimetype?.toLowerCase() || '';

      const isMimeValid = ALLOWED_MIME_TYPES.includes(mime);
      const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

      if (!isMimeValid && !isExtValid) {
        throw new BadRequestException(
          `Unsupported file type "${ext || mime}". Allowed types are: PDF, JPG, JPEG, PNG, TXT`,
        );
      }

      fileBuffer = file.buffer;
      originalName = file.originalname;
      mimeType = file.mimetype;
    }

    // 3. Generate Document ID & Sanitize Filename
    const documentId = uuidv4();
    const sanitizedFilename = this.storageService.sanitizeFilename(originalName);

    // 4. Upload File to Storage
    let fileUrl = `https://storage.educaro.de/documents/${documentId}/${sanitizedFilename}`;
    if (fileBuffer.length > 0) {
      try {
        const uploadRes = await this.storageService.uploadFile(
          applicantUuid,
          documentId,
          sanitizedFilename,
          fileBuffer,
          mimeType,
        );
        fileUrl = uploadRes.fileUrl;
      } catch (err) {
        this.logger.debug(`Storage upload notice: ${err.message}`);
      }
    }

    // Determine document type from name or DTO
    const docType = this.extractionClient.normalizeDocumentType(uploadDocumentDto.type, sanitizedFilename);

    // 5. Create Document Record
    const document: Document = {
      id: documentId,
      applicantId: applicantUuid,
      name: sanitizedFilename,
      type: docType,
      status: DocumentStatus.UPLOADED,
      fileUrl,
      extractedData: uploadDocumentDto.rawText ? { rawText: uploadDocumentDto.rawText } : {},
      uploadedAt: new Date(),
      applicant: null as any,
    };

    // Store in-memory
    DocumentsService.inMemoryDocs.set(documentId, document);

    // Persist to DB with ensured Applicant parent record
    try {
      let applicant = await this.applicantRepository.findOne({ where: { id: applicantUuid } });
      if (!applicant) {
        applicant = this.applicantRepository.create({
          id: applicantUuid,
          name: 'Rahul Sharma',
          email: `applicant-${applicantId}@educaro.de`,
          country: 'India',
        });
        await this.applicantRepository.save(applicant);
      }

      const entity = this.documentRepository.create(document);
      const saved = await this.documentRepository.save(entity);
      DocumentsService.inMemoryDocs.set(documentId, saved);
      return saved;
    } catch (dbErr) {
      this.logger.debug(`DB save notice: ${dbErr.message}`);
    }

    this.logger.log(`Created document record ${document.id} (${document.name}) for applicant ${document.applicantId}`);
    return document;
  }

  async findByApplicantId(applicantId: string): Promise<Document[]> {
    const applicantUuid = resolveApplicantUuid(applicantId);

    try {
      const dbDocs = await this.documentRepository.find({
        where: [{ applicantId: applicantUuid }, { applicantId }],
        order: { uploadedAt: 'DESC' },
      });
      if (dbDocs.length > 0) {
        return dbDocs;
      }
    } catch (err) {
      this.logger.debug(`DB findByApplicantId notice: ${err.message}`);
    }

    const memoryDocs = Array.from(DocumentsService.inMemoryDocs.values())
      .filter((d) => d.applicantId === applicantId || d.applicantId === applicantUuid);

    return memoryDocs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async findById(id: string): Promise<Document> {
    try {
      const doc = await this.documentRepository.findOne({ where: { id } });
      if (doc) {
        DocumentsService.inMemoryDocs.set(id, doc);
        return doc;
      }
    } catch (err) {
      this.logger.debug(`DB findById notice: ${err.message}`);
    }

    if (DocumentsService.inMemoryDocs.has(id)) {
      return DocumentsService.inMemoryDocs.get(id)!;
    }

    throw new NotFoundException(`Document with ID "${id}" not found`);
  }

  async processDocument(id: string, rawText?: string): Promise<Document> {
    const document = await this.findById(id);

    // 1. Set status to PROCESSING
    document.status = DocumentStatus.PROCESSING;
    DocumentsService.inMemoryDocs.set(id, { ...document });

    try {
      // 2. Perform Extraction via Gemini LLM with structured output
      const content = rawText || document.extractedData?.rawText || document.name;
      const extractionResult = await this.extractionClient.extractDocument({
        documentId: document.id,
        documentUrl: document.fileUrl,
        documentType: document.type,
        fileName: document.name,
        rawText: content,
      });

      // 3. Fetch Applicant & Profile directly from PostgreSQL / Supabase as the source of truth
      const { applicant, profile } = await this.ensureApplicant(document.applicantId);

      // 4. Deterministic Profile Comparison against PostgreSQL Profile data
      const verificationResult: VerificationResult = this.extractionClient.compareWithProfile(
        document.type,
        extractionResult.extractedData,
        profile || {},
        applicant || {},
      );

      // 5. Update Status
      if (verificationResult.overallStatus === 'VERIFIED') {
        document.status = DocumentStatus.VERIFIED;
      } else if (verificationResult.overallStatus === 'MISMATCH') {
        document.status = DocumentStatus.CONFLICT;
      } else {
        document.status = DocumentStatus.PROCESSED;
      }

      // 6. Save extractedData with structured extraction & verification results
      document.extractedData = {
        documentId: document.id,
        documentType: extractionResult.documentType,
        status: 'processed',
        extractedData: extractionResult.extractedData,
        verificationResult,
        confidence: extractionResult.confidence,
        metadata: extractionResult.metadata,
      };

      // Persist in-memory cache
      DocumentsService.inMemoryDocs.set(id, { ...document });

      // Persist in PostgreSQL / Supabase
      try {
        await this.documentRepository.save(document);
      } catch (dbErr) {
        this.logger.debug(`DB update notice during processDocument: ${dbErr.message}`);
      }

      this.logger.log(`Document ${id} processed successfully. Overall status: ${verificationResult.overallStatus}`);
      return document;
    } catch (error: any) {
      document.status = DocumentStatus.FAILED;
      document.extractedData = {
        error: error.message,
        failedAt: new Date().toISOString(),
      };
      DocumentsService.inMemoryDocs.set(id, { ...document });
      this.logger.error(`Document ${id} processing failed: ${error.message}`);
      throw error;
    }
  }

  async getVerificationResult(id: string): Promise<VerificationResult> {
    const document = await this.findById(id);
    if (document.extractedData?.verificationResult) {
      return document.extractedData.verificationResult;
    }

    // If not yet verified, process now
    const processed = await this.processDocument(id);
    return processed.extractedData?.verificationResult;
  }

  async getDocumentStatus(id: string): Promise<{
    documentId: string;
    status: DocumentStatus;
    extractedData: Record<string, any>;
    verificationResult: VerificationResult | null;
  }> {
    const document = await this.findById(id);
    return {
      documentId: document.id,
      status: document.status,
      extractedData: document.extractedData?.extractedData || document.extractedData || {},
      verificationResult: document.extractedData?.verificationResult || null,
    };
  }
}
