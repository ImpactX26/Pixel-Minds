import { ActionPriority, ActionStatus, NextActionType } from '../../common/enums';

export interface NextActionResult {
  id?: string;
  applicantId?: string;
  action: NextActionType | string;
  title: string;
  reason: string;
  priority: ActionPriority;
  status: ActionStatus;
  requirementCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
