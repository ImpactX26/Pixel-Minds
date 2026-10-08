import { NextActionResult } from '../../next-action/interfaces/next-action.interface';

export type AiIntent =
  | 'GET_STATUS'
  | 'GET_MISSING_DOCUMENTS'
  | 'GET_QUALIFICATION'
  | 'GET_NEXT_ACTION'
  | 'GET_PROFILE'
  | 'UPLOAD_DOCUMENT'
  | 'UNKNOWN';

export interface ChatResponse {
  applicantId: string;
  message: string;
  intent: AiIntent;
  nextAction?: {
    action: string;
    title: string;
    priority: string;
    status?: string;
    reason?: string;
    requirementCode?: string;
  } | null;
  metadata?: Record<string, any>;
}
