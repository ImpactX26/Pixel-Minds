import axios from 'axios';
import { IAiExtractionProvider, AiExtractionResult } from './ai.interface';
import { ExtractedData, ExtractedDataSchema } from '../../types/extraction.types';

export class GeminiExtractionProvider implements IAiExtractionProvider {
  name = 'Google Gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extract(rawText: string, suggestedType?: string): Promise<AiExtractionResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const systemPrompt = `
You are an expert AI document intelligence and extraction engine.
Your task is to extract structured educational/personal data from the given OCR document text.

CRITICAL EXTRACTION RULES:
1. Extract ONLY information explicitly and clearly present in the provided document text.
2. Do NOT infer, guess, or invent missing values.
3. Return null for any field that is missing, ambiguous, or not explicitly stated in the document.
4. Never hallucinate missing document information.
5. Identify the document type (e.g. degree_certificate, academic_transcript, experience_letter, language_certificate, cv, passport_identity, or other).

You MUST respond strictly with valid JSON conforming to this schema:
{
  "documentType": "degree_certificate" | "academic_transcript" | "experience_letter" | "language_certificate" | "cv" | "passport_identity" | "other",
  "fullName": string | null,
  "dateOfBirth": string | null (format YYYY-MM-DD if available, or original string, or null),
  "degree": string | null,
  "university": string | null,
  "graduationYear": string | null (e.g. "2024" or null),
  "institutionLocation": string | null,
  "gradeOrGpa": string | null
}
`;

    const userPrompt = `
Suggested Document Type Hint: ${suggestedType || 'Unknown'}

--- DOCUMENT OCR TEXT START ---
${rawText}
--- DOCUMENT OCR TEXT END ---

Extract the data as strictly formatted JSON.
`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await axios.post(
        url,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000,
        }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidate) {
        throw new Error('Empty response received from Gemini API');
      }

      // Parse and validate with Zod
      const parsedJson = JSON.parse(candidate);
      const validatedData = ExtractedDataSchema.parse(parsedJson);

      return {
        extractedData: validatedData,
        detectedDocumentType: parsedJson.documentType || suggestedType || 'degree_certificate',
        modelUsed: this.model,
        rawResponse: candidate,
        aiConfidence: 0.95,
      };
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error?.message || error?.message || error;
      throw new Error(`Gemini AI extraction failed: ${errorMsg}`);
    }
  }
}
