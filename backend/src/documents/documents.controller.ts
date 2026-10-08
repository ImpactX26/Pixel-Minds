import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.uploadDocument(uploadDocumentDto, file);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentsService.findById(id);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  async process(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentsService.processDocument(id);
  }
}

@Controller('applicants/:id/documents')
export class ApplicantDocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getApplicantDocuments(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.documentsService.findByApplicantId(id);
  }
}
