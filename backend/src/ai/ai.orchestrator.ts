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
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponse, AiIntent } from './interfaces/ai-chat.interface';

@Injectable()
export class AiOrchestrator {
  private readonly logger = new Logger(AiOrchestrator.name);

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
  ) {}

  /**
   * Process a user chat message through the AI Orchestrator coordination layer.
   */
  async processChat(dto: ChatRequestDto): Promise<ChatResponse> {
    const { applicantId, message } = dto;

    // 1. Validate applicant existence
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with ID "${applicantId}" not found`);
    }

    // 2. Detect intent deterministically
    const intent = this.intentDetector.detectIntent(message);

    // 3. Load live facts from database services
    const profile = await this.profileRepository.findOne({ where: { applicantId } });
    const documents = await this.documentRepository.find({ where: { applicantId } });
    const journey = await this.journeyRepository.findOne({ where: { applicantId } });
    const qualification = await this.qualificationService.getLatestQualification(applicantId);
    const nextAction = await this.nextActionService.getNextAction(applicantId);

    // 4. Generate deterministic, helpful response
    const responseText = this.generateResponse(
      intent,
      applicant,
      profile,
      documents,
      journey,
      qualification,
      nextAction,
    );

    // 5. Save conversation history in PostgreSQL
    await this.saveConversation(applicantId, message, responseText);

    this.logger.log(
      `AI Orchestrator handled chat for applicant ${applicantId} [Intent: ${intent}]`,
    );

    return {
      applicantId,
      message: responseText,
      intent,
      nextAction: {
        action: nextAction.action,
        title: nextAction.title,
        priority: nextAction.priority,
        status: nextAction.status,
        reason: nextAction.reason,
        requirementCode: nextAction.requirementCode,
      },
    };
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
    try {
      // 1. User message
      const userConv = this.conversationRepository.create({
        applicantId,
        channel: ConversationChannel.WEB,
        sender: MessageSender.APPLICANT,
        message: userMessage,
      });
      await this.conversationRepository.save(userConv);

      // 2. AI Assistant message
      const aiConv = this.conversationRepository.create({
        applicantId,
        channel: ConversationChannel.WEB,
        sender: MessageSender.AI,
        message: assistantResponse,
      });
      await this.conversationRepository.save(aiConv);
    } catch (err) {
      this.logger.error(`Failed to record conversation for applicant ${applicantId}:`, err);
    }
  }
}
