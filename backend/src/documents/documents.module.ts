import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Applicant } from '../applicants/entities/applicant.entity';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';
import {
  DocumentsController,
  ApplicantDocumentsController,
} from './documents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Applicant])],
  controllers: [DocumentsController, ApplicantDocumentsController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService, StorageService, TypeOrmModule],
})
export class DocumentsModule {}
