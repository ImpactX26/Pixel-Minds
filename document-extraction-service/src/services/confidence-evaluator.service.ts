import { ExtractedData } from '../types/extraction.types';
import { OcrResult } from './ocr/ocr.interface';

export class ConfidenceEvaluatorService {
  /**
   * Calculates extraction confidence score between 0.00 and 1.00.
   *
   * ⚠️ IMPORTANT NOTE:
   * This score measures the technical quality, completeness, and legibility of the
   * OCR and AI extraction pipeline. It DOES NOT represent document authenticity,
   * applicant eligibility, or visa qualification.
   */
  evaluateConfidence(ocrResult: OcrResult, extractedData: ExtractedData, aiBaseConfidence?: number): number {
    // 1. Base OCR confidence (weight: 35%)
    const ocrConf = ocrResult.confidence ?? 0.8;

    // 2. Field completeness score (weight: 45%)
    // Critical fields: fullName, degree, university, graduationYear
    const coreFields: (keyof ExtractedData)[] = ['fullName', 'degree', 'university', 'graduationYear'];
    let populatedCount = 0;

    for (const field of coreFields) {
      if (extractedData[field] && typeof extractedData[field] === 'string' && (extractedData[field] as string).trim().length > 0) {
        populatedCount += 1;
      }
    }

    const completenessScore = populatedCount / coreFields.length;

    // 3. Document text length & signal-to-noise ratio (weight: 20%)
    let signalScore = 0.5;
    if (ocrResult.characterCount > 100) {
      signalScore = 0.95;
    } else if (ocrResult.characterCount > 40) {
      signalScore = 0.8;
    } else if (ocrResult.characterCount > 0) {
      signalScore = 0.5;
    } else {
      signalScore = 0.1;
    }

    // Weighted combination
    const aiWeight = aiBaseConfidence ? 0.2 : 0;
    const finalScore = aiBaseConfidence
      ? ocrConf * 0.3 + completenessScore * 0.4 + signalScore * 0.1 + aiBaseConfidence * aiWeight
      : ocrConf * 0.35 + completenessScore * 0.45 + signalScore * 0.2;

    // Clamp between 0.05 and 0.99 (or 0 if completely empty)
    if (populatedCount === 0 && ocrResult.characterCount === 0) {
      return 0.0;
    }

    return Math.round(Math.min(0.99, Math.max(0.1, finalScore)) * 100) / 100;
  }
}
