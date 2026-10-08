export interface CvContactInfo {
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
}

export interface CvEducationItem {
  degree: string;
  field?: string;
  institution: string;
  graduationYear?: number | string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  location?: string;
  isVerified?: boolean;
}

export interface CvWorkExperienceItem {
  company: string;
  jobTitle: string;
  startDate?: string;
  endDate?: string;
  period?: string;
  experience?: string;
  location?: string;
  responsibilities?: string[];
  achievements?: string[];
  isVerified?: boolean;
}

export interface CvSkillCategory {
  technical: string[];
  tools: string[];
  soft: string[];
}

export interface CvLanguageItem {
  language: string;
  proficiency?: string;
  level?: string;
  isVerified?: boolean;
}

export interface CvProjectItem {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface CvCertificationItem {
  name: string;
  issuer?: string;
  year?: number | string;
}

export interface CvConflict {
  field: string;
  verifiedValue: any;
  cvValue: any;
  resolvedValue: any;
  resolution: string;
  message: string;
}

export interface ExtractedCvData {
  fullName?: string | null;
  contact?: CvContactInfo;
  summary?: string | null;
  education?: CvEducationItem[];
  workExperience?: CvWorkExperienceItem[];
  skills?: {
    technicalSkills?: string[];
    softSkills?: string[];
    toolsAndFrameworks?: string[];
  };
  projects?: CvProjectItem[];
  certifications?: CvCertificationItem[];
  languages?: CvLanguageItem[];
  otherSections?: Record<string, any>;
}

export interface GeneratedCvResult {
  applicantId: string;
  targetRole?: string;
  targetCountry?: string;
  personalInfo: {
    fullName: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
    dateOfBirth?: string;
    linkedin?: string;
    github?: string;
  };
  professionalSummary: string;
  workExperience: CvWorkExperienceItem[];
  education: CvEducationItem[];
  skills: CvSkillCategory;
  languages: CvLanguageItem[];
  projects?: CvProjectItem[];
  certifications?: CvCertificationItem[];
  conflicts: CvConflict[];
  formattedMarkdown: string;
  status: 'DRAFT' | 'APPROVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateCvRequestDto {
  applicantId?: string;
  documentId?: string;
  rawCvText?: string;
  targetRole?: string;
}

export interface SaveCvDto {
  applicantId?: string;
  cvData: Partial<GeneratedCvResult>;
}
