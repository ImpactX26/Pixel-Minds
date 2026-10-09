import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Applicant } from './entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Journey } from '../journey/entities/journey.entity';
import { Document } from '../documents/entities/document.entity';
import { Qualification } from '../qualification/entities/qualification.entity';
import { NextAction } from '../next-action/entities/next-action.entity';
import {
  JourneyStage,
  DocumentStatus,
  QualificationStatus,
  RequirementStatus,
  ActionPriority,
  ActionStatus,
} from '../common/enums';
import { resolveApplicantUuid } from '../common/utils/uuid.util';
import { CvService } from '../cv/cv.service';

@Injectable()
export class DemoSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Journey)
    private readonly journeyRepository: Repository<Journey>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Qualification)
    private readonly qualificationRepository: Repository<Qualification>,
    @InjectRepository(NextAction)
    private readonly nextActionRepository: Repository<NextAction>,
    private readonly cvService: CvService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const isDemoDisabled = this.configService.get<string>('DEMO_MODE') === 'false';
    if (!isDemoDisabled) {
      this.logger.log('Ensuring pre-configured applicant records are seeded...');
      await this.seedAllDemoApplicants();
    }
  }

  /**
   * Seeds the 3 demo accounts:
   * 1. Fully populated demo applicant (ID / Email: abc / abc@demo.pixelmind.ai)
   * 2. Fresh demo applicant 1 (Sarah Mitchell - Nurse)
   * 3. Fresh demo applicant 2 (Devon Chen - Cloud Architect)
   */
  async seedAllDemoApplicants() {
    try {
      await this.seedFullyPopulatedDemo();
      await this.seedFreshDemo1();
      await this.seedFreshDemo2();
      this.logger.log('Demo seeding complete.');
    } catch (err) {
      this.logger.warn(`Demo seeding note: ${err.message}`);
    }
  }

  async seedFullyPopulatedDemo(): Promise<Applicant> {
    const id = resolveApplicantUuid('demo-fully-populated-123');

    let applicant = await this.applicantRepository.findOne({ where: [{ id }, { email: 'abc@demo.pixelmind.ai' }] });
    if (!applicant) {
      applicant = this.applicantRepository.create({
        id,
        name: 'Rahul Sharma',
        email: 'abc@demo.pixelmind.ai',
        phone: '+49 152 12345678',
        country: 'India',
        goal: 'Software Engineer in Germany at BMW',
      });
      applicant = await this.applicantRepository.save(applicant);
    } else {
      applicant.name = 'Rahul Sharma';
      await this.applicantRepository.save(applicant);
    }

    const actualId = applicant.id;

    // 1. Journey
    let journey = await this.journeyRepository.findOne({ where: { applicantId: actualId } });
    if (!journey) {
      journey = this.journeyRepository.create({
        applicantId: actualId,
        currentStage: JourneyStage.COMPLETED,
        progress: 100,
        status: 'COMPLETED',
      });
      await this.journeyRepository.save(journey);
    }

    // 2. Profile
    let profile = await this.profileRepository.findOne({ where: { applicantId: actualId } });
    if (!profile) {
      profile = this.profileRepository.create({
        applicantId: actualId,
        education: {
          degree: 'B.Tech',
          field: 'Information Science and Engineering',
          institution: 'RNSIT',
          graduationYear: 2026,
        },
        experience: '2 years',
        skills: ['Python', 'Java', 'TypeScript', 'React', 'Node.js', 'Docker', 'AWS', 'PostgreSQL'],
        languages: [
          { language: 'English', level: 'C1' },
          { language: 'German', level: 'B2' },
        ],
        workExperience: [
          {
            company: 'Infosys',
            jobTitle: 'Software Developer',
            experience: '2 years',
            startDate: '2024-01-01',
            endDate: 'Present',
          },
        ],
        additionalInfo: {
          personal: {
            fullName: 'Rahul Sharma',
            dateOfBirth: '1998-07-24',
            nationality: 'Indian',
          },
        },
      });
      await this.profileRepository.save(profile);
    } else {
      profile.additionalInfo = {
        ...(profile.additionalInfo || {}),
        personal: {
          ...(profile.additionalInfo?.personal || {}),
          fullName: 'Rahul Sharma',
        },
      };
      await this.profileRepository.save(profile);
    }

    // 3. Documents (Pre-verified)
    const docDegreeId = resolveApplicantUuid('demo-doc-degree-123');
    let docDegree = await this.documentRepository.findOne({ where: { id: docDegreeId } });
    if (!docDegree) {
      docDegree = this.documentRepository.create({
        id: docDegreeId,
        applicantId: actualId,
        name: 'Degree_Certificate_RNSIT.pdf',
        type: 'DEGREE_CERTIFICATE',
        fileUrl: '/demo-files/DEMO_ONLY_Degree_Certificate_Matching.pdf',
        status: DocumentStatus.VERIFIED,
        extractedData: {
          fullName: 'Rahul Sharma',
          degree: 'B.Tech',
          field: 'Information Science and Engineering',
          institution: 'RNSIT',
          graduationYear: 2026,
          verificationResult: {
            documentId: docDegreeId,
            documentType: 'DEGREE_CERTIFICATE',
            overallStatus: 'VERIFIED',
            clarificationRequired: false,
            clarificationMessage: null,
            fields: [
              { field: 'fullName', profileValue: 'Rahul Sharma', documentValue: 'Rahul Sharma', status: 'MATCH', provenance: 'MATCH' },
              { field: 'degree', profileValue: 'B.Tech', documentValue: 'B.Tech', status: 'MATCH', provenance: 'MATCH' },
              { field: 'institution', profileValue: 'RNSIT', documentValue: 'RNSIT', status: 'MATCH', provenance: 'MATCH' },
              { field: 'graduationYear', profileValue: 2026, documentValue: 2026, status: 'MATCH', provenance: 'MATCH' },
            ],
          },
        },
      });
      await this.documentRepository.save(docDegree);
    }

    const docLangId = resolveApplicantUuid('demo-doc-language-123');
    let docLang = await this.documentRepository.findOne({ where: { id: docLangId } });
    if (!docLang) {
      docLang = this.documentRepository.create({
        id: docLangId,
        applicantId: actualId,
        name: 'Language_Certificate_Goethe_B2.pdf',
        type: 'LANGUAGE_CERTIFICATE',
        fileUrl: '/demo-files/DEMO_ONLY_Language_Certificate_Matching.pdf',
        status: DocumentStatus.VERIFIED,
        extractedData: {
          fullName: 'Rahul Sharma',
          language: 'German',
          proficiency: 'B2',
          verificationResult: {
            documentId: docLangId,
            documentType: 'LANGUAGE_CERTIFICATE',
            overallStatus: 'VERIFIED',
            clarificationRequired: false,
            clarificationMessage: null,
            fields: [
              { field: 'fullName', profileValue: 'Rahul Sharma', documentValue: 'Rahul Sharma', status: 'MATCH', provenance: 'MATCH' },
              { field: 'language', profileValue: 'German', documentValue: 'German', status: 'MATCH', provenance: 'MATCH' },
              { field: 'proficiency', profileValue: 'B2', documentValue: 'B2', status: 'MATCH', provenance: 'MATCH' },
            ],
          },
        },
      });
      await this.documentRepository.save(docLang);
    }

    // 4. Qualification
    let qual = await this.qualificationRepository.findOne({ where: { applicantId: actualId } });
    if (!qual) {
      qual = this.qualificationRepository.create({
        applicantId: actualId,
        status: QualificationStatus.QUALIFIED,
        requirements: [
          { code: 'DEGREE_CERTIFICATE', category: 'DOCUMENTS', name: 'University Degree (B.Tech)', required: true, status: RequirementStatus.SATISFIED },
          { code: 'GERMAN_B2', category: 'LANGUAGE', name: 'German B2 Goethe Certificate', required: true, status: RequirementStatus.SATISFIED },
          { code: 'WORK_EXPERIENCE', category: 'WORK', name: '2+ Years IT Industry Experience', required: true, status: RequirementStatus.SATISFIED },
          { code: 'PASSPORT', category: 'DOCUMENTS', name: 'Valid International Passport', required: true, status: RequirementStatus.SATISFIED },
        ],
        completedRequirements: [
          { code: 'DEGREE_CERTIFICATE', name: 'University Degree (B.Tech)' },
          { code: 'GERMAN_B2', name: 'German B2 Goethe Certificate' },
          { code: 'WORK_EXPERIENCE', name: '2+ Years IT Industry Experience' },
          { code: 'PASSPORT', name: 'Valid International Passport' },
        ],
        missingRequirements: [],
      });
      await this.qualificationRepository.save(qual);
    }

    // 5. Next Actions
    const actionCount = await this.nextActionRepository.count({ where: { applicantId: actualId } });
    if (actionCount === 0) {
      const action1 = this.nextActionRepository.create({
        applicantId: actualId,
        action: 'SCHEDULE_VISA',
        title: 'Schedule German Embassy Visa Appointment',
        reason: 'All requirements, qualifications, and documents are verified. You can now book your national visa appointment.',
        status: ActionStatus.IN_PROGRESS,
        priority: ActionPriority.HIGH,
      });
      const action2 = this.nextActionRepository.create({
        applicantId: actualId,
        action: 'RELOCATION_CHECKLIST',
        title: 'Review Relocation Checklist & Blocked Account',
        reason: 'Prepare city registration (Anmeldung) and accommodation documents for Munich.',
        status: ActionStatus.IN_PROGRESS,
        priority: ActionPriority.MEDIUM,
      });
      await this.nextActionRepository.save([action1, action2]);
    }

    // 6. Pre-generate and store approved CV
    await this.cvService.saveCv({
      applicantId: actualId,
      cvData: {
        applicantId: actualId,
        personalInfo: {
          fullName: 'Rahul Sharma',
          email: 'rahul.sharma@demo.pixelmind.ai',
          phone: '+49 152 12345678',
          location: 'Munich, Germany',
          nationality: 'Indian',
          title: 'Software Engineer',
        },
        professionalSummary: 'Results-driven Software Engineer with 2+ years of full-stack engineering experience specializing in high-performance distributed systems, Python, TypeScript, and modern cloud architecture.',
        workExperience: [
          {
            company: 'Infosys',
            jobTitle: 'Software Developer',
            location: 'Bangalore / Munich',
            startDate: '2024-01-01',
            endDate: 'Present',
            responsibilities: [
              'Architected scalable backend microservices reducing API latency by 35%.',
              'Developed enterprise full-stack features with React and Node.js.',
            ],
          },
        ],
        education: [
          {
            degree: 'Bachelor of Technology (B.Tech)',
            field: 'Information Science & Engineering',
            institution: 'RNSIT',
            graduationYear: 2026,
            grade: 'First Class with Distinction',
          },
        ],
        skills: {
          technical: ['Python', 'Java', 'TypeScript', 'React', 'Node.js', 'Docker', 'AWS', 'PostgreSQL'],
          tools: ['Git', 'Docker', 'Kubernetes', 'Jira', 'Postman'],
          soft: ['Problem Solving', 'Agile Teamwork', 'Cross-Cultural Communication'],
        },
        languages: [
          { language: 'English', proficiency: 'C1 - Fluent' },
          { language: 'German', proficiency: 'B2 - Certified (Goethe)' },
        ],
        conflicts: [],
        status: 'APPROVED',
      },
    });

    applicant.journey = journey;
    applicant.profile = profile;
    return applicant;
  }

  async seedFreshDemo1(): Promise<Applicant> {
    const id = resolveApplicantUuid('demo-fresh-1');
    let applicant = await this.applicantRepository.findOne({ where: [{ id }, { email: 'demo.fresh1@pixelmind.ai' }] });
    if (!applicant) {
      applicant = this.applicantRepository.create({
        id,
        name: 'Sarah Mitchell',
        email: 'demo.fresh1@pixelmind.ai',
        phone: '+44 7700 900077',
        country: 'United Kingdom',
        goal: 'Registered Nurse in Germany',
      });
      applicant = await this.applicantRepository.save(applicant);
    } else {
      applicant.name = 'Sarah Mitchell';
      applicant.goal = 'Registered Nurse in Germany';
      applicant.country = 'United Kingdom';
      await this.applicantRepository.save(applicant);
    }

    const actualId = applicant.id;

    let journey = await this.journeyRepository.findOne({ where: { applicantId: actualId } });
    if (!journey) {
      journey = this.journeyRepository.create({
        applicantId: actualId,
        currentStage: JourneyStage.STARTED,
        progress: 10,
        status: 'IN_PROGRESS',
      });
      await this.journeyRepository.save(journey);
    }

    let profile = await this.profileRepository.findOne({ where: { applicantId: actualId } });
    if (!profile) {
      profile = this.profileRepository.create({
        applicantId: actualId,
        education: {
          degree: 'B.Sc',
          field: 'Nursing',
          institution: "King's College London",
          graduationYear: 2022,
        },
        experience: '3 years',
        skills: ['Patient Care', 'Emergency Nursing', 'Clinical Assessment'],
        languages: [{ language: 'English', level: 'Native' }],
        workExperience: [
          {
            company: 'NHS Trust Hospital',
            jobTitle: 'Registered Nurse',
            experience: '3 years',
            startDate: '2022-09-01',
            endDate: 'Present',
          },
        ],
        additionalInfo: {
          personal: {
            fullName: 'Sarah Mitchell',
            dateOfBirth: '1999-04-12',
            nationality: 'British',
          },
        },
      });
      await this.profileRepository.save(profile);
    } else {
      profile.education = {
        degree: 'B.Sc',
        field: 'Nursing',
        institution: "King's College London",
        graduationYear: 2022,
      };
      profile.experience = '3 years';
      profile.skills = ['Patient Care', 'Emergency Nursing', 'Clinical Assessment'];
      profile.languages = [{ language: 'English', level: 'Native' }];
      profile.additionalInfo = {
        personal: {
          fullName: 'Sarah Mitchell',
          dateOfBirth: '1999-04-12',
          nationality: 'British',
        },
      };
      await this.profileRepository.save(profile);
    }
    applicant.journey = journey;
    applicant.profile = profile;
    return applicant;
  }

  async seedFreshDemo2(): Promise<Applicant> {
    const id = resolveApplicantUuid('demo-fresh-2');
    let applicant = await this.applicantRepository.findOne({ where: [{ id }, { email: 'demo.fresh2@pixelmind.ai' }] });
    if (!applicant) {
      applicant = this.applicantRepository.create({
        id,
        name: 'Devon Chen',
        email: 'demo.fresh2@pixelmind.ai',
        phone: '+65 9123 4567',
        country: 'Singapore',
        goal: 'Cloud Architect in Germany',
      });
      applicant = await this.applicantRepository.save(applicant);
    } else {
      applicant.name = 'Devon Chen';
      applicant.goal = 'Cloud Architect in Germany';
      applicant.country = 'Singapore';
      await this.applicantRepository.save(applicant);
    }

    const actualId = applicant.id;

    let journey = await this.journeyRepository.findOne({ where: { applicantId: actualId } });
    if (!journey) {
      journey = this.journeyRepository.create({
        applicantId: actualId,
        currentStage: JourneyStage.DOCUMENT_COLLECTION,
        progress: 40,
        status: 'IN_PROGRESS',
      });
      await this.journeyRepository.save(journey);
    }

    let profile = await this.profileRepository.findOne({ where: { applicantId: actualId } });
    if (!profile) {
      profile = this.profileRepository.create({
        applicantId: actualId,
        education: {
          degree: "Master's",
          field: 'Cloud Computing',
          institution: 'National University of Singapore',
          graduationYear: 2023,
        },
        experience: '3 years',
        skills: ['AWS', 'Kubernetes', 'Terraform', 'Go'],
        languages: [{ language: 'English', level: 'Native' }],
        workExperience: [],
        additionalInfo: {
          personal: {
            fullName: 'Devon Chen',
            nationality: 'Singaporean',
          },
        },
      });
      await this.profileRepository.save(profile);
    }
    applicant.journey = journey;
    applicant.profile = profile;
    return applicant;
  }
}
