import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { MessageSender } from '../common/enums';
import { resolveApplicantUuid } from '../common/utils/uuid.util';

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
    const applicantUuid = resolveApplicantUuid(applicantId);
    const list = ConversationsService.memoryStore.get(applicantId) || ConversationsService.memoryStore.get(applicantUuid) || [];
    const newMsg: FormattedChatMessage = {
      id: String(Date.now() + Math.random()),
      role,
      text,
      createdAt: new Date(),
    };
    list.push(newMsg);
    ConversationsService.memoryStore.set(applicantId, list);
    ConversationsService.memoryStore.set(applicantUuid, list);
  }

  /**
   * Retrieves conversation history for an applicant formatted for the frontend ChatPanel.
   */
  async getHistory(applicantId: string = 'default'): Promise<FormattedChatMessage[]> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    try {
      const conversations = await this.conversationRepository.find({
        where: [{ applicantId: applicantUuid }],
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
    return ConversationsService.memoryStore.get(applicantId) || ConversationsService.memoryStore.get(applicantUuid) || [];
  }

  /**
   * Clears conversation history for the specified applicant only.
   */
  async clearHistory(applicantId: string = 'default'): Promise<void> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    
    // 1. Clear in-memory caches
    ConversationsService.memoryStore.delete(applicantId);
    ConversationsService.memoryStore.delete(applicantUuid);

    // 2. Clear database conversation records scoped strictly to this applicant
    try {
      await this.conversationRepository.delete({ applicantId: applicantUuid });
    } catch (err) {
      this.logger.debug(`DB clear notice for applicant ${applicantId}: ${err.message}`);
    }

    this.logger.log(`Cleared conversation history for applicant ${applicantId} (${applicantUuid})`);
  }
}
