import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';
import { DocumentExtractionClient } from './extraction.client';
import {
  DocumentsController,
  ApplicantDocumentsController,
} from './documents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Applicant])],
  controllers: [DocumentsController, ApplicantDocumentsController],
  providers: [DocumentsService, StorageService, DocumentExtractionClient],
  exports: [DocumentsService, StorageService, DocumentExtractionClient, TypeOrmModule],
})
export class DocumentsModule {}
