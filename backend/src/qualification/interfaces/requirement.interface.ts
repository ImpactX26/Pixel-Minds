import { RequirementStatus, QualificationStatus } from '../../common/enums';

export type RequirementCategory = 'PROFILE' | 'EDUCATION' | 'DOCUMENTS' | 'LANGUAGE';

export interface RequirementDefinition {
  code: string;
  title: string;
  description: string;
  category: RequirementCategory;
  required: boolean;
}

export interface EvaluatedRequirement extends RequirementDefinition {
  status: RequirementStatus;
  reason: string;
  details?: Record<string, any>;
  confidence?: number;
}

export interface QualificationEvaluationSummary {
  applicantId: string;
  status: string; // 'QUALIFIED' | 'INCOMPLETE' | 'CONFLICT' | 'PENDING'
  qualificationStatus: QualificationStatus;
  totalRequirements: number;
  satisfied: number;
  missing: number;
  incomplete: number;
  conflicts: number;
  pendingVerification: number;
  completedRequirements: EvaluatedRequirement[];
  missingRequirements: EvaluatedRequirement[];
  requirements: EvaluatedRequirement[];
  updatedAt?: Date | string;
}
