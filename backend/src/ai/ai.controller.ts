import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiOrchestrator } from './ai.orchestrator';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponse } from './interfaces/ai-chat.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiOrchestrator: AiOrchestrator) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() chatRequestDto: ChatRequestDto): Promise<ChatResponse> {
    return this.aiOrchestrator.processChat(chatRequestDto);
  }
}
