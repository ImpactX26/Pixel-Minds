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
import { ChatResponse, AiIntent, RequirementData, ProfileData } from './interfaces/ai-chat.interface';

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
   * Process a user chat message through the AI Orchestrator coordination layer using Gemini LLM (Phase 1, 2 & 3).
   */
  async processChat(dto: ChatRequestDto): Promise<ChatResponse> {
    const applicantId = dto.applicantId || 'default';
    const applicantUuid = resolveApplicantUuid(applicantId);
    const message = dto.message;

    // 1. Detect deterministic intent for metadata
    const intent = this.intentDetector.detectIntent(message);

    // 2. Load existing requirement & profile state
    let currentRequirement: RequirementData = AiOrchestrator.requirementStore.get(applicantId) || {};
    let currentProfile: ProfileData = AiOrchestrator.profileStore.get(applicantId) || {};

    // Check database for existing applicant profile if available
    try {
      const applicant = await this.applicantRepository.findOne({ where: { id: applicantUuid } });
      if (applicant) {
        if (!currentRequirement.country && applicant.country) {
          currentRequirement.country = applicant.country;
        }
        if (!currentProfile.personal?.fullName && applicant.name) {
          currentProfile.personal = { ...(currentProfile.personal || {}), fullName: applicant.name };
        }
      }
      const dbProfile = await this.profileRepository.findOne({ where: { applicantId: applicantUuid } });
      if (dbProfile) {
        if (!currentProfile.education && dbProfile.education) currentProfile.education = dbProfile.education;
        if (!currentProfile.skills && dbProfile.skills) currentProfile.skills = { technicalSkills: dbProfile.skills };
        if (!currentProfile.languages && dbProfile.languages) currentProfile.languages = dbProfile.languages;
        if (dbProfile.additionalInfo?.personal) {
          currentProfile.personal = { ...(currentProfile.personal || {}), ...dbProfile.additionalInfo.personal };
        }
      }
    } catch {
      // Gracefully ignore DB errors in mock/standalone mode
    }

    // 3. Load recent conversation history if available
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
    } catch {
      // Gracefully ignore
    }

    const wasRequirementComplete = Boolean(currentRequirement.country && currentRequirement.role);
    const isRequirementRelated = this.isRequirementMessage(message);
    const isProfileRelated = this.isProfileMessage(message);

    // Step A: If requirement is not yet complete OR user is explicitly providing requirement fields (e.g. role, company, country)
    if (!wasRequirementComplete || isRequirementRelated) {
      const reqResult = await this.llmService.extractRequirement(
        message,
        currentRequirement,
        history,
      );

      // Update requirement state non-destructively
      if (reqResult.requirement.country || reqResult.requirement.role || reqResult.requirement.company) {
        currentRequirement = {
          ...currentRequirement,
          ...(reqResult.requirement.country ? { country: reqResult.requirement.country } : {}),
          ...(reqResult.requirement.role ? { role: reqResult.requirement.role } : {}),
          ...(reqResult.requirement.company ? { company: reqResult.requirement.company } : {}),
        };
        AiOrchestrator.requirementStore.set(applicantId, currentRequirement);
        await this.persistApplicantRequirement(applicantId, currentRequirement);
      }

      const isNowComplete = Boolean(currentRequirement.country && currentRequirement.role);

      // If user message is purely requirement-related and requirement is STILL incomplete: stay in REQUIREMENTS stage
      if (!isNowComplete && !isProfileRelated) {
        try {
          await this.saveConversation(applicantId, message, reqResult.message);
        } catch {}

        this.logger.log(
          `AI Orchestrator [Stage: REQUIREMENTS] for applicant ${applicantId} [Role: ${currentRequirement.role || 'missing'}, Country: ${currentRequirement.country || 'missing'}, Company: ${currentRequirement.company || 'none'}]`,
        );

        return {
          applicantId,
          message: reqResult.message,
          stage: 'REQUIREMENTS',
          goalType: 'EMPLOYMENT',
          requirement: currentRequirement,
          profile: currentProfile,
          missingInformation: reqResult.missingInformation,
          nextAction: reqResult.nextAction,
          intent,
        };
      }
    }

    // Step B: Profile extraction (when requirement is complete OR message contains profile data)
    const profileResult = await this.llmService.extractProfile(
      message,
      currentProfile,
      currentRequirement,
      history,
    );

    // Persist profile in-memory & DB
    AiOrchestrator.profileStore.set(applicantId, profileResult.profile);
    await this.persistApplicantProfile(applicantId, profileResult.profile);

    // If requirement just became complete on this turn, provide clear confirmation and ask for education
    let responseMessage = profileResult.message;
    if (!wasRequirementComplete && currentRequirement.country && currentRequirement.role) {
      const companyPart = currentRequirement.company ? ` at ${currentRequirement.company}` : '';
      const prefix = `Great! I have recorded your goal to work as a ${currentRequirement.role} in ${currentRequirement.country}${companyPart}. `;
      if (!responseMessage.toLowerCase().includes('recorded your goal')) {
        responseMessage = prefix + responseMessage;
      }
    }

    try {
      await this.saveConversation(applicantId, message, responseMessage);
    } catch {}

    this.logger.log(
      `AI Orchestrator [Stage: PROFILE] for applicant ${applicantId} [Degree: ${profileResult.profile.education?.degree || 'none'}, Skills: ${profileResult.profile.skills?.technicalSkills?.join(',') || 'none'}]`,
    );

    return {
      applicantId,
      message: responseMessage,
      stage: 'PROFILE',
      goalType: 'EMPLOYMENT',
      requirement: currentRequirement,
      profile: profileResult.profile,
      missingInformation: profileResult.missingInformation,
      nextAction: profileResult.nextAction,
      intent,
    };
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
          name: 'Rahul Sharma',
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
          name: profile.personal?.fullName || 'Rahul Sharma',
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
          level: l.proficiency || 'Documented',
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
      /\bb\.?tech\b|\bb\.?sc\b|\bm\.?tech\b|\bm\.?sc\b|\bbachelor\b|\bmaster\b|\bdegree\b|\bcollege\b|\buniversity\b|\bgraduat/i.test(lower) ||
      /\bworked at\b|\bworking at\b|\byears? of experience\b|\byears? experience\b/i.test(lower) ||
      /\bskills?\b|\bpython\b|\bjava\b|\bc\+\+\b|\bjavascript\b|\btypescript\b|\breact\b|\bnode/i.test(lower) ||
      /\bspeak\b|\blanguages?\b|\bgerman is\b|\benglish is\b|\bb1\b|\bb2\b|\ba1\b|\ba2\b|\bc1\b|\bc2\b/i.test(lower) ||
      /\bmy name is\b|\bborn on\b|\bnationality\b/i.test(lower)
    );
  }

  /**
   * Retrieves the current stored requirement for an applicant.
   */
  getRequirement(applicantId: string): RequirementData {
    return AiOrchestrator.requirementStore.get(applicantId) || {};
  }

  /**
   * Retrieves the current stored profile for an applicant.
   */
  getProfile(applicantId: string): ProfileData {
    return AiOrchestrator.profileStore.get(applicantId) || {};
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
}

