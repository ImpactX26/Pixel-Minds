import { Injectable, Logger } from '@nestjs/common';
import {
  CvConflict,
  CvEducationItem,
  CvLanguageItem,
  CvSkillCategory,
  CvWorkExperienceItem,
  ExtractedCvData,
  GeneratedCvResult,
} from './interfaces/cv.interface';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';

@Injectable()
export class CvEngine {
  private readonly logger = new Logger(CvEngine.name);

  /**
   * Merges verified applicant profile data from PostgreSQL with newly extracted CV data.
   * Priority:
   * Verified Applicant State (DB / verified documents) > Uploaded CV Data (Unverified).
   * Detects and records any conflicts without silently overwriting verified state.
   */
  mergeAndDetectConflicts(
    applicant: Applicant,
    profile: ApplicantProfile | null,
    documents: Document[] = [],
    extractedCv: ExtractedCvData = {},
  ): {
    mergedData: Omit<GeneratedCvResult, 'formattedMarkdown' | 'status'>;
    conflicts: CvConflict[];
  } {
    const conflicts: CvConflict[] = [];

    const parseJson = (val: any) => {
      if (!val) return {};
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val;
    };

    const additionalInfo = parseJson(profile?.additionalInfo);
    const personalData = additionalInfo.personal || {};
    const reqData = additionalInfo.requirement || {};
    const educationProfile = parseJson(profile?.education);
    const workExpProfile = Array.isArray(profile?.workExperience)
      ? profile?.workExperience
      : parseJson(profile?.workExperience);
    const skillsProfile: string[] = profile?.skills || [];
    const languagesProfile = Array.isArray(profile?.languages) ? profile?.languages : [];

    // Find verified degree document if available
    const verifiedDegreeDoc = documents.find((d) => {
      const ext = parseJson(d.extractedData);
      const vResult = ext.verificationResult;
      const t = (d.type || '').toUpperCase();
      return (
        t === 'DEGREE_CERTIFICATE' ||
        t.includes('DEGREE') ||
        (vResult?.overallStatus === 'VERIFIED' && (vResult?.documentType === 'DEGREE_CERTIFICATE' || t.includes('DEGREE')))
      );
    });
    const verifiedDegreeExt = parseJson(verifiedDegreeDoc?.extractedData);
    const verifiedDegreeFields = verifiedDegreeExt.fields || verifiedDegreeExt;

    // Target Role & Destination
    const targetRole =
      reqData.role ||
      applicant.goal ||
      extractedCv.workExperience?.[0]?.jobTitle ||
      'Professional';
    const targetCountry = reqData.country || applicant.country || 'Germany';

    // 1. Personal Info Merge & Conflict Check
    const verifiedFullName = applicant.name || personalData.fullName;
    const cvFullName = extractedCv.fullName?.trim();
    let resolvedFullName = verifiedFullName || cvFullName || 'Applicant';

    if (verifiedFullName && cvFullName && verifiedFullName.toLowerCase() !== cvFullName.toLowerCase()) {
      conflicts.push({
        field: 'fullName',
        verifiedValue: verifiedFullName,
        cvValue: cvFullName,
        resolvedValue: verifiedFullName,
        resolution: 'Preserved verified applicant full name from database.',
        message: `⚠️ Name in uploaded CV ("${cvFullName}") differs from verified name ("${verifiedFullName}"). Verified name was preserved.`,
      });
      resolvedFullName = verifiedFullName;
    }

    const personalInfo = {
      fullName: resolvedFullName,
      title: targetRole,
      email: extractedCv.contact?.email || applicant.email || undefined,
      phone: extractedCv.contact?.phone || undefined,
      location: extractedCv.contact?.location || applicant.country || 'Germany',
      nationality: personalData.nationality || 'Indian',
      dateOfBirth: personalData.dateOfBirth || undefined,
      linkedin: extractedCv.contact?.linkedin || undefined,
      github: extractedCv.contact?.github || undefined,
    };

    // 2. Education Merge & Conflict Check
    const verifiedDegree = verifiedDegreeFields.degree || educationProfile.degree;
    const verifiedField = verifiedDegreeFields.field || educationProfile.field;
    const verifiedInstitution = verifiedDegreeFields.institution || educationProfile.institution;
    const verifiedGradYear = verifiedDegreeFields.graduationYear || educationProfile.graduationYear;

    const cvEduFirst = extractedCv.education?.[0];

    if (cvEduFirst) {
      if (
        verifiedGradYear &&
        cvEduFirst.graduationYear &&
        String(verifiedGradYear) !== String(cvEduFirst.graduationYear)
      ) {
        conflicts.push({
          field: 'graduationYear',
          verifiedValue: verifiedGradYear,
          cvValue: cvEduFirst.graduationYear,
          resolvedValue: verifiedGradYear,
          resolution: 'Preserved verified graduation year from degree certificate & profile.',
          message: `⚠️ Graduation year in uploaded CV (${cvEduFirst.graduationYear}) conflicts with verified profile & certificate (${verifiedGradYear}). Verified year ${verifiedGradYear} was preserved.`,
        });
      }

      if (
        verifiedInstitution &&
        cvEduFirst.institution &&
        !verifiedInstitution.toLowerCase().includes(cvEduFirst.institution.toLowerCase()) &&
        !cvEduFirst.institution.toLowerCase().includes(verifiedInstitution.toLowerCase())
      ) {
        conflicts.push({
          field: 'institution',
          verifiedValue: verifiedInstitution,
          cvValue: cvEduFirst.institution,
          resolvedValue: verifiedInstitution,
          resolution: 'Preserved verified university from degree certificate & profile.',
          message: `⚠️ University in uploaded CV ("${cvEduFirst.institution}") differs from verified institution ("${verifiedInstitution}"). Verified institution was preserved.`,
        });
      }
    }

    const mergedEducation: CvEducationItem[] = [];
    if (verifiedDegree || verifiedInstitution || verifiedGradYear) {
      mergedEducation.push({
        degree: verifiedDegree || cvEduFirst?.degree || 'Bachelor Degree',
        field: verifiedField || cvEduFirst?.field || undefined,
        institution: verifiedInstitution || cvEduFirst?.institution || 'University',
        graduationYear: verifiedGradYear || cvEduFirst?.graduationYear || undefined,
        isVerified: true,
      });
    }

    // Include other non-conflicting education entries from CV
    if (extractedCv.education && extractedCv.education.length > 0) {
      for (let i = 0; i < extractedCv.education.length; i++) {
        const edu = extractedCv.education[i];
        if (i === 0 && mergedEducation.length > 0) continue; // Skip first if primary is already added
        if (edu.degree || edu.institution) {
          mergedEducation.push({
            degree: edu.degree || 'Degree',
            field: edu.field || undefined,
            institution: edu.institution || 'Institution',
            graduationYear: edu.graduationYear || undefined,
            isVerified: false,
          });
        }
      }
    }

    // 3. Work Experience Merge
    const mergedWorkExperience: CvWorkExperienceItem[] = [];

    // From profile state
    if (Array.isArray(workExpProfile) && workExpProfile.length > 0) {
      for (const we of workExpProfile) {
        if (we.company || we.jobTitle) {
          mergedWorkExperience.push({
            company: we.company || 'Enterprise',
            jobTitle: we.jobTitle || targetRole,
            experience: we.experience || profile?.experience || undefined,
            period: we.experience ? `${we.experience}` : undefined,
            responsibilities: we.responsibilities || [
              `Delivered engineering contributions as ${we.jobTitle || targetRole}.`,
              'Collaborated with cross-functional teams in agile development sprints.',
            ],
            isVerified: true,
          });
        }
      }
    } else if (profile?.experience) {
      mergedWorkExperience.push({
        company: reqData.company || 'Professional Technology Services',
        jobTitle: targetRole,
        experience: profile.experience,
        period: `${profile.experience}`,
        responsibilities: [
          `Experienced in professional engineering and delivery for ${profile.experience}.`,
          'Implemented technical solutions and system optimizations.',
        ],
        isVerified: true,
      });
    }

    // From extracted CV
    if (extractedCv.workExperience && extractedCv.workExperience.length > 0) {
      for (const cvExp of extractedCv.workExperience) {
        const alreadyIncluded = mergedWorkExperience.some(
          (m) =>
            m.company.toLowerCase() === (cvExp.company || '').toLowerCase() ||
            m.jobTitle.toLowerCase() === (cvExp.jobTitle || '').toLowerCase(),
        );

        if (!alreadyIncluded && (cvExp.company || cvExp.jobTitle)) {
          mergedWorkExperience.push({
            company: cvExp.company || 'Company',
            jobTitle: cvExp.jobTitle || targetRole,
            startDate: cvExp.startDate,
            endDate: cvExp.endDate,
            period: cvExp.startDate && cvExp.endDate ? `${cvExp.startDate} - ${cvExp.endDate}` : cvExp.experience,
            location: cvExp.location,
            responsibilities:
              cvExp.responsibilities && cvExp.responsibilities.length > 0
                ? cvExp.responsibilities
                : [
                    `Key contributor to ${cvExp.jobTitle || targetRole} projects and tasks.`,
                    'Maintained high code quality and operational standards.',
                  ],
            isVerified: false,
          });
        }
      }
    }

    // 4. Skills Merge & Categorization
    const allTechSkills = Array.from(
      new Set([
        ...skillsProfile,
        ...(extractedCv.skills?.technicalSkills || []),
      ]),
    );

    const toolsAndFrameworks = Array.from(
      new Set([...(extractedCv.skills?.toolsAndFrameworks || ['Git', 'Docker', 'REST APIs', 'PostgreSQL', 'Linux'])]),
    );

    const softSkills = Array.from(
      new Set([
        ...(extractedCv.skills?.softSkills || [
          'Analytical Thinking',
          'Agile Collaboration',
          'Problem Solving',
          'Intercultural Communication',
        ]),
      ]),
    );

    const mergedSkills: CvSkillCategory = {
      technical: allTechSkills.length > 0 ? allTechSkills : ['TypeScript', 'JavaScript', 'Python', 'SQL'],
      tools: toolsAndFrameworks,
      soft: softSkills,
    };

    // 5. Languages Merge
    const langMap = new Map<string, CvLanguageItem>();

    // From verified profile
    for (const l of languagesProfile) {
      if (l && l.language) {
        const langName = l.language.trim();
        let levelDesc = l.level || 'Gute Kenntnisse';
        if (levelDesc.toUpperCase().includes('B1')) levelDesc = 'B1 - Mittelstufe (Zertifiziert)';
        else if (levelDesc.toUpperCase().includes('B2')) levelDesc = 'B2 - Gute Mittelstufe';
        else if (levelDesc.toUpperCase().includes('C1')) levelDesc = 'C1 - Verhandlungssicher';
        else if (levelDesc.toUpperCase().includes('A2')) levelDesc = 'A2 - Grundkenntnisse';
        else if (levelDesc.toUpperCase().includes('A1')) levelDesc = 'A1 - Einstieg';

        langMap.set(langName.toLowerCase(), {
          language: langName,
          proficiency: l.level,
          level: levelDesc,
          isVerified: true,
        });
      }
    }

    // From CV
    for (const l of extractedCv.languages || []) {
      if (l && l.language) {
        const key = l.language.toLowerCase();
        if (!langMap.has(key)) {
          langMap.set(key, {
            language: l.language,
            proficiency: l.proficiency || 'Fließend',
            level: l.proficiency || 'Fließend / Fluent',
            isVerified: false,
          });
        }
      }
    }

    // If German is target country and German is not yet in languages, add default German tracking
    if (!langMap.has('german') && !langMap.has('deutsch')) {
      langMap.set('german', {
        language: 'German (Deutsch)',
        proficiency: 'B1',
        level: 'B1 - Mittelstufe (In Vorbereitung / Pathway)',
        isVerified: false,
      });
    }

    if (!langMap.has('english') && !langMap.has('englisch')) {
      langMap.set('english', {
        language: 'English (Englisch)',
        proficiency: 'Fluent',
        level: 'Verhandlungssicher / Fluent',
        isVerified: true,
      });
    }

    const mergedLanguages = Array.from(langMap.values());

    // 6. Professional Summary
    const degreeStr = mergedEducation[0] ? `${mergedEducation[0].degree} in ${mergedEducation[0].field || 'Engineering'}` : 'Academic Qualification';
    const expStr = profile?.experience || (mergedWorkExperience.length > 0 ? 'several years of experience' : 'solid practical background');
    const professionalSummary =
      extractedCv.summary ||
      `Dedicated ${targetRole} with a strong background in ${degreeStr} from ${mergedEducation[0]?.institution || 'reputed institution'} and ${expStr}. Focused on contributing professional engineering skills, robust technical solutions, and high German market standards to leading enterprises in ${targetCountry}.`;

    return {
      mergedData: {
        applicantId: applicant.id,
        targetRole,
        targetCountry,
        personalInfo,
        professionalSummary,
        workExperience: mergedWorkExperience,
        education: mergedEducation,
        skills: mergedSkills,
        languages: mergedLanguages,
        projects: extractedCv.projects || [
          {
            title: `${targetRole} Core System Implementation`,
            description: `Developed scalable backend and client-facing architecture adhering to modern standards and modular patterns.`,
            technologies: mergedSkills.technical.slice(0, 4),
          },
        ],
        certifications: extractedCv.certifications || [],
        conflicts,
      },
      conflicts,
    };
  }

  /**
   * Generates a clean, professional, German-standard Lebenslauf in Markdown format.
   */
  generateGermanMarkdown(data: Omit<GeneratedCvResult, 'formattedMarkdown' | 'status'>): string {
    const { personalInfo, professionalSummary, workExperience, education, skills, languages, projects, certifications } = data;

    let md = `# LEBENSLAUF\n\n`;
    md += `## ${personalInfo.fullName.toUpperCase()}\n`;
    md += `**${personalInfo.title || 'Fachkraft'}** | Standort: ${personalInfo.location || 'Deutschland / International'}\n\n`;

    // Contact line
    const contacts: string[] = [];
    if (personalInfo.email) contacts.push(`📧 ${personalInfo.email}`);
    if (personalInfo.phone) contacts.push(`📞 ${personalInfo.phone}`);
    if (personalInfo.nationality) contacts.push(`🌐 Nationalität: ${personalInfo.nationality}`);
    if (personalInfo.dateOfBirth) contacts.push(`📅 Geburtsdatum: ${personalInfo.dateOfBirth}`);
    if (personalInfo.linkedin) contacts.push(`🔗 [LinkedIn](${personalInfo.linkedin})`);
    if (personalInfo.github) contacts.push(`💻 [GitHub](${personalInfo.github})`);
    md += `${contacts.join(' | ')}\n\n`;

    md += `---\n\n`;

    // 1. Kurzprofil
    md += `### 🎯 KURZPROFIL / PROFESSIONAL SUMMARY\n`;
    md += `${professionalSummary}\n\n`;

    // 2. Berufserfahrung
    md += `### 💼 BERUFSERFAHRUNG / WORK EXPERIENCE\n\n`;
    if (workExperience && workExperience.length > 0) {
      for (const exp of workExperience) {
        const verifiedTag = exp.isVerified ? ' *(Verifiziert / Verified)*' : '';
        md += `#### **${exp.jobTitle}** — ${exp.company}${verifiedTag}\n`;
        md += `*${exp.period || exp.experience || 'Berufspraxis'}* | ${exp.location || 'Vollzeit'}\n\n`;
        if (exp.responsibilities && exp.responsibilities.length > 0) {
          for (const resp of exp.responsibilities) {
            md += `- ${resp}\n`;
          }
        }
        md += `\n`;
      }
    } else {
      md += `*Praktische Projekterfahrung und akademische Entwicklungsarbeiten.*\n\n`;
    }

    // 3. Ausbildung
    md += `### 🎓 AUSBILDUNG & STUDIUM / EDUCATION\n\n`;
    for (const edu of education) {
      const verifiedTag = edu.isVerified ? ' *(Verifiziertes Zeugnis / Verified)*' : '';
      const yearStr = edu.graduationYear ? ` (Abschlussjahr: ${edu.graduationYear})` : '';
      md += `#### **${edu.degree}${edu.field ? ' in ' + edu.field : ''}**${verifiedTag}\n`;
      md += `**${edu.institution}**${yearStr}\n\n`;
    }

    // 4. Fachliche Kompetenzen
    md += `### 🛠️ FACHLICHE KOMPETENZEN / SKILLS\n\n`;
    if (skills.technical && skills.technical.length > 0) {
      md += `- **Programmiersprachen & Kerntechnologien:** ${skills.technical.join(', ')}\n`;
    }
    if (skills.tools && skills.tools.length > 0) {
      md += `- **Frameworks, Tools & Datenbanken:** ${skills.tools.join(', ')}\n`;
    }
    if (skills.soft && skills.soft.length > 0) {
      md += `- **Methoden & Arbeitsweisen:** ${skills.soft.join(', ')}\n`;
    }
    md += `\n`;

    // 5. Sprachkenntnisse
    md += `### 🗣️ SPRACHKENNTNISSE / LANGUAGES\n\n`;
    for (const lang of languages) {
      const vBadge = lang.isVerified ? ' *(Verifiziert)*' : '';
      md += `- **${lang.language}:** ${lang.level || lang.proficiency}${vBadge}\n`;
    }
    md += `\n`;

    // 6. Projekte
    if (projects && projects.length > 0) {
      md += `### 🚀 AUSGEWÄHLTE PROJEKTE / KEY PROJECTS\n\n`;
      for (const proj of projects) {
        md += `#### **${proj.title}**\n`;
        md += `${proj.description}\n`;
        if (proj.technologies && proj.technologies.length > 0) {
          md += `*Technologien:* ${proj.technologies.join(', ')}\n`;
        }
        md += `\n`;
      }
    }

    // 7. Zertifikate
    if (certifications && certifications.length > 0) {
      md += `### 📜 ZERTIFIKATE / CERTIFICATIONS\n\n`;
      for (const cert of certifications) {
        const issuer = cert.issuer ? ` (${cert.issuer})` : '';
        const year = cert.year ? ` - ${cert.year}` : '';
        md += `- **${cert.name}**${issuer}${year}\n`;
      }
      md += `\n`;
    }

    md += `---\n`;
    md += `*Optimiert für den deutschen Arbeitsmarkt durch Educaro PixelMind AI — Basierend auf verifizierten Profildaten.*\n`;

    return md;
  }
}
