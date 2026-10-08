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
import { StorageService } from './storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly maxFileSizeMb: number;

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSizeMb =
      parseInt(this.configService.get<string>('MAX_FILE_SIZE_MB') || '10', 10) || 10;
  }

  private async ensureApplicantExists(applicantId: string): Promise<void> {
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId },
    });
    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }
  }

  async uploadDocument(
    uploadDocumentDto: UploadDocumentDto,
    file?: Express.Multer.File,
  ): Promise<Document> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

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

    if (!isMimeValid || !isExtValid) {
      throw new BadRequestException(
        `Unsupported file type "${ext || mime}". Allowed types are: PDF, JPG, JPEG, PNG`,
      );
    }

    // 3. Validate Applicant Existence
    await this.ensureApplicantExists(uploadDocumentDto.applicantId);

    // 4. Generate Document ID & Sanitize Filename
    const documentId = uuidv4();
    const sanitizedFilename = this.storageService.sanitizeFilename(file.originalname);

    // 5. Upload File to Supabase Storage
    const { fileUrl } = await this.storageService.uploadFile(
      uploadDocumentDto.applicantId,
      documentId,
      sanitizedFilename,
      file.buffer,
      file.mimetype,
    );

    // 6. Create Document Record in PostgreSQL
    const document = this.documentRepository.create({
      id: documentId,
      applicantId: uploadDocumentDto.applicantId,
      name: sanitizedFilename,
      type: uploadDocumentDto.type || 'GENERAL_DOCUMENT',
      status: DocumentStatus.UPLOADED,
      fileUrl,
      extractedData: {},
    });

    const saved = await this.documentRepository.save(document);
    this.logger.log(
      `Created document record ${saved.id} (${saved.name}) for applicant ${saved.applicantId}`,
    );

    return saved;
  }

  async findByApplicantId(applicantId: string): Promise<Document[]> {
    await this.ensureApplicantExists(applicantId);

    return this.documentRepository.find({
      where: { applicantId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    return document;
  }

  async processDocument(id: string) {
    const document = await this.findById(id);

    // Transition status to PROCESSING
    document.status = DocumentStatus.PROCESSING;
    const updated = await this.documentRepository.save(document);

    this.logger.log(`Document ${id} status updated to PROCESSING`);

    return {
      documentId: updated.id,
      applicantId: updated.applicantId,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      message: 'Document queued for processing',
    };
  }
}
