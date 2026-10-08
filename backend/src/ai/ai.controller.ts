import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiOrchestrator } from './ai.orchestrator';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponse, RequirementData, ProfileData } from './interfaces/ai-chat.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiOrchestrator: AiOrchestrator) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() chatRequestDto: ChatRequestDto): Promise<ChatResponse> {
    return this.aiOrchestrator.processChat(chatRequestDto);
  }

  @Post('voice')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async voice(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { applicantId?: string; audioBase64?: string; mimeType?: string },
  ): Promise<any> {
    let fileBuffer = file?.buffer;
    const fileName = file?.originalname || 'voice_recording.webm';
    const mimeType = file?.mimetype || body?.mimeType || 'audio/webm';

    if (!fileBuffer && body?.audioBase64) {
      fileBuffer = Buffer.from(body.audioBase64, 'base64');
    }

    return this.aiOrchestrator.processVoiceChat({
      applicantId: body?.applicantId,
      fileBuffer,
      fileName,
      mimeType,
    });
  }

  @Get('requirements/:applicantId')
  async getRequirements(@Param('applicantId') applicantId: string): Promise<RequirementData> {
    return this.aiOrchestrator.getRequirement(applicantId);
  }

  @Get('requirements')
  async getDefaultRequirements(): Promise<RequirementData> {
    return this.aiOrchestrator.getRequirement('default');
  }

  @Get('profile/:applicantId')
  async getProfile(@Param('applicantId') applicantId: string): Promise<ProfileData> {
    return this.aiOrchestrator.getProfile(applicantId);
  }

  @Get('profile')
  async getDefaultProfile(): Promise<ProfileData> {
    return this.aiOrchestrator.getProfile('default');
  }
}

