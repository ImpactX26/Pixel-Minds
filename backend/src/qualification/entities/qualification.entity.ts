import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from '../../applicants/entities/applicant.entity';
import { QualificationStatus } from '../../common/enums';

@Entity('qualifications')
export class Qualification {
  @PrimaryColumn('uuid')
  applicantId: string;

  @OneToOne(() => Applicant, (applicant) => applicant.qualification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: Applicant;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  requirements: Array<Record<string, any>>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  completedRequirements: Array<Record<string, any>>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  missingRequirements: Array<Record<string, any>>;

  @Column({
    type: 'enum',
    enum: QualificationStatus,
    default: QualificationStatus.PENDING,
  })
  status: QualificationStatus;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
