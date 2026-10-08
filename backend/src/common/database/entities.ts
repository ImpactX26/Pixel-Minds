import { Applicant } from '../../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../../profile/entities/applicant-profile.entity';
import { Journey } from '../../journey/entities/journey.entity';
import { Document } from '../../documents/entities/document.entity';
import { Qualification } from '../../qualification/entities/qualification.entity';
import { NextAction } from '../../next-action/entities/next-action.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

export const entities = [
  Applicant,
  ApplicantProfile,
  Journey,
  Document,
  Qualification,
  NextAction,
  Conversation,
];

export {
  Applicant,
  ApplicantProfile,
  Journey,
  Document,
  Qualification,
  NextAction,
  Conversation,
};
