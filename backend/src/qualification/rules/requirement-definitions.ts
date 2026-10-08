import { RequirementDefinition } from '../interfaces/requirement.interface';

export const DEFAULT_REQUIREMENTS: RequirementDefinition[] = [
  // PROFILE
  {
    code: 'FULL_NAME',
    title: 'Full Name Verification',
    description: 'Applicant must have a valid full name on their application record',
    category: 'PROFILE',
    required: true,
  },
  {
    code: 'DATE_OF_BIRTH',
    title: 'Date of Birth',
    description: 'Applicant date of birth provided in profile or verified via official identity documents',
    category: 'PROFILE',
    required: true,
  },
  {
    code: 'GOAL',
    title: 'Study / Career Goal',
    description: 'A clear academic or vocational goal in Germany (e.g. STUDY, MASTER, WORK)',
    category: 'PROFILE',
    required: true,
  },

  // EDUCATION
  {
    code: 'DEGREE_CERTIFICATE',
    title: 'Academic Degree Certificate',
    description: 'Uploaded official degree certificate or academic transcripts verifying educational qualification',
    category: 'EDUCATION',
    required: true,
  },
  {
    code: 'UNIVERSITY',
    title: 'Recognized Institution / University',
    description: 'Recognized university name matching profile and official document extraction',
    category: 'EDUCATION',
    required: true,
  },
  {
    code: 'GRADUATION_YEAR',
    title: 'Graduation Year',
    description: 'Valid graduation year recorded from academic credentials',
    category: 'EDUCATION',
    required: true,
  },

  // DOCUMENTS
  {
    code: 'PASSPORT',
    title: 'Valid Passport Document',
    description: 'Uploaded official passport identity document for international verification',
    category: 'DOCUMENTS',
    required: true,
  },

  // LANGUAGE
  {
    code: 'GERMAN_LANGUAGE_CERTIFICATE',
    title: 'German Language Proficiency',
    description: 'Demonstrated German language competency (min B1/B2 level or language certificate document)',
    category: 'LANGUAGE',
    required: true,
  },
];
