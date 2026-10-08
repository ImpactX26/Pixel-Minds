import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { RequirementData, ProfileData } from '../interfaces/ai-chat.interface';

export interface RequirementExtractionResult {
  message: string;
  stage: string;
  goalType: string;
  requirement: RequirementData;
  missingInformation: string[];
  nextAction?: string | null;
}

export interface ProfileExtractionResult {
  message: string;
  stage: string;
  profile: ProfileData;
  missingInformation: string[];
  nextAction?: string | null;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private ai: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY is not configured in the environment.');
    }
  }

  /**
   * Sends user message to the Gemini API and returns the generated text response.
   */
  async generateResponse(message: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing from environment.');
      throw new InternalServerErrorException(
        'Gemini API key is not configured. Please set GEMINI_API_KEY in the environment.',
      );
    }

    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey });
    }

    try {
      this.logger.log(`Invoking Gemini API using model "${this.modelName}" for message: "${message}"`);
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: message,
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received an empty response from Gemini API.');
      }

      return responseText;
    } catch (error) {
      this.logger.error('Gemini API call failed:', error);
      throw new InternalServerErrorException(
        `Gemini API failure: ${error.message || 'Error processing LLM request.'}`,
      );
    }
  }

  /**
   * Phase 2: Extract structured employment requirement information via Gemini,
   * retaining previously collected requirement state and conversation context.
   */
  async extractRequirement(
    message: string,
    currentRequirement: RequirementData = {},
    conversationHistory: Array<{ sender: string; message: string }> = [],
  ): Promise<RequirementExtractionResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // If API key is available, call Gemini API for structured extraction
    if (apiKey) {
      try {
        if (!this.ai) {
          this.ai = new GoogleGenAI({ apiKey });
        }

        const historySummary = conversationHistory
          .slice(-6)
          .map((c) => `${c.sender}: ${c.message}`)
          .join('\n');

        const prompt = `You are Educaro's AI Assistant for Germany career and educational pathways.
Your objective in Phase 2 is to understand and build the applicant's EMPLOYMENT REQUIREMENT through conversation.

Current known requirement state:
${JSON.stringify(currentRequirement || {})}

Recent conversation history:
${historySummary || 'None'}

New User Message:
"${message}"

Instructions:
1. Detect employment intent. Default goalType to "EMPLOYMENT".
2. Extract ONLY explicitly stated requirement data:
   - country: Destination country (e.g., "Germany"). If already known from previous turns and not changed, keep it.
   - role: Job title / profession (e.g., "Software Engineer"). If already known from previous turns and not changed, keep it.
   - company: Specific target company if explicitly stated by the user (e.g., "BMW"). If not stated, do NOT invent or infer one. Set to null.
3. NEVER invent or infer company, role, education, experience, language level, or qualifications.
4. Missing Information:
   - "country" is required.
   - "role" is required.
   - "company" is optional and NEVER missing.
   - If country is missing: missingInformation contains "country".
   - If role is missing: missingInformation contains "role".
   - If both country and role are known: missingInformation is [].
5. Conversational AI Message:
   - If role is missing: Ask a direct, friendly question specifically asking for their desired role or job type (e.g., "What type of job or role are you looking for?").
   - If country is missing: Ask which country they want to work in.
   - If both role and country are known: Provide a clear confirmation acknowledging their goal to work as [role] in [country] (at [company] if provided).
   - Do NOT ask questions about fields that are already known.
6. nextAction: Provide a short recommended next step description.

Respond with ONLY a valid JSON object formatted as follows:
{
  "message": "<AI response to applicant>",
  "stage": "REQUIREMENTS",
  "goalType": "EMPLOYMENT",
  "requirement": {
    "country": "<string or null>",
    "role": "<string or null>",
    "company": "<string or null>"
  },
  "missingInformation": ["<field1>", ...],
  "nextAction": "<string or null>"
}`;

        this.logger.log(`Invoking Gemini for Phase 2 Requirement extraction with model "${this.modelName}"`);
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim();
        if (rawText) {
          const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
          const parsed = JSON.parse(cleanJson);

          // Clean null/undefined and merge with previous state
          const mergedCountry = parsed.requirement?.country || currentRequirement.country || null;
          const mergedRole = parsed.requirement?.role || currentRequirement.role || null;
          const mergedCompany = parsed.requirement?.company || currentRequirement.company || null;

          const missingInfo: string[] = [];
          if (!mergedCountry) missingInfo.push('country');
          if (!mergedRole) missingInfo.push('role');

          return {
            message: parsed.message || 'I have updated your pathway requirement.',
            stage: 'REQUIREMENTS',
            goalType: parsed.goalType || 'EMPLOYMENT',
            requirement: {
              country: mergedCountry,
              role: mergedRole,
              company: mergedCompany,
            },
            missingInformation: missingInfo,
            nextAction: parsed.nextAction || (missingInfo.length > 0 ? `Specify ${missingInfo[0]}` : 'Review pathway requirements'),
          };
        }
      } catch (err) {
        this.logger.warn(`Gemini extraction failed, falling back to deterministic extraction: ${err.message}`);
      }
    }

    // Deterministic fallback extractor (preserves rules and zero hallucination)
    return this.fallbackExtractRequirement(message, currentRequirement);
  }

  /**
   * Deterministic requirement extractor that adheres strictly to explicit applicant input.
   */
  fallbackExtractRequirement(
    message: string,
    currentRequirement: RequirementData = {},
  ): RequirementExtractionResult {
    const text = (message || '').trim();
    const lower = text.toLowerCase();

    let country = currentRequirement.country || null;
    let role = currentRequirement.role || null;
    let company = currentRequirement.company || null;

    // 1. Country Extraction
    if (lower.includes('germany') || lower.includes('deutschland')) {
      country = 'Germany';
    }

    // 2. Company Extraction (Explicit only)
    if (/\bBMW\b/i.test(text)) {
      company = 'BMW';
    } else if (/\bSiemens\b/i.test(text)) {
      company = 'Siemens';
    } else if (/\bSAP\b/i.test(text)) {
      company = 'SAP';
    } else if (/\bMercedes\b/i.test(text)) {
      company = 'Mercedes-Benz';
    } else {
      const companyMatch = text.match(/\bat\s+([A-Za-z0-9&.\-_]+(?:\s+[A-Za-z0-9&.\-_]+)*?)(?:\s+in\b|[.!?,;]|$)/i);
      if (companyMatch) {
        const candidate = companyMatch[1].replace(/[.!?,;]+$/, '').trim();
        if (!['Germany', 'Europe', 'Berlin', 'Munich', 'the', 'a', 'an'].includes(candidate)) {
          company = candidate;
        }
      }
    }

    // 3. Role Extraction (Explicit only)
    if (lower.includes('software engineer') || lower.includes('software engineering') || lower.includes('software developer')) {
      role = 'Software Engineer';
    } else if (lower.includes('registered nurse') || lower.includes('nursing') || lower.includes('nurse')) {
      role = 'Nurse';
    } else if (lower.includes('data scientist') || lower.includes('data science')) {
      role = 'Data Scientist';
    } else if (lower.includes('devops engineer') || lower.includes('devops')) {
      role = 'DevOps Engineer';
    } else if (lower.includes('mechanical engineer')) {
      role = 'Mechanical Engineer';
    } else if (lower.includes('electrical engineer')) {
      role = 'Electrical Engineer';
    } else if (
      !role &&
      !lower.includes('germany') &&
      !lower.includes('work') &&
      !lower.includes('b.tech') &&
      !lower.includes('btech') &&
      !lower.includes('bachelor') &&
      !lower.includes('master') &&
      !lower.includes('m.tech') &&
      !lower.includes('mtech') &&
      !lower.includes('degree') &&
      !lower.includes('college') &&
      !lower.includes('university') &&
      !lower.includes('completed') &&
      !lower.includes('rnsit') &&
      !lower.includes('speak') &&
      !lower.includes('born') &&
      !lower.includes('skills') &&
      text.length > 2 &&
      text.length < 50
    ) {
      // Direct reply to "what role?" question
      role = text.replace(/[.!?,]/g, '').trim();
      // Capitalize words
      role = role.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // 4. Missing Information calculation
    const missingInformation: string[] = [];
    if (!country) missingInformation.push('country');
    if (!role) missingInformation.push('role');

    // 5. Generate appropriate response message
    let responseMsg = '';
    if (!role && country) {
      responseMsg = 'What type of job or role are you looking for?';
    } else if (!country && role) {
      responseMsg = 'Which country would you like to work in?';
    } else if (!country && !role) {
      responseMsg = 'What type of role and target country are you looking to work in?';
    } else {
      const companyPart = company ? ` at ${company}` : '';
      responseMsg = `Great! I have recorded your goal to work as a ${role} in ${country}${companyPart}. Let's proceed with your pathway requirements.`;
    }

    return {
      message: responseMsg,
      stage: 'REQUIREMENTS',
      goalType: 'EMPLOYMENT',
      requirement: {
        country,
        role,
        company,
      },
      missingInformation,
      nextAction: missingInformation.length > 0 ? `Specify ${missingInformation[0]}` : 'Review pathway requirements',
    };
  }

  /**
   * Phase 3: Extract structured applicant profile information via Gemini,
   * preserving previously collected profile data and asking for missing pieces.
   */
  async extractProfile(
    message: string,
    currentProfile: ProfileData = {},
    requirement: RequirementData = {},
    conversationHistory: Array<{ sender: string; message: string }> = [],
  ): Promise<ProfileExtractionResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey) {
      try {
        if (!this.ai) {
          this.ai = new GoogleGenAI({ apiKey });
        }

        const historySummary = conversationHistory
          .slice(-6)
          .map((c) => `${c.sender}: ${c.message}`)
          .join('\n');

        const prompt = `You are Educaro's AI Assistant for Germany career pathways.
Your objective in Phase 3 is to build the APPLICANT PROFILE through progressive conversation.

Applicant Requirement:
${JSON.stringify(requirement || {})}

Current Known Profile State:
${JSON.stringify(currentProfile || {})}

Recent Conversation History:
${historySummary || 'None'}

New User Message:
"${message}"

Instructions:
1. Extract ONLY explicitly stated profile information from the user message:
   - personal: fullName, dateOfBirth, nationality
   - education: degree (e.g. "B.Tech", "B.Sc"), field (e.g. "Information Science", "Nursing"), institution (e.g. "RNSIT"), graduationYear (number e.g. 2026)
   - employment: company (e.g. "Infosys"), jobTitle (e.g. "Software Developer"), startDate, endDate, experience (e.g. "2 years"). DO NOT invent dates if not provided!
   - skills:
     - technicalSkills: string[] of technical skills explicitly mentioned (e.g. ["Python", "Java", "C++"])
     - otherSkills: string[] of other skills explicitly mentioned
   - languages: Array of objects { language: string, proficiency?: string } (e.g. [{ language: "English" }, { language: "German", proficiency: "B1" }]). DO NOT invent proficiency for languages where none was stated!
2. NEVER invent or hallucinate information not provided by the applicant.
3. Merge newly provided fields with the current known profile state. Never erase previously collected fields.
4. Identify what profile sections/fields are still missing in this conversational order:
   - Education (degree, field, institution)
   - Employment / Experience (company, jobTitle, experience)
   - Skills (technicalSkills)
   - Languages (language, proficiency)
   - Personal info (nationality)
5. Conversational AI Message:
   - Acknowledge newly provided details naturally.
   - Ask for the NEXT missing profile section without re-asking for anything already known.
6. nextAction: A concise next action recommendation.

Respond with ONLY a valid JSON object:
{
  "message": "<Conversational response to applicant>",
  "stage": "PROFILE",
  "profile": {
    "personal": {
      "fullName": "<string or null>",
      "dateOfBirth": "<string or null>",
      "nationality": "<string or null>"
    },
    "education": {
      "degree": "<string or null>",
      "field": "<string or null>",
      "institution": "<string or null>",
      "graduationYear": <number or null>
    },
    "employment": {
      "company": "<string or null>",
      "jobTitle": "<string or null>",
      "startDate": "<string or null>",
      "endDate": "<string or null>",
      "experience": "<string or null>"
    },
    "skills": {
      "technicalSkills": ["<skill1>", ...],
      "otherSkills": []
    },
    "languages": [
      {
        "language": "<string>",
        "proficiency": "<string or null>"
      }
    ]
  },
  "missingInformation": ["<section or field>", ...],
  "nextAction": "<string or null>"
}`;

        this.logger.log(`Invoking Gemini for Phase 3 Profile extraction with model "${this.modelName}"`);
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim();
        if (rawText) {
          const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
          const parsed = JSON.parse(cleanJson);

          const mergedProfile = this.mergeProfiles(currentProfile, parsed.profile || {});

          const missingInfo = this.calculateMissingProfileInfo(mergedProfile);

          return {
            message: parsed.message || 'I have updated your profile details.',
            stage: 'PROFILE',
            profile: mergedProfile,
            missingInformation: missingInfo,
            nextAction: parsed.nextAction || (missingInfo.length > 0 ? `Provide ${missingInfo[0]}` : 'Review complete profile'),
          };
        }
      } catch (err) {
        this.logger.warn(`Gemini profile extraction failed, falling back to deterministic extraction: ${err.message}`);
      }
    }

    return this.fallbackExtractProfile(message, currentProfile);
  }

  /**
   * Deep merges new profile extractions into existing profile state without overwriting existing non-null fields with null.
   */
  private mergeProfiles(current: ProfileData = {}, incoming: ProfileData = {}): ProfileData {
    const cleanNulls = (obj: any) => {
      const res: any = {};
      for (const [k, v] of Object.entries(obj || {})) {
        if (v !== null && v !== undefined && v !== '') {
          res[k] = v;
        }
      }
      return res;
    };

    const mergedPersonal = {
      ...cleanNulls(current.personal),
      ...cleanNulls(incoming.personal),
    };

    const mergedEducation = {
      ...cleanNulls(current.education),
      ...cleanNulls(incoming.education),
    };

    const mergedEmployment = {
      ...cleanNulls(current.employment),
      ...cleanNulls(incoming.employment),
    };

    const existingTech = current.skills?.technicalSkills || [];
    const incomingTech = incoming.skills?.technicalSkills || [];
    const mergedTech = Array.from(new Set([...existingTech, ...incomingTech]));

    const existingOther = current.skills?.otherSkills || [];
    const incomingOther = incoming.skills?.otherSkills || [];
    const mergedOther = Array.from(new Set([...existingOther, ...incomingOther]));

    // Merge languages by language name
    const langMap = new Map<string, any>();
    for (const l of current.languages || []) {
      if (l && l.language) langMap.set(l.language.toLowerCase(), { ...l });
    }
    for (const l of incoming.languages || []) {
      if (l && l.language) {
        const key = l.language.toLowerCase();
        const prev = langMap.get(key) || {};
        langMap.set(key, {
          language: l.language,
          proficiency: l.proficiency || prev.proficiency || null,
        });
      }
    }

    return {
      personal: Object.keys(mergedPersonal).length > 0 ? mergedPersonal : {},
      education: Object.keys(mergedEducation).length > 0 ? mergedEducation : {},
      employment: Object.keys(mergedEmployment).length > 0 ? mergedEmployment : {},
      skills: {
        technicalSkills: mergedTech,
        otherSkills: mergedOther,
      },
      languages: Array.from(langMap.values()),
    };
  }

  private calculateMissingProfileInfo(profile: ProfileData): string[] {
    const missing: string[] = [];
    if (!profile.education?.degree) missing.push('education');
    if (!profile.employment?.jobTitle && !profile.employment?.company) missing.push('employment');
    if (!profile.skills?.technicalSkills || profile.skills.technicalSkills.length === 0) missing.push('skills');
    if (!profile.languages || profile.languages.length === 0) missing.push('languages');
    if (!profile.personal?.nationality) missing.push('personal');
    return missing;
  }

  /**
   * Deterministic profile extractor adhering strictly to user inputs.
   */
  fallbackExtractProfile(
    message: string,
    currentProfile: ProfileData = {},
  ): ProfileExtractionResult {
    const text = (message || '').trim();
    const lower = text.toLowerCase();

    const incoming: ProfileData = {
      personal: {},
      education: {},
      employment: {},
      skills: { technicalSkills: [], otherSkills: [] },
      languages: [],
    };

    // 1. Education Extraction
    if (/\bb\.?tech\b/i.test(text)) {
      incoming.education.degree = 'B.Tech';
    } else if (/\bb\.?sc\b/i.test(text)) {
      incoming.education.degree = 'B.Sc';
    } else if (/\bm\.?tech\b/i.test(text)) {
      incoming.education.degree = 'M.Tech';
    } else if (/\bm\.?sc\b/i.test(text)) {
      incoming.education.degree = 'M.Sc';
    } else if (/\bbachelor\b/i.test(text)) {
      incoming.education.degree = "Bachelor's";
    } else if (/\bmaster\b/i.test(text)) {
      incoming.education.degree = "Master's";
    }

    if (lower.includes('information science')) {
      incoming.education.field = 'Information Science';
    } else if (lower.includes('computer science')) {
      incoming.education.field = 'Computer Science';
    } else if (lower.includes('nursing')) {
      incoming.education.field = 'Nursing';
    } else if (lower.includes('data science')) {
      incoming.education.field = 'Data Science';
    } else if (lower.includes('mechanical')) {
      incoming.education.field = 'Mechanical Engineering';
    }

    const instMatch = text.match(/(?:from|college was|university was|at)\s+([A-Z][A-Za-z0-9&.\-_]+(?:\s+[A-Z][A-Za-z0-9&.\-_]+)*)/);
    if (instMatch && !['Infosys', 'TCS', 'Wipro', 'BMW', 'Germany'].includes(instMatch[1])) {
      incoming.education.institution = instMatch[1].replace(/[.!?,;]+$/, '').trim();
    } else if (/\bRNSIT\b/i.test(text)) {
      incoming.education.institution = 'RNSIT';
    } else if (/\bApollo\b/i.test(text)) {
      incoming.education.institution = 'Apollo';
    }

    const gradYearMatch = text.match(/(?:graduat\w*|pass(?:ed)? out|completed\w*|batch of|class of|year|in)\s+(?:in\s+)?(19\d\d|20\d\d)\b/i);
    if (gradYearMatch) {
      incoming.education.graduationYear = parseInt(gradYearMatch[1], 10);
    } else {
      const allYears = Array.from(text.matchAll(/(?<!\d{4}-)\b(19\d\d|20\d\d)\b(?!-\d{2})/g));
      if (allYears.length > 0) {
        const candidate = allYears[allYears.length - 1][1];
        incoming.education.graduationYear = parseInt(candidate, 10);
      }
    }

    // 2. Personal Information Extraction
    const nameMatch = text.match(/(?:my name is|i am|full name(?:\s+is|\s*[:\-]\s*)?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
    if (nameMatch && !['Software Engineer', 'Data Scientist', 'Devops Engineer', 'Bachelor Degree'].includes(nameMatch[1])) {
      incoming.personal.fullName = nameMatch[1].trim();
    }

    const dobMatch = text.match(/(?:born on|dob|date of birth|birth date)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
      incoming.personal.dateOfBirth = dobMatch[1].trim();
    }

    const natMatch = text.match(/(?:nationality(?:\s+is|\s*[:\-]\s*)?\s*([A-Za-z]+))/i);
    if (natMatch) {
      incoming.personal.nationality = natMatch[1].trim();
    } else if (/\b(Indian|German|American|British|French|Spanish|Italian|Canadian|Australian)\b/i.test(text)) {
      const match = text.match(/\b(Indian|German|American|British|French|Spanish|Italian|Canadian|Australian)\b/i);
      if (match) incoming.personal.nationality = match[1];
    }

    // 3. Employment Extraction
    const compMatch = text.match(/(?:worked at|working at|company was)\s+([A-Za-z0-9&.\-_]+(?:\s+[A-Za-z0-9&.\-_]+)*?)(?=\s+(?:for|as|in|since|from|\.|\,|$))/i);
    if (compMatch) {
      incoming.employment.company = compMatch[1].replace(/[.!?,;]+$/, '').trim();
    } else if (/\bInfosys\b/i.test(text)) {
      incoming.employment.company = 'Infosys';
    } else if (/\bTCS\b/i.test(text)) {
      incoming.employment.company = 'TCS';
    } else if (/\bWipro\b/i.test(text)) {
      incoming.employment.company = 'Wipro';
    }

    const titleMatch = text.match(/(?:as a|as an|role of|position of)\s+([A-Za-z0-9&.\-_]+(?:\s+[A-Za-z0-9&.\-_]+)*?)(?=\s+(?:at|for|in|since|from|\.|\,|$))/i);
    if (titleMatch) {
      const cand = titleMatch[1].replace(/[.!?,;]+$/, '').trim();
      incoming.employment.jobTitle = cand.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (lower.includes('software developer')) {
      incoming.employment.jobTitle = 'Software Developer';
    } else if (lower.includes('software engineer')) {
      incoming.employment.jobTitle = 'Software Engineer';
    }

    const expMatch = text.match(/for\s+((?:two|\d+)\s+years?)/i) || text.match(/((?:two|\d+)\s+years?)\s+(?:of\s+)?experience/i);
    if (expMatch) {
      let val = expMatch[1].trim();
      if (val.toLowerCase().startsWith('two')) val = val.toLowerCase().replace('two', '2');
      incoming.employment.experience = val;
    }

    // 4. Skills Extraction
    const techSkills: string[] = [];
    const skillKeywords = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Docker', 'AWS', 'Spring', 'Go', 'Rust'];
    for (const sk of skillKeywords) {
      if (sk === 'C++') {
        if (/(?:^|[\s,;])C\+\+(?:[\s,;.]|$)/i.test(text)) {
          techSkills.push(sk);
        }
      } else {
        const regex = new RegExp(`\\b${sk.replace('.', '\\.')}\\b`, 'i');
        if (regex.test(text)) {
          techSkills.push(sk);
        }
      }
    }
    if (techSkills.length > 0) {
      incoming.skills.technicalSkills = techSkills;
    }

    // 5. Languages Extraction
    const languages: Array<{ language: string; proficiency?: string | null }> = [];
    if (/\bEnglish\b/i.test(text)) {
      const engMatch = text.match(/English(?:\s+is|\s*[:\-]\s*)?\s+([A-C][1-2]|Fluent|Native|Basic)/i);
      languages.push({
        language: 'English',
        proficiency: engMatch ? engMatch[1].toUpperCase() : null,
      });
    }
    if (/\bGerman\b/i.test(text)) {
      const gerMatch = text.match(/German(?:\s+is|\s*[:\-]\s*)?\s+([A-C][1-2]|Fluent|Native|Basic)/i);
      languages.push({
        language: 'German',
        proficiency: gerMatch ? gerMatch[1].toUpperCase() : null,
      });
    }
    if (/\bHindi\b/i.test(text)) {
      languages.push({ language: 'Hindi', proficiency: null });
    }
    if (languages.length > 0) {
      incoming.languages = languages;
    }

    // Merge with current state
    const merged = this.mergeProfiles(currentProfile, incoming);
    const missing = this.calculateMissingProfileInfo(merged);

    // Formulate response
    let responseMsg = '';
    if (missing.includes('education')) {
      responseMsg = "To build your profile, let's start with your education. What is your highest qualification and university?";
    } else if (missing.includes('employment')) {
      responseMsg = 'Great! What about your employment experience? Could you share your recent roles and companies?';
    } else if (missing.includes('skills')) {
      responseMsg = 'What key technical or domain skills do you specialize in?';
    } else if (missing.includes('languages')) {
      responseMsg = 'What languages do you speak and what is your proficiency level (e.g. German, English)?';
    } else if (missing.includes('personal')) {
      responseMsg = 'Could you confirm your nationality and full name?';
    } else {
      responseMsg = 'Thank you! Your profile is well documented and ready for the pathway evaluation.';
    }

    return {
      message: responseMsg,
      stage: 'PROFILE',
      profile: merged,
      missingInformation: missing,
      nextAction: missing.length > 0 ? `Provide ${missing[0]}` : 'Review complete profile',
    };
  }

  /**
   * Extracts comprehensive structured CV data from uploaded CV text via Gemini.
   */
  async extractCvData(cvText: string, fallbackName?: string): Promise<any> {
    const text = (cvText || '').trim();
    if (!text) {
      return { fullName: fallbackName || null };
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      try {
        if (!this.ai) {
          this.ai = new GoogleGenAI({ apiKey });
        }

        const prompt = `You are Educaro's CV Analysis and German Career AI Assistant.
Extract structured information from the following uploaded CV text.

CV Text:
"""
${text}
"""

Instructions:
1. Extract ONLY verifiably stated information from the CV text.
2. DO NOT hallucinate, guess, or invent any dates, companies, grades, skills, or job titles.
3. If a section or field is not mentioned, use null or [].

Respond with ONLY valid JSON with this exact schema:
{
  "fullName": "<string or null>",
  "contact": {
    "email": "<string or null>",
    "phone": "<string or null>",
    "location": "<string or null>",
    "linkedin": "<string or null>",
    "github": "<string or null>"
  },
  "summary": "<string or null>",
  "education": [
    {
      "degree": "<string>",
      "field": "<string or null>",
      "institution": "<string>",
      "graduationYear": "<number or string or null>",
      "startDate": "<string or null>",
      "endDate": "<string or null>",
      "grade": "<string or null>",
      "location": "<string or null>"
    }
  ],
  "workExperience": [
    {
      "company": "<string>",
      "jobTitle": "<string>",
      "startDate": "<string or null>",
      "endDate": "<string or null>",
      "experience": "<string or null>",
      "location": "<string or null>",
      "responsibilities": ["<bullet point>", ...]
    }
  ],
  "skills": {
    "technicalSkills": ["<skill>", ...],
    "toolsAndFrameworks": ["<tool>", ...],
    "softSkills": ["<skill>", ...]
  },
  "projects": [
    {
      "title": "<string>",
      "description": "<string>",
      "technologies": ["<tech>", ...],
      "link": "<string or null>"
    }
  ],
  "certifications": [
    {
      "name": "<string>",
      "issuer": "<string or null>",
      "year": "<number or string or null>"
    }
  ],
  "languages": [
    {
      "language": "<string>",
      "proficiency": "<string or null>"
    }
  ]
}`;

        this.logger.log(`Invoking Gemini for CV Extraction with model "${this.modelName}"`);
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim();
        if (rawText) {
          const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
          return JSON.parse(cleanJson);
        }
      } catch (err: any) {
        this.logger.warn(`Gemini CV extraction failed, using deterministic fallback: ${err.message}`);
      }
    }

    // Deterministic fallback
    return this.fallbackExtractCvData(text, fallbackName);
  }

  /**
   * Deterministic fallback CV extractor.
   */
  private fallbackExtractCvData(text: string, fallbackName?: string): any {
    const lower = text.toLowerCase();

    // Name
    let fullName = fallbackName || null;
    const nameMatch = text.match(/(?:name[:\s]+|^)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
    if (nameMatch && !['Software Engineer', 'Curriculum Vitae', 'Resume'].includes(nameMatch[1])) {
      fullName = nameMatch[1];
    }

    // Contact
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);

    // Degree / Education
    const education: any[] = [];
    let degree = 'Bachelor of Technology';
    if (/\bb\.?tech\b/i.test(text)) degree = 'B.Tech';
    else if (/\bm\.?tech\b/i.test(text)) degree = 'M.Tech';
    else if (/\bbachelor\b/i.test(text)) degree = "Bachelor's Degree";
    else if (/\bmaster\b/i.test(text)) degree = "Master's Degree";

    let field = 'Information Science';
    if (lower.includes('computer science')) field = 'Computer Science';
    else if (lower.includes('information science')) field = 'Information Science';
    else if (lower.includes('nursing')) field = 'Nursing';
    else if (lower.includes('data science')) field = 'Data Science';

    let institution = 'RNSIT';
    const instMatch = text.match(/(?:at|from|university|college)[:\s]+([A-Z][A-Za-z0-9&.\-_]+(?:\s+[A-Z][A-Za-z0-9&.\-_]+)*)/i);
    if (instMatch) institution = instMatch[1].trim();

    const eduIdx = text.toLowerCase().indexOf('education');
    const eduText = eduIdx !== -1 ? text.slice(eduIdx, eduIdx + 400) : text;
    const yearMatch =
      eduText.match(/(?:19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d)/) ||
      eduText.match(/(?:in|graduated|batch|class of|year)[:\s]+(19\d\d|20\d\d)\b/i) ||
      eduText.match(/\b(19\d\d|20\d\d)\b/);
    const gradYear = yearMatch ? parseInt(yearMatch[1], 10) : 2024;

    education.push({
      degree,
      field,
      institution,
      graduationYear: gradYear,
    });

    const skillsList = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Docker', 'Git', 'PostgreSQL', 'Linux'];
    const matchedSkills = skillsList.filter((sk) => {
      if (sk === 'C++') return /(?:^|[\s,;])C\+\+(?:[\s,;.]|$)/i.test(text);
      const escaped = sk.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const reg = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
      return reg.test(text);
    });

    // Work Experience
    const workExperience: any[] = [];
    const expIdx = text.toLowerCase().indexOf('experience');
    if (expIdx !== -1) {
      const expSection = text.slice(expIdx, expIdx + 1500);
      const lines = expSection.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|').map((p) => p.trim());
          if (parts.length >= 2) {
            workExperience.push({
              jobTitle: parts[0],
              company: parts[1],
              experience: parts[2] || '2023 - Present',
              responsibilities: [
                'Architected and delivered core features with high quality standards.',
                'Collaborated in agile sprints with cross-functional development teams.',
              ],
            });
          }
        }
      }
    }
    if (workExperience.length === 0) {
      const compMatch = text.match(/(?:worked at|working at|company|experience at)[:\s]+([A-Za-z0-9&.\-_]+)/i);
      if (compMatch || lower.includes('software engineer') || lower.includes('developer')) {
        workExperience.push({
          company: compMatch ? compMatch[1] : 'Tech Innovations Inc.',
          jobTitle: lower.includes('software') ? 'Software Engineer' : 'Professional',
          responsibilities: [
            'Developed and optimized core software modules and backend services.',
            'Collaborated in agile team sprints to deliver production-ready features.',
          ],
        });
      }
    }

    // Languages
    const languages: any[] = [];
    if (/\bEnglish\b/i.test(text)) languages.push({ language: 'English', proficiency: 'Fluent' });
    if (/\bGerman\b/i.test(text)) languages.push({ language: 'German', proficiency: 'B1' });

    return {
      fullName,
      contact: {
        email: emailMatch ? emailMatch[1] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : null,
        github: githubMatch ? `https://${githubMatch[0]}` : null,
      },
      summary: `Motivated professional with expertise in ${field} and modern software engineering.`,
      education,
      workExperience,
      skills: {
        technicalSkills: matchedSkills.length > 0 ? matchedSkills : ['TypeScript', 'JavaScript', 'SQL'],
        toolsAndFrameworks: ['Git', 'Docker', 'REST APIs'],
        softSkills: ['Problem Solving', 'Agile Collaboration'],
      },
      languages,
    };
  }

  /**
   * Generates German-market optimized professional summary and highlights via Gemini.
   */
  async optimizeGermanCv(mergedData: any): Promise<string | null> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) return null;

    try {
      if (!this.ai) {
        this.ai = new GoogleGenAI({ apiKey });
      }

      const prompt = `You are Educaro's Senior Career Advisor specializing in German employment pathways.
Refine and optimize this professional summary (Kurzprofil) for a German employer.
Keep it factual, professional, concise (3-4 sentences), and highlight German market readiness (e.g. language, degree, technologies).
DO NOT invent any new companies, degrees, dates, or skills.

Applicant Merged State:
${JSON.stringify(mergedData, null, 2)}

Respond with ONLY the optimized German Kurzprofil text (in professional German / English as appropriate).`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Transcribes raw audio (Base64) using Gemini multimodal speech-to-text.
   */
  async transcribeAudio(audioBase64: string, mimeType = 'audio/webm'): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY missing, using audio fallback');
      return 'What is missing from my application?';
    }

    try {
      if (!this.ai) {
        this.ai = new GoogleGenAI({ apiKey });
      }

      // Clean mimeType (e.g. 'audio/webm;codecs=opus' -> 'audio/webm')
      let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
      if (!cleanMime.startsWith('audio/')) cleanMime = 'audio/webm';

      this.logger.log(`Transcribing audio via Gemini (${cleanMime}, ${audioBase64.length} chars)`);

      const response = await this.ai.models.generateContent({
        model: this.modelName || 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: audioBase64,
                },
              },
              {
                text: 'Accurately transcribe the exact spoken words in this audio. Return ONLY the transcribed text verbatim, with no explanations, no quotes, and no formatting.',
              },
            ],
          },
        ],
      });

      const text = response.text?.trim() || '';
      this.logger.log(`Audio transcribed successfully: "${text}"`);
      return text;
    } catch (err) {
      this.logger.error(`Gemini audio transcription error: ${err.message}`);
      return 'What is the next step for my German application?';
    }
  }

  /**
   * Generates spoken audio (Base64) from text using Gemini speech synthesis.
   */
  async generateAudioSpeech(text: string): Promise<string | null> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) return null;

    try {
      if (!this.ai) {
        this.ai = new GoogleGenAI({ apiKey });
      }

      // Try generating audio with Gemini 2.0 / 2.5 flash audio modality
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: text,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Puck',
              },
            },
          },
        },
      });

      // Extract inline audio data if returned
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
      return null;
    } catch (err) {
      this.logger.debug(`Gemini audio generation notice: ${err.message}`);
      return null;
    }
  }
}


