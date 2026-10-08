import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from '../applicants/entities/applicant.entity';
import { ApplicantProfile } from '../profile/entities/applicant-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { LlmService } from '../ai/services/llm.service';
import { CvEngine } from './cv.engine';
import {
  GenerateCvRequestDto,
  GeneratedCvResult,
  SaveCvDto,
} from './interfaces/cv.interface';
import { resolveApplicantUuid } from '../common/utils/uuid.util';
import { DocumentStatus } from '../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly llmService: LlmService,
    private readonly cvEngine: CvEngine,
  ) {}

  /**
   * Generates a German-optimized CV by merging existing verified applicant journey state
   * with extracted data from an uploaded CV. Detects and preserves verified conflicts.
   */
  async generateCv(dto: GenerateCvRequestDto): Promise<GeneratedCvResult> {
    const applicantId = dto.applicantId || '123';
    const canonicalId = resolveApplicantUuid(applicantId);

    // 1. Fetch persistent applicant state from PostgreSQL
    let applicant = await this.applicantRepository.findOne({
      where: { id: canonicalId },
    });

    if (!applicant) {
      applicant = this.applicantRepository.create({
        id: canonicalId,
        name: 'Rahul Sharma',
        email: `applicant-${applicantId}@educaro.de`,
        country: 'India',
      });
      try {
        applicant = await this.applicantRepository.save(applicant);
      } catch (err) {
        this.logger.debug(`Could not create applicant: ${err.message}`);
      }
    }

    const profile = await this.profileRepository.findOne({
      where: { applicantId: canonicalId },
    });

    const documents = await this.documentRepository.find({
      where: { applicantId: canonicalId },
      order: { uploadedAt: 'DESC' },
    });

    // 2. Identify CV text source
    let cvText = dto.rawCvText || '';

    if (!cvText && dto.documentId) {
      const doc = await this.documentRepository.findOne({ where: { id: dto.documentId } });
      if (doc) {
        const ext = typeof doc.extractedData === 'string' ? JSON.parse(doc.extractedData || '{}') : (doc.extractedData || {});
        cvText = ext.rawText || ext.text || doc.name;
      }
    }

    if (!cvText) {
      // Find latest uploaded CV in documents
      const cvDoc = documents.find((d) => {
        const t = (d.type || '').toUpperCase();
        const n = (d.name || '').toUpperCase();
        return t === 'CV' || t.includes('RESUME') || n.includes('CV') || n.includes('RESUME');
      });
      if (cvDoc) {
        const ext = typeof cvDoc.extractedData === 'string' ? JSON.parse(cvDoc.extractedData || '{}') : (cvDoc.extractedData || {});
        cvText = ext.rawText || ext.text || cvDoc.name;
      }
    }

    // 3. Extract structured CV details via Gemini
    this.logger.log(`Extracting structured CV data for applicant ${applicantId} [${canonicalId}]`);
    const extractedCv = await this.llmService.extractCvData(cvText, applicant?.name);

    // 4. Merge verified state + CV with strict priority and conflict detection
    const { mergedData, conflicts } = this.cvEngine.mergeAndDetectConflicts(
      applicant,
      profile,
      documents,
      extractedCv,
    );

    // 5. Enhance German summary with Gemini if available
    try {
      const optimizedSummary = await this.llmService.optimizeGermanCv(mergedData);
      if (optimizedSummary) {
        mergedData.professionalSummary = optimizedSummary;
      }
    } catch (err) {
      this.logger.debug(`Optimization fallback: ${err.message}`);
    }

    // 6. Generate German Markdown format
    const formattedMarkdown = this.cvEngine.generateGermanMarkdown(mergedData);

    const result: GeneratedCvResult = {
      ...mergedData,
      conflicts,
      formattedMarkdown,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in profile additionalInfo as draft
    try {
      if (profile) {
        const addInfo = typeof profile.additionalInfo === 'string'
          ? JSON.parse(profile.additionalInfo || '{}')
          : (profile.additionalInfo || {});
        addInfo.generatedCv = result;
        profile.additionalInfo = addInfo;
        await this.profileRepository.save(profile);
      }
    } catch (dbErr) {
      this.logger.debug(`Could not save draft CV to profile: ${dbErr.message}`);
    }

    return result;
  }

  /**
   * Saves the final reviewed/edited German CV to PostgreSQL.
   */
  async saveCv(dto: SaveCvDto): Promise<GeneratedCvResult> {
    const applicantId = dto.applicantId || '123';
    const canonicalId = resolveApplicantUuid(applicantId);

    const profile = await this.profileRepository.findOne({
      where: { applicantId: canonicalId },
    });

    const addInfo = typeof profile?.additionalInfo === 'string'
      ? JSON.parse(profile?.additionalInfo || '{}')
      : (profile?.additionalInfo || {});

    const existingCv = addInfo.generatedCv || {};
    const finalCv: GeneratedCvResult = {
      ...existingCv,
      ...dto.cvData,
      applicantId: canonicalId,
      status: 'APPROVED',
      updatedAt: new Date().toISOString(),
    };

    // Update markdown if regenerated
    if (finalCv.personalInfo && finalCv.education && finalCv.skills) {
      finalCv.formattedMarkdown = this.cvEngine.generateGermanMarkdown(finalCv);
    }

    // 1. Persist in ApplicantProfile
    if (profile) {
      addInfo.generatedCv = finalCv;
      profile.additionalInfo = addInfo;
      await this.profileRepository.save(profile);
    }

    // 2. Persist as a Document record with type 'GENERATED_CV'
    try {
      let cvDoc = await this.documentRepository.findOne({
        where: { applicantId: canonicalId, type: 'GENERATED_CV' },
      });

      if (!cvDoc) {
        cvDoc = this.documentRepository.create({
          id: uuidv4(),
          applicantId: canonicalId,
          name: `${finalCv.personalInfo?.fullName?.replace(/\s+/g, '_') || 'Applicant'}_German_Lebenslauf.pdf`,
          type: 'GENERATED_CV',
          status: DocumentStatus.VERIFIED,
          fileUrl: `https://storage.educaro.de/documents/${canonicalId}/German_Lebenslauf.pdf`,
          extractedData: {
            cvData: finalCv,
            markdown: finalCv.formattedMarkdown,
            status: 'APPROVED',
          },
          uploadedAt: new Date(),
        });
      } else {
        cvDoc.extractedData = {
          cvData: finalCv,
          markdown: finalCv.formattedMarkdown,
          status: 'APPROVED',
        };
        cvDoc.uploadedAt = new Date();
      }

      await this.documentRepository.save(cvDoc);
    } catch (docErr) {
      this.logger.debug(`Could not save GENERATED_CV document: ${docErr.message}`);
    }

    this.logger.log(`Approved and saved German CV for applicant ${applicantId} [${canonicalId}]`);
    return finalCv;
  }

  /**
   * Retrieves the current generated or saved CV for an applicant.
   */
  async getCv(applicantId: string): Promise<GeneratedCvResult | null> {
    const canonicalId = resolveApplicantUuid(applicantId);

    // 1. Check profile additionalInfo
    const profile = await this.profileRepository.findOne({
      where: { applicantId: canonicalId },
    });

    const addInfo = typeof profile?.additionalInfo === 'string'
      ? JSON.parse(profile?.additionalInfo || '{}')
      : (profile?.additionalInfo || {});

    if (addInfo.generatedCv) {
      return addInfo.generatedCv;
    }

    // 2. Check Document repository
    const cvDoc = await this.documentRepository.findOne({
      where: { applicantId: canonicalId, type: 'GENERATED_CV' },
      order: { uploadedAt: 'DESC' },
    });

    if (cvDoc?.extractedData?.cvData) {
      return cvDoc.extractedData.cvData;
    }

    // 3. If none exists, auto-generate from current verified state
    return this.generateCv({ applicantId });
  }
}
