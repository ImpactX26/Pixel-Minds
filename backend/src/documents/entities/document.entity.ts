import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Applicant } from '../../applicants/entities/applicant.entity';
import { DocumentStatus } from '../../common/enums';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  applicantId: string;

  @ManyToOne(() => Applicant, (applicant) => applicant.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: Applicant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  fileUrl: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  extractedData: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  uploadedAt: Date;
}
