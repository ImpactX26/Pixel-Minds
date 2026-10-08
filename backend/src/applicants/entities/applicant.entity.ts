import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ApplicantProfile } from '../../profile/entities/applicant-profile.entity';
import { Journey } from '../../journey/entities/journey.entity';
import { Document } from '../../documents/entities/document.entity';
import { Qualification } from '../../qualification/entities/qualification.entity';
import { NextAction } from '../../next-action/entities/next-action.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

@Entity('applicants')
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  goal: string;

  @OneToOne(() => ApplicantProfile, (profile) => profile.applicant, { cascade: true })
  profile: ApplicantProfile;

  @OneToOne(() => Journey, (journey) => journey.applicant, { cascade: true })
  journey: Journey;

  @OneToOne(() => Qualification, (qualification) => qualification.applicant, { cascade: true })
  qualification: Qualification;

  @OneToMany(() => Document, (document) => document.applicant, { cascade: true })
  documents: Document[];

  @OneToMany(() => NextAction, (action) => action.applicant, { cascade: true })
  nextActions: NextAction[];

  @OneToMany(() => Conversation, (conversation) => conversation.applicant, { cascade: true })
  conversations: Conversation[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
