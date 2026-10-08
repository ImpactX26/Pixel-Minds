import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Applicant } from '../../applicants/entities/applicant.entity';

@Entity('applicant_profiles')
export class ApplicantProfile {
  @PrimaryColumn('uuid')
  applicantId: string;

  @OneToOne(() => Applicant, (applicant) => applicant.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: Applicant;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  education: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  experience: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  languages: Array<{ language: string; level: string }>;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  workExperience: Array<Record<string, any>>;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  additionalInfo: Record<string, any>;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
