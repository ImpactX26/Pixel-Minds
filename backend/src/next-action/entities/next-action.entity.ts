import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Applicant } from '../../applicants/entities/applicant.entity';
import { ActionPriority, ActionStatus } from '../../common/enums';

@Entity('next_actions')
export class NextAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  applicantId: string;

  @ManyToOne(() => Applicant, (applicant) => applicant.nextActions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: Applicant;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: ActionPriority,
    default: ActionPriority.MEDIUM,
  })
  priority: ActionPriority;

  @Column({
    type: 'enum',
    enum: ActionStatus,
    default: ActionStatus.PENDING,
  })
  status: ActionStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
