import { IAiExtractionProvider, AiExtractionResult } from './ai.interface';
import { ExtractedData, ExtractedDataSchema } from '../../types/extraction.types';

export class MockFallbackExtractionProvider implements IAiExtractionProvider {
  name = 'Deterministic Fallback / Mock Engine';

  async extract(rawText: string, suggestedType?: string): Promise<AiExtractionResult> {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    let fullName: string | null = null;
    let dateOfBirth: string | null = null;
    let degree: string | null = null;
    let university: string | null = null;
    let graduationYear: string | null = null;

    // 1. Detect Name patterns
    const nameMatch = rawText.match(/(?:this is to certify that|certify that|conferred upon|name\s*:\s*|presented to)\s*([A-Za-z\s.]+?)(?:has|\n|,|\.|bearing)/i);
    if (nameMatch && nameMatch[1]) {
      fullName = nameMatch[1].trim();
    }

    // 2. Detect Date of Birth
    const dobMatch = rawText.match(/(?:date of birth|dob|born on)\s*[:\-]?\s*([0-9]{1,4}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,4})/i);
    if (dobMatch && dobMatch[1]) {
      dateOfBirth = dobMatch[1].trim();
    }

    // 3. Detect Degree patterns
    const degreeMatch = rawText.match(/(?:degree of|bachelor of [a-zA-Z\s]+|master of [a-zA-Z\s]+|b\.?tech|b\.?e\.?|m\.?tech|b\.?sc|m\.?sc|doctor of [a-zA-Z\s]+)/i);
    if (degreeMatch) {
      degree = degreeMatch[0].trim();
    }

    // 4. Detect University / College
    const uniMatch = rawText.match(/(?:university of [a-zA-Z\s]+|[a-zA-Z\s]+ university|[a-zA-Z\s]+ institute of technology|[a-zA-Z\s]+ college of engineering)/i);
    if (uniMatch) {
      university = uniMatch[0].trim();
    }

    // 5. Detect Graduation Year
    const yearMatch = rawText.match(/(?:graduated in|conferred in|year of passing|passing year|batch of|in the year)\s*[:\-]?\s*(20[0-9]{2}|19[0-9]{2})/i) ||
                     rawText.match(/\b(20[1-2][0-9]|19[8-9][0-9])\b/);
    if (yearMatch && yearMatch[1]) {
      graduationYear = yearMatch[1].trim();
    }

    const data: ExtractedData = ExtractedDataSchema.parse({
      fullName,
      dateOfBirth,
      degree,
      university,
      graduationYear,
      documentType: suggestedType || 'degree_certificate',
      institutionLocation: null,
      gradeOrGpa: null,
    });

    return {
      extractedData: data,
      detectedDocumentType: suggestedType || 'degree_certificate',
      modelUsed: 'deterministic-fallback-rules',
      aiConfidence: 0.88,
    };
  }
}
