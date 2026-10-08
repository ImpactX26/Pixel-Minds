import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSupabaseSchema1791445384422 implements MigrationInterface {
    name = 'InitialSupabaseSchema1791445384422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "applicant_profiles" ("applicantId" uuid NOT NULL, "education" jsonb DEFAULT '{}', "experience" text, "skills" text array NOT NULL DEFAULT '{}', "languages" jsonb DEFAULT '[]', "workExperience" jsonb DEFAULT '[]', "additionalInfo" jsonb DEFAULT '{}', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_97502d3655cf39bc8b105b1241a" PRIMARY KEY ("applicantId"))`);
        await queryRunner.query(`CREATE TYPE "public"."journeys_currentstage_enum" AS ENUM('STARTED', 'GOAL_IDENTIFIED', 'PROFILE_BUILDING', 'DOCUMENT_COLLECTION', 'DOCUMENT_PROCESSING', 'CLARIFICATION_REQUIRED', 'QUALIFICATION_PENDING', 'QUALIFICATION_COMPLETE', 'CONSULTANT_REVIEW', 'NEXT_STEP_READY', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "journeys" ("applicantId" uuid NOT NULL, "currentStage" "public"."journeys_currentstage_enum" NOT NULL DEFAULT 'STARTED', "progress" integer NOT NULL DEFAULT '0', "status" character varying(50) NOT NULL DEFAULT 'IN_PROGRESS', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2d5b04823e28f8523fd812783ee" PRIMARY KEY ("applicantId"))`);
        await queryRunner.query(`CREATE TYPE "public"."documents_status_enum" AS ENUM('uploaded', 'processing', 'processed', 'verified', 'rejected', 'conflict', 'failed')`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "type" character varying(100) NOT NULL, "status" "public"."documents_status_enum" NOT NULL DEFAULT 'uploaded', "fileUrl" character varying(1000), "extractedData" jsonb DEFAULT '{}', "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."qualifications_status_enum" AS ENUM('PENDING', 'IN_REVIEW', 'QUALIFIED', 'NOT_QUALIFIED', 'CONDITIONAL')`);
        await queryRunner.query(`CREATE TABLE "qualifications" ("applicantId" uuid NOT NULL, "requirements" jsonb NOT NULL DEFAULT '[]', "completedRequirements" jsonb NOT NULL DEFAULT '[]', "missingRequirements" jsonb NOT NULL DEFAULT '[]', "status" "public"."qualifications_status_enum" NOT NULL DEFAULT 'PENDING', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1e2fa966674b2c62d7d1ab47d64" PRIMARY KEY ("applicantId"))`);
        await queryRunner.query(`CREATE TYPE "public"."next_actions_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
        await queryRunner.query(`CREATE TYPE "public"."next_actions_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED')`);
        await queryRunner.query(`CREATE TABLE "next_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicantId" uuid NOT NULL, "action" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "reason" text, "priority" "public"."next_actions_priority_enum" NOT NULL DEFAULT 'MEDIUM', "status" "public"."next_actions_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a9d67ce63437c1a3cbcf4dbffd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."conversations_channel_enum" AS ENUM('WEB', 'TELEGRAM', 'WHATSAPP', 'VOICE')`);
        await queryRunner.query(`CREATE TYPE "public"."conversations_sender_enum" AS ENUM('APPLICANT', 'AI', 'CONSULTANT', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicantId" uuid NOT NULL, "channel" "public"."conversations_channel_enum" NOT NULL DEFAULT 'WEB', "message" text NOT NULL, "sender" "public"."conversations_sender_enum" NOT NULL DEFAULT 'APPLICANT', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "applicants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50), "country" character varying(100), "goal" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_cf1d183c497a68c4f07fe62d808" UNIQUE ("email"), CONSTRAINT "PK_c02ec3c46124479ce758ca50943" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "applicant_profiles" ADD CONSTRAINT "FK_97502d3655cf39bc8b105b1241a" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journeys" ADD CONSTRAINT "FK_2d5b04823e28f8523fd812783ee" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_026e145a27b44c48e6fb4eb2a1b" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "qualifications" ADD CONSTRAINT "FK_1e2fa966674b2c62d7d1ab47d64" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "next_actions" ADD CONSTRAINT "FK_9f88665c36657e64379396b88fc" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_8e18250428fb8fddf64b4b928f3" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_8e18250428fb8fddf64b4b928f3"`);
        await queryRunner.query(`ALTER TABLE "next_actions" DROP CONSTRAINT "FK_9f88665c36657e64379396b88fc"`);
        await queryRunner.query(`ALTER TABLE "qualifications" DROP CONSTRAINT "FK_1e2fa966674b2c62d7d1ab47d64"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_026e145a27b44c48e6fb4eb2a1b"`);
        await queryRunner.query(`ALTER TABLE "journeys" DROP CONSTRAINT "FK_2d5b04823e28f8523fd812783ee"`);
        await queryRunner.query(`ALTER TABLE "applicant_profiles" DROP CONSTRAINT "FK_97502d3655cf39bc8b105b1241a"`);
        await queryRunner.query(`DROP TABLE "applicants"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_sender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_channel_enum"`);
        await queryRunner.query(`DROP TABLE "next_actions"`);
        await queryRunner.query(`DROP TYPE "public"."next_actions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."next_actions_priority_enum"`);
        await queryRunner.query(`DROP TABLE "qualifications"`);
        await queryRunner.query(`DROP TYPE "public"."qualifications_status_enum"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
        await queryRunner.query(`DROP TABLE "journeys"`);
        await queryRunner.query(`DROP TYPE "public"."journeys_currentstage_enum"`);
        await queryRunner.query(`DROP TABLE "applicant_profiles"`);
    }

}
