import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { MessageSender } from '../common/enums';

export interface FormattedChatMessage {
  id?: string;
  role: 'user' | 'ai';
  text: string;
  sender?: MessageSender;
  createdAt?: Date;
}

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  private static readonly memoryStore = new Map<string, FormattedChatMessage[]>();

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  /**
   * Records a message in the in-memory store and attempts DB persistence.
   */
  static record(applicantId: string, role: 'user' | 'ai', text: string): void {
    const list = ConversationsService.memoryStore.get(applicantId) || [];
    list.push({
      id: String(Date.now() + Math.random()),
      role,
      text,
      createdAt: new Date(),
    });
    ConversationsService.memoryStore.set(applicantId, list);
  }

  /**
   * Retrieves conversation history for an applicant formatted for the frontend ChatPanel.
   */
  async getHistory(applicantId: string = 'default'): Promise<FormattedChatMessage[]> {
    try {
      const conversations = await this.conversationRepository.find({
        where: { applicantId },
        order: { createdAt: 'ASC' },
      });

      if (conversations && conversations.length > 0) {
        return conversations.map((c) => ({
          id: c.id,
          role: c.sender === MessageSender.AI ? 'ai' : 'user',
          text: c.message,
          sender: c.sender,
          createdAt: c.createdAt,
        }));
      }
    } catch (err) {
      this.logger.debug(`Could not load chat history from DB for applicant ${applicantId}: ${err.message}`);
    }

    // Fallback to in-memory store
    return ConversationsService.memoryStore.get(applicantId) || [];
  }
}
