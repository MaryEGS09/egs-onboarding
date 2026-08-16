-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('CHAT', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'PENDING_REVIEW', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'URL', 'NUMBER', 'CURRENCY', 'VOICE', 'VIDEO', 'FILE_UPLOAD');

-- CreateEnum
CREATE TYPE "AnswerSource" AS ENUM ('TEXT_INPUT', 'VOICE_TRANSCRIPT', 'VIDEO_TRANSCRIPT', 'FILE_UPLOAD', 'AI_EXTRACTED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('AUDIO', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('NOT_APPLICABLE', 'COMPLETE', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_REVIEWED', 'IN_REVIEW', 'APPROVED', 'NEEDS_CORRECTION');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ACCOUNT_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'HTML', 'JSON');

-- CreateEnum
CREATE TYPE "ExportGeneratedBy" AS ENUM ('SYSTEM_AUTO', 'ADMIN', 'CLIENT_FINAL');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('CLIENT', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "businessName" TEXT,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "primaryIndustry" TEXT,
    "secondaryIndustry" TEXT,
    "plutioPersonId" TEXT,
    "plutioCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "resumeCodeHash" TEXT NOT NULL,
    "resumeCodeExpiresAt" TIMESTAMP(3),
    "currentPhaseId" TEXT,
    "currentSectionId" TEXT,
    "currentQuestionId" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "plutioProjectId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "helpText" TEXT,
    "responseType" "ResponseType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "aiInstructions" TEXT NOT NULL,
    "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "videoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowFileUpload" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "allowFreeText" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "textValue" TEXT,
    "jsonValue" JSONB,
    "numberValue" DECIMAL(65,30),
    "currencyCode" TEXT,
    "mediaUploadId" TEXT,
    "source" "AnswerSource" NOT NULL,
    "extractedFromAnswerId" TEXT,
    "confidence" DOUBLE PRECISION,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerVersionHistory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "textValue" TEXT,
    "jsonValue" JSONB,
    "numberValue" DECIMAL(65,30),
    "currencyCode" TEXT,
    "mediaUploadId" TEXT,
    "source" "AnswerSource" NOT NULL,
    "extractedFromAnswerId" TEXT,
    "supersededAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededReason" TEXT,

    CONSTRAINT "AnswerVersionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpExchange" (
    "id" TEXT NOT NULL,
    "answerId" TEXT,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "aiQuestionText" TEXT NOT NULL,
    "clientResponseText" TEXT,
    "mediaUploadId" TEXT,
    "resultedInAnswerUpdate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpExchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaUpload" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT,
    "kind" "MediaKind" NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "durationSeconds" INTEGER,
    "transcriptStatus" "TranscriptStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "transcriptText" TEXT,
    "transcriptSource" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcribedAt" TIMESTAMP(3),

    CONSTRAINT "MediaUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phaseId" TEXT,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "relatedQuestionId" TEXT,
    "archivedFromContext" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseSummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhaseSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ACCOUNT_MANAGER',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewDocument" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "storagePath" TEXT,
    "snapshotJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" "ExportGeneratedBy" NOT NULL,

    CONSTRAINT "ReviewDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_primaryContactEmail_businessName_idx" ON "Client"("primaryContactEmail", "businessName");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_resumeCodeHash_key" ON "OnboardingSession"("resumeCodeHash");

-- CreateIndex
CREATE INDEX "OnboardingSession_clientId_idx" ON "OnboardingSession"("clientId");

-- CreateIndex
CREATE INDEX "OnboardingSession_status_lastActivityAt_idx" ON "OnboardingSession"("status", "lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_key_key" ON "Phase"("key");

-- CreateIndex
CREATE INDEX "Phase_order_idx" ON "Phase"("order");

-- CreateIndex
CREATE INDEX "Section_phaseId_idx" ON "Section"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_phaseId_order_key" ON "Section"("phaseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Question_key_key" ON "Question"("key");

-- CreateIndex
CREATE INDEX "Question_archived_idx" ON "Question"("archived");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sectionId_order_key" ON "Question"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_value_key" ON "QuestionOption"("questionId", "value");

-- CreateIndex
CREATE INDEX "Answer_sessionId_idx" ON "Answer"("sessionId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Answer_mediaUploadId_idx" ON "Answer"("mediaUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "AnswerVersionHistory_answerId_idx" ON "AnswerVersionHistory"("answerId");

-- CreateIndex
CREATE INDEX "AnswerVersionHistory_sessionId_questionId_idx" ON "AnswerVersionHistory"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "FollowUpExchange_answerId_idx" ON "FollowUpExchange"("answerId");

-- CreateIndex
CREATE INDEX "FollowUpExchange_sessionId_idx" ON "FollowUpExchange"("sessionId");

-- CreateIndex
CREATE INDEX "MediaUpload_sessionId_idx" ON "MediaUpload"("sessionId");

-- CreateIndex
CREATE INDEX "MediaUpload_transcriptStatus_idx" ON "MediaUpload"("transcriptStatus");

-- CreateIndex
CREATE INDEX "ConversationMessage_sessionId_phaseId_createdAt_idx" ON "ConversationMessage"("sessionId", "phaseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseSummary_sessionId_phaseId_key" ON "PhaseSummary"("sessionId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "ReviewDocument_sessionId_version_idx" ON "ReviewDocument"("sessionId", "version");

-- CreateIndex
CREATE INDEX "AuditLog_sessionId_createdAt_idx" ON "AuditLog"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_currentPhaseId_fkey" FOREIGN KEY ("currentPhaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_currentSectionId_fkey" FOREIGN KEY ("currentSectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_currentQuestionId_fkey" FOREIGN KEY ("currentQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_mediaUploadId_fkey" FOREIGN KEY ("mediaUploadId") REFERENCES "MediaUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_extractedFromAnswerId_fkey" FOREIGN KEY ("extractedFromAnswerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVersionHistory" ADD CONSTRAINT "AnswerVersionHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVersionHistory" ADD CONSTRAINT "AnswerVersionHistory_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVersionHistory" ADD CONSTRAINT "AnswerVersionHistory_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpExchange" ADD CONSTRAINT "FollowUpExchange_answer_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpExchange" ADD CONSTRAINT "FollowUpExchange_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpExchange" ADD CONSTRAINT "FollowUpExchange_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpExchange" ADD CONSTRAINT "FollowUpExchange_mediaUploadId_fkey" FOREIGN KEY ("mediaUploadId") REFERENCES "MediaUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_relatedQuestionId_fkey" FOREIGN KEY ("relatedQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseSummary" ADD CONSTRAINT "PhaseSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseSummary" ADD CONSTRAINT "PhaseSummary_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDocument" ADD CONSTRAINT "ReviewDocument_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
