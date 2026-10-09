import { NextActionResult } from '../../next-action/interfaces/next-action.interface';

export type AiIntent =
  | 'GET_STATUS'
  | 'GET_DOCUMENTS'
  | 'GET_MISSING_DOCUMENTS'
  | 'GET_DOCUMENT_STATUS'
  | 'GET_QUALIFICATION'
  | 'GET_NEXT_ACTION'
  | 'GET_PROFILE'
  | 'UPDATE_PROFILE'
  | 'UPLOAD_DOCUMENT'
  | 'GENERAL_QUERY'
  | 'UNKNOWN';

export interface ApplicantContextSnapshot {
  applicantId: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    country: string;
    goal?: string | null;
  };
  requirement: RequirementData;
  profile: ProfileData;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    uploadedAt?: string | Date;
    extractedFields?: Record<string, any>;
    verificationResult?: {
      overallStatus?: string;
      clarificationRequired?: boolean;
      clarificationMessage?: string | null;
      fieldMismatches?: Array<{ field: string; profileValue: any; documentValue: any }>;
      fields?: Array<any>;
    };
  }>;
  missingDocuments: string[];
  qualification: {
    status: string;
    satisfied: number;
    totalRequirements: number;
    missingCount: number;
    conflicts: number;
    requirements: Array<{ code: string; title: string; status: string; reason?: string }>;
  };
  nextAction: {
    title: string;
    action?: string;
    reason?: string;
    priority?: string;
    requirementCode?: string;
  } | null;
  journey: {
    currentStage: string;
    progress: number;
  };
  cv: {
    hasCv: boolean;
    isApproved: boolean;
    summary?: string;
  };
}

export interface RequirementData {
  country?: string | null;
  role?: string | null;
  company?: string | null;
  [key: string]: any;
}

export interface ProfilePersonal {
  fullName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  [key: string]: any;
}

export interface ProfileEducation {
  degree?: string | null;
  field?: string | null;
  institution?: string | null;
  graduationYear?: number | string | null;
  [key: string]: any;
}

export interface ProfileEmployment {
  company?: string | null;
  jobTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  experience?: string | null;
  [key: string]: any;
}

export interface ProfileSkills {
  technicalSkills?: string[];
  otherSkills?: string[];
  [key: string]: any;
}

export interface ProfileLanguage {
  language: string;
  proficiency?: string | null;
  level?: string | null;
}

export interface ProfileData {
  personal?: ProfilePersonal;
  education?: ProfileEducation;
  employment?: ProfileEmployment;
  skills?: ProfileSkills;
  languages?: ProfileLanguage[];
  [key: string]: any;
}

export interface ChatResponse {
  applicantId: string;
  message: string;
  intent?: AiIntent;
  stage?: string;
  goalType?: string;
  requirement?: RequirementData;
  profile?: ProfileData;
  missingInformation?: string[];
  nextAction?: {
    action: string;
    title: string;
    priority: string;
    status?: string;
    reason?: string;
    requirementCode?: string;
  } | string | null;
  metadata?: Record<string, any>;
}
