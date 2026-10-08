import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController, DirectChatController } from './conversations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  controllers: [ConversationsController, DirectChatController],
  providers: [ConversationsService],
  exports: [TypeOrmModule, ConversationsService],
})
export class ConversationsModule {}

