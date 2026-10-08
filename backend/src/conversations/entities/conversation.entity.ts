import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Applicant } from '../../applicants/entities/applicant.entity';
import { ConversationChannel, MessageSender } from '../../common/enums';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  applicantId: string;

  @ManyToOne(() => Applicant, (applicant) => applicant.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: Applicant;

  @Column({
    type: 'enum',
    enum: ConversationChannel,
    default: ConversationChannel.WEB,
  })
  channel: ConversationChannel;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: MessageSender,
    default: MessageSender.APPLICANT,
  })
  sender: MessageSender;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
