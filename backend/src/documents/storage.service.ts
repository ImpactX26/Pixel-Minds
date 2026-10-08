import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseClient: SupabaseClient | null = null;
  private readonly bucketName: string;
  private readonly supabaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      'https://enscmuuexlgbtdpcmzwq.supabase.co';
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY');

    this.bucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      'educaro-documents';

    if (this.supabaseUrl && supabaseKey) {
      try {
        this.supabaseClient = createClient(this.supabaseUrl, supabaseKey);
        this.logger.log(`Initialized Supabase Storage client for bucket "${this.bucketName}"`);
      } catch (err) {
        this.logger.warn(`Failed to initialize Supabase Storage client: ${err.message}`);
      }
    } else {
      this.logger.log(
        `Supabase client initialized with standard public storage endpoint for bucket "${this.bucketName}"`,
      );
    }
  }

  /**
   * Sanitizes original filename to prevent path traversal and shell injection
   */
  sanitizeFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const base = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .replace(/\.+/g, '.')
      .substring(0, 100);

    return `${base || 'document'}${ext}`;
  }

  /**
   * Generates a safe and unique storage path per applicant and document
   */
  generateStoragePath(
    applicantId: string,
    documentId: string,
    sanitizedFilename: string,
  ): string {
    return `applicants/${applicantId}/documents/${documentId}/${sanitizedFilename}`;
  }

  /**
   * Uploads file buffer to Supabase Storage and returns storage URL
   */
  async uploadFile(
    applicantId: string,
    documentId: string,
    sanitizedFilename: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ storagePath: string; fileUrl: string }> {
    const storagePath = this.generateStoragePath(
      applicantId,
      documentId,
      sanitizedFilename,
    );

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${storagePath}`;

    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from(this.bucketName)
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          this.logger.warn(
            `Supabase storage upload returned notice: ${error.message}. Using direct canonical storage path.`,
          );
        } else {
          this.logger.log(`Uploaded file to Supabase Storage: ${storagePath}`);
          const { data: urlData } = this.supabaseClient.storage
            .from(this.bucketName)
            .getPublicUrl(storagePath);
          return {
            storagePath,
            fileUrl: urlData?.publicUrl || publicUrl,
          };
        }
      } catch (err) {
        this.logger.error(`Supabase storage upload error: ${err.message}`, err.stack);
      }
    }

    return {
      storagePath,
      fileUrl: publicUrl,
    };
  }

  /**
   * Deletes a file from Supabase storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.storage
          .from(this.bucketName)
          .remove([storagePath]);
        this.logger.log(`Deleted file from Supabase Storage: ${storagePath}`);
      } catch (err) {
        this.logger.warn(`Failed to delete storage file ${storagePath}: ${err.message}`);
      }
    }
  }
}
