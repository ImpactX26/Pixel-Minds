import { Injectable } from '@nestjs/common';
import { AiIntent } from '../interfaces/ai-chat.interface';

@Injectable()
export class IntentDetectorService {
  /**
   * Deterministically classifies the user's message intent using rule-based pattern matching.
   */
  detectIntent(message: string): AiIntent {
    if (!message || typeof message !== 'string') {
      return 'UNKNOWN';
    }

    const text = message.toLowerCase().trim();

    // 1. Missing Documents pattern
    if (
      (text.includes('document') || text.includes('doc') || text.includes('passport') || text.includes('certificate')) &&
      (text.includes('miss') || text.includes('need') || text.includes('require') || text.includes('left') || text.includes('pending'))
    ) {
      return 'GET_MISSING_DOCUMENTS';
    }
    if (text.includes('what documents') || text.includes('missing documents') || text.includes('missing document') || text.includes('which documents')) {
      return 'GET_MISSING_DOCUMENTS';
    }

    // 2. Next Action pattern
    if (
      text.includes('what should i do') ||
      text.includes('what do i do') ||
      text.includes('what to do') ||
      text.includes('what next') ||
      text.includes('next action') ||
      text.includes('next step') ||
      text.includes('suggest action')
    ) {
      return 'GET_NEXT_ACTION';
    }

    // 3. Qualification pattern
    if (
      text.includes('qualif') ||
      text.includes('eligible') ||
      text.includes('eligibility') ||
      text.includes('meet requirement') ||
      text.includes('am i ready')
    ) {
      return 'GET_QUALIFICATION';
    }

    // 4. Status pattern
    if (
      text.includes('status') ||
      text.includes('progress') ||
      text.includes('where am i') ||
      text.includes('stage') ||
      text.includes('overview') ||
      text.includes('how is my application')
    ) {
      return 'GET_STATUS';
    }

    // 5. Profile pattern
    if (
      text.includes('profile') ||
      text.includes('my detail') ||
      text.includes('my info') ||
      text.includes('personal info') ||
      text.includes('who am i') ||
      text.includes('about me')
    ) {
      return 'GET_PROFILE';
    }

    // 6. Upload Document instruction
    if (
      text.includes('how to upload') ||
      text.includes('how do i upload') ||
      text.includes('where to upload')
    ) {
      return 'UPLOAD_DOCUMENT';
    }

    return 'UNKNOWN';
  }
}
