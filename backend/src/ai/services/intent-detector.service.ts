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

    // 1. Explicit Profile Update pattern (e.g. "Update my name as Rahul Sharma", "Change my name to Rahul Sharma", "Add German B1 to my languages")
    if (
      /\b(update|change|modify|set|correct|edit|add|fix)\b/i.test(text) &&
      /\b(name|profile|details|education|degree|institution|university|skills|technical skills|experience|employment|work experience|company|employer|job|role|language|languages|german|english|nationality|dob|date of birth)\b/i.test(text)
    ) {
      return 'UPDATE_PROFILE';
    }

    // 2. Specific Document Status / Why Document Pending or Flagged pattern
    if (
      (text.includes('why') || text.includes('reason') || text.includes('explain') || text.includes('issue') || text.includes('mismatch') || text.includes('conflict') || text.includes('rejected')) &&
      (text.includes('document') || text.includes('doc') || text.includes('certificate') || text.includes('language') || text.includes('degree') || text.includes('passport') || text.includes('pending'))
    ) {
      return 'GET_DOCUMENT_STATUS';
    }

    // 3. Uploaded Documents pattern ("Which documents have I uploaded?", "What documents are uploaded?", "Show my uploaded files")
    if (
      (text.includes('which documents have i uploaded') || text.includes('what documents have i uploaded') || text.includes('documents have i uploaded') || text.includes('documents i uploaded') || text.includes('uploaded documents') || text.includes('uploaded files') || text.includes('my documents') || text.includes('show documents') || text.includes('list documents')) ||
      (/\b(which|what|list|show)\b/i.test(text) && /\b(documents?|docs?|certificates?)\b/i.test(text) && /\b(uploaded|submitted|provided|attached)\b/i.test(text))
    ) {
      return 'GET_DOCUMENTS';
    }

    // 4. Missing Documents pattern ("Which documents are missing?", "What documents am I missing?", "What is missing?")
    if (
      (text.includes('document') || text.includes('doc') || text.includes('passport') || text.includes('certificate') || text.includes('file')) &&
      (text.includes('miss') || text.includes('need') || text.includes('require') || text.includes('left') || text.includes('remaining') || text.includes('still need'))
    ) {
      return 'GET_MISSING_DOCUMENTS';
    }
    if (text.includes('missing documents') || text.includes('missing document') || text.includes('what is missing') || text.includes('what documents are missing')) {
      return 'GET_MISSING_DOCUMENTS';
    }

    // 5. Qualification / Eligibility pattern ("What is my current eligibility?", "Am I qualified?", "Check my eligibility")
    if (
      text.includes('qualif') ||
      text.includes('eligible') ||
      text.includes('eligibility') ||
      text.includes('blue card') ||
      text.includes('points based') ||
      text.includes('meet requirement') ||
      text.includes('am i ready')
    ) {
      return 'GET_QUALIFICATION';
    }

    // 6. Next Action pattern ("What should I do next?", "What is my next action?")
    if (
      text.includes('what should i do') ||
      text.includes('what do i do') ||
      text.includes('what to do') ||
      text.includes('what next') ||
      text.includes('next action') ||
      text.includes('next step') ||
      text.includes('suggest action') ||
      text.includes('recommended action')
    ) {
      return 'GET_NEXT_ACTION';
    }

    // 7. Status & Progress pattern ("Where do I stand in my journey?", "What is my application status?")
    if (
      text.includes('status') ||
      text.includes('progress') ||
      text.includes('where do i stand') ||
      text.includes('where am i') ||
      text.includes('stage') ||
      text.includes('overview') ||
      text.includes('journey') ||
      text.includes('how is my application')
    ) {
      return 'GET_STATUS';
    }

    // 8. Profile detail query ("What is my education?", "What are my registered skills?", "What languages do I speak?")
    if (
      text.includes('profile') ||
      text.includes('my detail') ||
      text.includes('my info') ||
      text.includes('personal info') ||
      text.includes('who am i') ||
      text.includes('about me') ||
      text.includes('my education') ||
      text.includes('my skills') ||
      text.includes('my employment') ||
      text.includes('my experience') ||
      text.includes('my language') ||
      text.includes('registered skills')
    ) {
      return 'GET_PROFILE';
    }

    // 9. Upload Document instruction
    if (
      text.includes('how to upload') ||
      text.includes('how do i upload') ||
      text.includes('where to upload')
    ) {
      return 'UPLOAD_DOCUMENT';
    }

    return 'GENERAL_QUERY';
  }
}
