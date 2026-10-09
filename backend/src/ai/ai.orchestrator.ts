import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Journey } from '../journey/entities/journey.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { ConversationChannel, MessageSender, RequirementStatus } from '../common/enums';
import { QualificationService } from '../qualification/qualification.service';
import { NextActionService } from '../next-action/next-action.service';
import { IntentDetectorService } from './services/intent-detector.service';
import { LlmService } from './services/llm.service';
import { ElevenLabsService } from './services/elevenlabs.service';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponse, AiIntent, RequirementData, ProfileData, ApplicantContextSnapshot } from './interfaces/ai-chat.interface';

import { DocumentsService } from '../documents/documents.service';

import { resolveApplicantUuid } from '../common/utils/uuid.util';

@Injectable()
export class AiOrchestrator {
  private readonly logger = new Logger(AiOrchestrator.name);
  private static readonly requirementStore = new Map<string, RequirementData>();
  private static readonly profileStore = new Map<string, ProfileData>();

  static getStoredProfile(applicantId: string): ProfileData {
    return this.profileStore.get(applicantId) || {};
  }

  static getStoredRequirement(applicantId: string): RequirementData {
    return this.requirementStore.get(applicantId) || {};
  }

  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Journey)
    private readonly journeyRepository: Repository<Journey>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly qualificationService: QualificationService,
    private readonly nextActionService: NextActionService,
    private readonly intentDetector: IntentDetectorService,
    private readonly llmService: LlmService,
    private readonly elevenLabsService: ElevenLabsService,
  ) {}

  /**
   * Builds the complete, real-time ApplicantContextSnapshot directly from PostgreSQL tables and domain services.
   */
  async getApplicantContextSnapshot(applicantId: string): Promise<ApplicantContextSnapshot> {
    const applicantUuid = resolveApplicantUuid(applicantId);

    // 1. Applicant entity
    let applicantEntity: Applicant | null = null;
    try {
      applicantEntity = await this.applicantRepository.findOne({
        where: { id: applicantUuid },
      });
    } catch {}

    // 2. Profile & Requirements
    const profile = await this.getProfile(applicantId);
    const requirement = await this.getRequirement(applicantId);

    const applicant = {
      id: applicantEntity?.id || applicantUuid,
      name: profile.personal?.fullName || applicantEntity?.name || `Applicant ${applicantId}`,
      email: applicantEntity?.email || `applicant-${applicantId}@educaro.de`,
      country: profile.personal?.nationality || applicantEntity?.country || 'Germany',
      goal: applicantEntity?.goal || (requirement.role ? `${requirement.role} in ${requirement.country || 'Germany'}` : 'Career in Germany'),
    };

    // 3. Uploaded Documents
    let documents: any[] = [];
    try {
      const dbDocs = await this.documentRepository.find({
        where: { applicantId: applicantUuid },
        order: { uploadedAt: 'DESC' },
      });
      const memoryDocs = DocumentsService.getInMemoryDocsForApplicant(applicantId);
      const combinedMap = new Map<string, any>();

      for (const d of [...memoryDocs, ...dbDocs]) {
        if (!combinedMap.has(d.id)) {
          combinedMap.set(d.id, {
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status,
            uploadedAt: d.uploadedAt,
            extractedFields: d.extractedData?.extractedData || {},
            verificationResult: d.extractedData?.verificationResult || {
              overallStatus: d.status === 'verified' ? 'VERIFIED' : d.status === 'conflict' ? 'MISMATCH' : 'PENDING',
              clarificationRequired: d.status === 'conflict',
              clarificationMessage: d.extractedData?.verificationResult?.clarificationMessage || null,
              fieldMismatches: (d.extractedData?.verificationResult?.fields || []).filter((f: any) => f.status === 'MISMATCH'),
            },
          });
        }
      }
      documents = Array.from(combinedMap.values());
    } catch {}

    // 4. Qualification & Missing Documents
    let qualSummary: any = {
      status: 'PENDING',
      satisfied: 0,
      totalRequirements: 8,
      missingCount: 8,
      conflicts: 0,
      requirements: [],
    };
    try {
      qualSummary = await this.qualificationService.getLatestQualification(applicantUuid);
    } catch {
      try {
        qualSummary = await this.qualificationService.checkQualification(applicantUuid);
      } catch {}
    }

    const missingDocs: string[] = [];
    const verifiedTypes = new Set(
      documents.filter((d) => d.status === 'verified' || d.verificationResult?.overallStatus === 'VERIFIED').map((d) => d.type)
    );

    if (!verifiedTypes.has('DEGREE_CERTIFICATE') && !documents.some((d) => d.type === 'DEGREE_CERTIFICATE')) {
      missingDocs.push('DEGREE_CERTIFICATE');
    }
    if (!verifiedTypes.has('LANGUAGE_CERTIFICATE') && !documents.some((d) => d.type === 'LANGUAGE_CERTIFICATE')) {
      missingDocs.push('GERMAN_LANGUAGE_CERTIFICATE');
    }
    if (!verifiedTypes.has('PASSPORT') && !documents.some((d) => d.type === 'PASSPORT')) {
      missingDocs.push('PASSPORT');
    }

    // 5. Next Action
    let nextAction: any = null;
    try {
      nextAction = await this.nextActionService.getNextAction(applicantUuid);
    } catch {}

    // 6. Journey
    let journeyStage = 'REQUIREMENTS';
    let journeyProgress = 20;
    try {
      const journey = await this.journeyRepository.findOne({ where: { applicantId: applicantUuid } });
      if (journey) {
        journeyStage = journey.currentStage;
        journeyProgress = journey.progress;
      }
    } catch {}

    // 7. CV
    const hasCv = Boolean(profile.additionalInfo?.generatedCv || documents.some((d) => d.type === 'GENERATED_CV'));
    const isApproved = Boolean(profile.additionalInfo?.generatedCv?.status === 'APPROVED' || documents.some((d) => d.type === 'GENERATED_CV' && d.extractedData?.status === 'APPROVED'));

    return {
      applicantId,
      applicant,
      requirement,
      profile,
      documents,
      missingDocuments: missingDocs,
      qualification: {
        status: qualSummary?.status || 'PENDING',
        satisfied: qualSummary?.satisfied || 0,
        totalRequirements: qualSummary?.totalRequirements || 8,
        missingCount: qualSummary?.missing || missingDocs.length,
        conflicts: qualSummary?.conflicts || (documents.some((d) => d.status === 'conflict') ? 1 : 0),
        requirements: qualSummary?.requirements || [],
      },
      nextAction: nextAction ? {
        title: nextAction.title,
        action: nextAction.action,
        reason: nextAction.reason,
        priority: nextAction.priority,
        requirementCode: nextAction.requirementCode,
      } : null,
      journey: {
        currentStage: journeyStage,
        progress: journeyProgress,
      },
      cv: {
        hasCv,
        isApproved,
      },
    };
  }

  /**
   * Process a user chat message through the AI Orchestrator coordination layer using Gemini LLM.
   */
  async processChat(dto: ChatRequestDto): Promise<ChatResponse> {
    const applicantId = dto.applicantId || 'default';
    const applicantUuid = resolveApplicantUuid(applicantId);
    const message = dto.message;

    // 1. Detect intent
    const intent = this.intentDetector.detectIntent(message);

    // 2. Build live ApplicantContextSnapshot from database / source of truth
    const contextSnapshot = await this.getApplicantContextSnapshot(applicantId);

    // 3. Load recent conversation history
    let history: Array<{ sender: string; message: string }> = [];
    try {
      const convs = await this.conversationRepository.find({
        where: { applicantId: applicantUuid },
        order: { createdAt: 'DESC' },
        take: 6,
      });
      history = convs.reverse().map((c) => ({
        sender: c.sender,
        message: c.message,
      }));
    } catch {}

    // Step A: Explicit Profile Update Handling
    if (intent === 'UPDATE_PROFILE' || this.isProfileUpdateMessage(message)) {
      const updateResult = this.llmService.fallbackExtractProfile(message, contextSnapshot.profile);
      
      // Persist in DB and memory
      AiOrchestrator.profileStore.set(applicantId, updateResult.profile);
      await this.persistApplicantProfile(applicantId, updateResult.profile);

      try {
        await this.saveConversation(applicantId, message, updateResult.message);
      } catch {}

      this.logger.log(`Explicit profile update applied for applicant ${applicantId}: ${updateResult.message}`);

      return {
        applicantId,
        message: updateResult.message,
        stage: 'PROFILE',
        goalType: 'EMPLOYMENT',
        requirement: contextSnapshot.requirement,
        profile: updateResult.profile,
        missingInformation: updateResult.missingInformation,
        nextAction: updateResult.nextAction,
        intent: 'UPDATE_PROFILE',
      };
    }

    // If message contains profile info, extract and persist it
    if (this.isProfileMessage(message)) {
      const profExt = this.llmService.fallbackExtractProfile(message, contextSnapshot.profile);
      if (profExt.profile && JSON.stringify(profExt.profile) !== JSON.stringify(contextSnapshot.profile)) {
        contextSnapshot.profile = profExt.profile;
        AiOrchestrator.profileStore.set(applicantId, profExt.profile);
        await this.persistApplicantProfile(applicantId, profExt.profile);
      }
    }

    // Step B: Initial Onboarding Requirements check (when user has no role/country and states a goal)
    const wasRequirementComplete = Boolean(contextSnapshot.requirement.country && contextSnapshot.requirement.role);
    const isRequirementRelated = this.isRequirementMessage(message);

    if (!wasRequirementComplete && isRequirementRelated && intent === 'GENERAL_QUERY') {
      const reqResult = await this.llmService.extractRequirement(
        message,
        contextSnapshot.requirement,
        history,
      );

      if (reqResult.requirement.country || reqResult.requirement.role || reqResult.requirement.company) {
        const updatedReq = {
          ...contextSnapshot.requirement,
          ...(reqResult.requirement.country ? { country: reqResult.requirement.country } : {}),
          ...(reqResult.requirement.role ? { role: reqResult.requirement.role } : {}),
          ...(reqResult.requirement.company ? { company: reqResult.requirement.company } : {}),
        };
        AiOrchestrator.requirementStore.set(applicantId, updatedReq);
        await this.persistApplicantRequirement(applicantId, updatedReq);
        contextSnapshot.requirement = updatedReq;
      }

      try {
        await this.saveConversation(applicantId, message, reqResult.message);
      } catch {}

      return {
        applicantId,
        message: reqResult.message,
        stage: 'REQUIREMENTS',
        goalType: 'EMPLOYMENT',
        requirement: contextSnapshot.requirement,
        profile: contextSnapshot.profile,
        missingInformation: reqResult.missingInformation,
        nextAction: reqResult.nextAction,
        intent,
      };
    }

    // Step C: Context-Augmented Response Generation via Gemini LLM with Full Live Applicant Database Context
    const aiResult = await this.llmService.generateApplicantResponse(
      message,
      contextSnapshot,
      history,
      intent,
    );

    // If AI updated profile or requirements during response generation, persist them
    if (aiResult.profile && JSON.stringify(aiResult.profile) !== JSON.stringify(contextSnapshot.profile)) {
      AiOrchestrator.profileStore.set(applicantId, aiResult.profile);
      await this.persistApplicantProfile(applicantId, aiResult.profile);
    }
    if (aiResult.requirement && JSON.stringify(aiResult.requirement) !== JSON.stringify(contextSnapshot.requirement)) {
      AiOrchestrator.requirementStore.set(applicantId, aiResult.requirement);
      await this.persistApplicantRequirement(applicantId, aiResult.requirement);
    }

    try {
      await this.saveConversation(applicantId, message, aiResult.message);
    } catch {}

    return {
      applicantId,
      message: aiResult.message,
      stage: aiResult.stage || contextSnapshot.journey?.currentStage || 'PROFILE',
      goalType: 'EMPLOYMENT',
      requirement: aiResult.requirement || contextSnapshot.requirement,
      profile: aiResult.profile || contextSnapshot.profile,
      missingInformation: aiResult.missingInformation || [],
      nextAction: aiResult.nextAction || contextSnapshot.nextAction,
      intent: aiResult.intent || intent,
    };
  }

  private isProfileUpdateMessage(message: string): boolean {
    const lower = (message || '').toLowerCase();
    return (
      /\b(update|change|modify|set|correct|add|make|fix)\s+(?:my\s+)?(name|profile|details|degree|education|qualification|company|employer|job|role|skills|technical skills|language|languages|german|english|nationality|dob|date of birth|experience|work experience)\b/i.test(lower) ||
      /\b(change|update|set)\s+(?:my\s+)?name\s+(?:to|as|is)\b/i.test(lower) ||
      /\badd\s+(?:german|english|hindi|\w+)\s+(?:b1|b2|a1|a2|c1|c2|fluent|native)\b/i.test(lower)
    );
  }

  private isRequirementMessage(message: string): boolean {
    const lower = (message || '').toLowerCase();
    return (
      /\bwant to work\b|\blooking for a job\b|\bwant a job\b|\blooking to work\b|\bwork in\b|\bjob in\b/i.test(lower) ||
      /\bsoftware engineer\b|\bsoftware developer\b|\bnurse\b|\bnursing\b|\bdata scientist\b|\bdevops\b|\bmechanical engineer\b|\belectrical engineer\b/i.test(lower) ||
      /\bgermany\b|\bdeutschland\b|\bberlin\b|\bmunich\b/i.test(lower) ||
      /\bBMW\b|\bSiemens\b|\bSAP\b|\bMercedes\b|\bat\s+[A-Z]/i.test(message)
    );
  }

  private async persistApplicantRequirement(applicantId: string, requirement: RequirementData): Promise<void> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    try {
      let applicant = await this.applicantRepository.findOne({ where: { id: applicantUuid } });
      if (!applicant) {
        applicant = this.applicantRepository.create({
          id: applicantUuid,
          name: `Applicant ${applicantId}`,
          email: `applicant-${applicantId}@educaro.de`,
          country: requirement.country || 'Germany',
          goal: requirement.role ? `${requirement.role} in ${requirement.country || 'Germany'}` : null,
        });
        await this.applicantRepository.save(applicant);
      } else {
        if (requirement.country) applicant.country = requirement.country;
        if (requirement.role) {
          applicant.goal = `${requirement.role} in ${requirement.country || 'Germany'}`;
        }
        await this.applicantRepository.save(applicant);
      }
    } catch (dbErr) {
      this.logger.debug(`Could not update applicant requirement record: ${dbErr.message}`);
    }
  }

  private async persistApplicantProfile(applicantId: string, profile: ProfileData): Promise<void> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    try {
      // 1. Update/create Applicant entity (for fullName and country)
      let applicant = await this.applicantRepository.findOne({ where: { id: applicantUuid } });
      if (!applicant) {
        applicant = this.applicantRepository.create({
          id: applicantUuid,
          name: profile.personal?.fullName || `Applicant ${applicantId}`,
          email: `applicant-${applicantId}@educaro.de`,
          country: profile.personal?.nationality || 'India',
        });
        applicant = await this.applicantRepository.save(applicant);
      } else if (profile.personal?.fullName) {
        applicant.name = profile.personal.fullName;
        if (profile.personal?.nationality) {
          applicant.country = profile.personal.nationality;
        }
        await this.applicantRepository.save(applicant);
      }

      // 2. Update/create ApplicantProfile entity
      let profileEntity = await this.profileRepository.findOne({ where: { applicantId: applicantUuid } });
      if (!profileEntity) {
        profileEntity = this.profileRepository.create({ applicantId: applicantUuid });
      }

      // Persist personal data inside additionalInfo
      if (profile.personal) {
        profileEntity.additionalInfo = {
          ...(profileEntity.additionalInfo || {}),
          personal: profile.personal,
        };
      }

      if (profile.education) {
        profileEntity.education = profile.education;
      }
      if (profile.employment?.experience) {
        profileEntity.experience = profile.employment.experience;
      }
      if (profile.employment) {
        profileEntity.workExperience = [profile.employment];
      }
      if (profile.skills?.technicalSkills) {
        profileEntity.skills = profile.skills.technicalSkills;
      }
      if (profile.languages) {
        profileEntity.languages = profile.languages.map((l) => ({
          language: l.language,
          level: l.proficiency || l.level || 'Documented',
        }));
      }
      await this.profileRepository.save(profileEntity);
    } catch (dbErr) {
      this.logger.debug(`Could not update applicant profile in DB: ${dbErr.message}`);
    }
  }

  private isProfileMessage(message: string): boolean {
    const lower = (message || '').toLowerCase();
    return (
      /\b(update|change|modify|set|correct|make)\s+(?:my\s+)?(name|profile|details|degree|education|qualification|company|employer|job|role|skills|language|nationality)\b/i.test(lower) ||
      /\b(my\s+)?name\s+(?:is|as|to)\b/i.test(lower) ||
      /\bb\.?tech\b|\bb\.?sc\b|\bm\.?tech\b|\bm\.?sc\b|\bbachelor\b|\bmaster\b|\bdegree\b|\bcollege\b|\buniversity\b|\bgraduat/i.test(lower) ||
      /\bworked at\b|\bworking at\b|\byears? of experience\b|\byears? experience\b/i.test(lower) ||
      /\bskills?\b|\bpython\b|\bjava\b|\bc\+\+\b|\bjavascript\b|\btypescript\b|\breact\b|\bnode/i.test(lower) ||
      /\bspeak\b|\blanguages?\b|\bgerman is\b|\benglish is\b|\bb1\b|\bb2\b|\ba1\b|\ba2\b|\bc1\b|\bc2\b/i.test(lower) ||
      /\bborn on\b|\bnationality\b/i.test(lower)
    );
  }

  /**
   * Retrieves the current stored requirement for an applicant.
   */
  async getRequirement(applicantId: string): Promise<RequirementData> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    let stored = AiOrchestrator.requirementStore.get(applicantId) || {};
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicantId);
      const applicant = await this.applicantRepository.findOne({
        where: isUuid ? [{ id: applicantId }, { email: applicantId }] : [{ id: applicantUuid }, { email: applicantId }],
      });
      if (applicant) {
        if (applicant.country && !stored.country) stored.country = applicant.country;
        if (applicant.goal && !stored.role) {
          const parts = applicant.goal.split(' in ');
          stored.role = parts[0] || applicant.goal;
          if (parts[1] && !stored.country) stored.country = parts[1];
        }
      }
      AiOrchestrator.requirementStore.set(applicantId, stored);
    } catch {}
    return stored;
  }

  /**
   * Retrieves the current stored profile for an applicant from in-memory cache and PostgreSQL database.
   */
  async getProfile(applicantId: string): Promise<ProfileData> {
    const applicantUuid = resolveApplicantUuid(applicantId);
    let stored = AiOrchestrator.profileStore.get(applicantId) || {};
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicantId);
      const applicant = await this.applicantRepository.findOne({
        where: isUuid ? [{ id: applicantId }, { email: applicantId }] : [{ id: applicantUuid }, { email: applicantId }],
      });
      const dbProfile = await this.profileRepository.findOne({
        where: { applicantId: applicant?.id || applicantUuid },
      });

      const merged: ProfileData = {
        personal: {
          fullName: applicant?.name || dbProfile?.additionalInfo?.personal?.fullName || stored.personal?.fullName || '',
          dateOfBirth: dbProfile?.additionalInfo?.personal?.dateOfBirth || stored.personal?.dateOfBirth || '',
          nationality: applicant?.country || dbProfile?.additionalInfo?.personal?.nationality || stored.personal?.nationality || '',
        },
        education: {
          degree: dbProfile?.education?.degree || stored.education?.degree || '',
          field: dbProfile?.education?.field || stored.education?.field || '',
          institution: dbProfile?.education?.institution || stored.education?.institution || '',
          graduationYear: dbProfile?.education?.graduationYear || stored.education?.graduationYear || '',
        },
        employment: {
          company: dbProfile?.workExperience?.[0]?.company || dbProfile?.workExperience?.[0]?.institution || stored.employment?.company || '',
          jobTitle: dbProfile?.workExperience?.[0]?.jobTitle || dbProfile?.workExperience?.[0]?.role || stored.employment?.jobTitle || '',
          experience: dbProfile?.experience || stored.employment?.experience || '',
          startDate: dbProfile?.workExperience?.[0]?.startDate || stored.employment?.startDate || '',
          endDate: dbProfile?.workExperience?.[0]?.endDate || stored.employment?.endDate || '',
        },
        skills: {
          technicalSkills: Array.isArray(dbProfile?.skills) && dbProfile.skills.length > 0
            ? dbProfile.skills
            : (stored.skills?.technicalSkills || []),
          otherSkills: stored.skills?.otherSkills || [],
        },
        languages: Array.isArray(dbProfile?.languages) && dbProfile.languages.length > 0
          ? dbProfile.languages.map((l: any) => ({
              language: l.language || (l as any).name || '',
              proficiency: l.level || (l as any).proficiency || 'Documented',
            }))
          : (stored.languages || []),
      };

      AiOrchestrator.profileStore.set(applicantId, merged);
      return merged;
    } catch (err) {
      this.logger.warn(`Could not load profile from DB: ${err.message}`);
      return stored;
    }
  }

  private generateResponse(
    intent: AiIntent,
    applicant: Applicant,
    profile: ApplicantProfile | null,
    documents: Document[],
    journey: Journey | null,
    qualification: any,
    nextAction: any,
  ): string {
    switch (intent) {
      case 'GET_MISSING_DOCUMENTS':
        return this.handleMissingDocuments(qualification);

      case 'GET_QUALIFICATION':
        return this.handleQualification(qualification);

      case 'GET_NEXT_ACTION':
        return this.handleNextAction(nextAction);

      case 'GET_STATUS':
        return this.handleStatus(applicant, journey, qualification, nextAction);

      case 'GET_PROFILE':
        return this.handleProfile(applicant, profile);

      case 'UPLOAD_DOCUMENT':
        return `You can upload your documents through the Educaro Document Center. We support PDF, JPG, and PNG files up to 10MB. Your current recommended upload is: ${nextAction.title}.`;

      case 'UNKNOWN':
      default:
        return `I can assist you with your pathway to Germany! You can ask me about:\n- Missing documents ("What documents am I missing?")\n- Qualification check ("Am I qualified?")\n- Next steps ("What should I do next?")\n- Application status ("What is my application status?")\n- Profile overview ("What is my profile?")`;
    }
  }

  private handleMissingDocuments(qualification: any): string {
    const reqs = qualification.requirements || [];
    const missingDocs = reqs.filter(
      (r: any) =>
        r.required &&
        (r.category === 'DOCUMENTS' ||
          r.code === 'DEGREE_CERTIFICATE' ||
          r.code === 'PASSPORT' ||
          r.code === 'GERMAN_LANGUAGE_CERTIFICATE') &&
        (r.status === RequirementStatus.MISSING || r.status === RequirementStatus.INCOMPLETE),
    );

    if (missingDocs.length === 0) {
      return 'All your mandatory documents have been uploaded and verified! No documents are currently missing.';
    }

    const docNames = missingDocs.map((r: any) => {
      if (r.code === 'PASSPORT') return 'passport';
      if (r.code === 'DEGREE_CERTIFICATE') return 'degree certificate';
      if (r.code === 'GERMAN_LANGUAGE_CERTIFICATE') return 'German language certificate';
      return r.title.toLowerCase();
    });

    if (docNames.length === 1) {
      return `You are currently missing your ${docNames[0]}.`;
    }

    if (docNames.length === 2) {
      return `You are currently missing your ${docNames[0]} and ${docNames[1]}.`;
    }

    const last = docNames.pop();
    return `You are currently missing your ${docNames.join(', ')}, and ${last}.`;
  }

  private handleQualification(qualification: any): string {
    const status = qualification.status;
    const satisfied = qualification.satisfied || 0;
    const total = qualification.totalRequirements || 8;

    if (status === 'QUALIFIED') {
      return `Congratulations! You are fully QUALIFIED for your German pathway. All ${total} mandatory requirements are satisfied.`;
    }

    if (status === 'CONFLICT') {
      const conflictReq = (qualification.requirements || []).find(
        (r: any) => r.status === RequirementStatus.CONFLICT,
      );
      return `A conflict has been detected in your qualification (${conflictReq?.reason || 'data mismatch'}). Please resolve this discrepancy.`;
    }

    if (status === 'PENDING') {
      return `Your qualification is currently PENDING verification (${satisfied}/${total} requirements satisfied). Document extraction is under manual review.`;
    }

    return `Your qualification status is currently INCOMPLETE. You have satisfied ${satisfied} out of ${total} requirements.`;
  }

  private handleNextAction(nextAction: any): string {
    if (!nextAction || !nextAction.title) {
      return 'No pending actions required at this moment. Your application is up to date.';
    }

    return `Your recommended next action is: "${nextAction.title}". ${nextAction.reason || ''}`.trim();
  }

  private handleStatus(
    applicant: Applicant,
    journey: Journey | null,
    qualification: any,
    nextAction: any,
  ): string {
    const stage = journey?.currentStage || 'STARTED';
    const progress = journey?.progress || 0;
    const qualStatus = qualification.status || 'PENDING';

    return `Application Status for ${applicant.name}: Stage is ${stage} with ${progress}% progress. Qualification status is ${qualStatus}. Next action: ${nextAction.title}.`;
  }

  private handleProfile(applicant: Applicant, profile: ApplicantProfile | null): string {
    const name = applicant.name;
    const email = applicant.email;
    const goal = applicant.goal || 'Not specified';
    const education = profile?.education || {};
    const degree = education.degree || 'Not provided';
    const university = education.university || 'Not provided';
    const languages = (profile?.languages || [])
      .map((l: any) => `${l.language || l.name || ''} (${l.level || 'Documented'})`)
      .join(', ') || 'None recorded';

    return `Profile Summary for ${name}:\n- Email: ${email}\n- Target Goal: ${goal}\n- Education: ${degree} from ${university}\n- Languages: ${languages}`;
  }

  private async saveConversation(
    applicantId: string,
    userMessage: string,
    assistantResponse: string,
  ): Promise<void> {
    // 1. Record in-memory for instant reliable retrieval
    ConversationsService.record(applicantId, 'user', userMessage);
    ConversationsService.record(applicantId, 'ai', assistantResponse);

    try {
      // 2. User message in DB
      const userConv = this.conversationRepository.create({
        applicantId,
        channel: ConversationChannel.WEB,
        sender: MessageSender.APPLICANT,
        message: userMessage,
      });
      await this.conversationRepository.save(userConv);

      // 3. AI Assistant message in DB
      const aiConv = this.conversationRepository.create({
        applicantId,
        channel: ConversationChannel.WEB,
        sender: MessageSender.AI,
        message: assistantResponse,
      });
      await this.conversationRepository.save(aiConv);
    } catch (err) {
      this.logger.debug(`Failed to record conversation in DB for applicant ${applicantId}: ${err.message}`);
    }
  }

  /**
   * Processes voice audio from user:
   * 1. Transcribes via ElevenLabs STT (model: scribe_v2)
   * 2. Runs existing multi-turn chat pipeline (Gemini LLM + PostgreSQL state & history)
   * 3. Generates spoken AI response audio via ElevenLabs TTS (model: eleven_multilingual_v2)
   */
  async processVoiceChat(params: {
    applicantId?: string;
    fileBuffer?: Buffer;
    fileName?: string;
    mimeType?: string;
    audioBase64?: string;
  }): Promise<{
    userText: string;
    message: string;
    reply: string;
    audioBase64?: string | null;
    stage?: string;
    requirement?: any;
    profile?: any;
    nextAction?: any;
    intent?: any;
  }> {
    const applicantId = params.applicantId || '123';
    let fileBuffer = params.fileBuffer;
    const fileName = params.fileName || 'voice_recording.webm';
    const mimeType = params.mimeType || 'audio/webm';

    if (!fileBuffer && params.audioBase64) {
      fileBuffer = Buffer.from(params.audioBase64, 'base64');
    }

    let userText = '';

    // Step 1: ElevenLabs Speech-to-Text (scribe_v2)
    if (fileBuffer && fileBuffer.length > 0) {
      try {
        userText = await this.elevenLabsService.transcribeAudio(fileBuffer, fileName, mimeType);
      } catch (err: any) {
        this.logger.warn(`ElevenLabs STT transcription notice: ${err.message}`);
      }

      // Graceful fallback to Gemini STT if ElevenLabs key is not set or STT returned empty
      if (!userText && (params.audioBase64 || fileBuffer)) {
        try {
          const b64 = params.audioBase64 || fileBuffer.toString('base64');
          userText = await this.llmService.transcribeAudio(b64, mimeType);
        } catch (err: any) {
          this.logger.debug(`Gemini STT fallback notice: ${err.message}`);
        }
      }
    }

    if (!userText || userText.trim().length === 0) {
      userText = 'Hello PixelMind AI';
    }

    // Step 2: Pass recognized text into existing chat pipeline (Gemini + PostgreSQL source-of-truth)
    const chatResponse = await this.processChat({
      applicantId,
      message: userText,
    });

    const replyText = chatResponse.message || 'I have updated your application status.';

    // Step 3: ElevenLabs Text-to-Speech (eleven_multilingual_v2)
    let audioBase64: string | null = null;
    try {
      audioBase64 = await this.elevenLabsService.generateSpeech(replyText);
    } catch (err: any) {
      this.logger.warn(`ElevenLabs TTS generation notice: ${err.message}`);
    }

    return {
      userText,
      message: replyText,
      reply: replyText,
      audioBase64,
      stage: chatResponse.stage,
      requirement: chatResponse.requirement,
      profile: chatResponse.profile,
      nextAction: chatResponse.nextAction,
      intent: chatResponse.intent,
    };
  }

  /**
   * Generates tailored requirement proposals using Gemini for a given career goal.
   */
  async generateGoalRequirements(applicantId: string, goal: string): Promise<any> {
    const result = await this.llmService.generateGoalRequirements(goal);
    return {
      applicantId,
      ...result,
    };
  }

  /**
   * Confirms and persists approved requirements into PostgreSQL and syncs with requirementStore.
   */
  async saveGoalRequirements(applicantId: string, payload: {
    requirements: any[];
    role?: string;
    country?: string;
    company?: string | null;
  }): Promise<any> {
    const applicantUuid = resolveApplicantUuid(applicantId);

    // Save to domain qualification service
    const saved = await this.qualificationService.saveCustomRequirements(
      applicantUuid,
      payload.requirements,
      {
        role: payload.role,
        country: payload.country || 'Germany',
        company: payload.company || undefined,
      },
    );

    // Update in-memory requirementStore
    const current = AiOrchestrator.requirementStore.get(applicantId) || {};
    if (payload.role) current.role = payload.role;
    if (payload.country) current.country = payload.country;
    if (payload.company) current.company = payload.company;
    AiOrchestrator.requirementStore.set(applicantId, current);
    AiOrchestrator.requirementStore.set(applicantUuid, current);

    return {
      success: true,
      message: 'Requirements saved successfully',
      ...saved,
    };
  }
}

