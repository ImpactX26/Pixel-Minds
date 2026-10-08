import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  async findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  async process(
    @Param('id') id: string,
    @Body() body?: { rawText?: string },
  ) {
    return this.documentsService.processDocument(id, body?.rawText);
  }

  @Get(':id/verification')
  @HttpCode(HttpStatus.OK)
  async getVerification(@Param('id') id: string) {
    return this.documentsService.getVerificationResult(id);
  }

  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  async getStatus(@Param('id') id: string) {
    return this.documentsService.getDocumentStatus(id);
  }
}

@Controller('applicants/:id/documents')
export class ApplicantDocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getApplicantDocuments(@Param('id') id: string) {
    return this.documentsService.findByApplicantId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadApplicantDocument(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const uploadDto: UploadDocumentDto = {
      applicantId: id,
      type: body?.type,
      rawText: body?.rawText,
    };
    return this.documentsService.uploadDocument(uploadDto, file);
  }
}
