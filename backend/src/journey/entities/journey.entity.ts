import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from '../../applicants/entities/applicant.entity';
import { JourneyStage } from '../../common/enums';

@Entity('journeys')
export class Journey {
  @PrimaryColumn('uuid')
  applicantId: string;

  @OneToOne(() => Applicant, (applicant) => applicant.journey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: Applicant;

  @Column({
    type: 'enum',
    enum: JourneyStage,
    default: JourneyStage.STARTED,
  })
  currentStage: JourneyStage;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'varchar', length: 50, default: 'IN_PROGRESS' })
  status: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
