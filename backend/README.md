# Educaro AI Companion - Backend

NestJS + TypeScript + TypeORM backend connected to Supabase PostgreSQL database, Supabase Storage, and external AI/OCR extraction services.

---

## 📁 Architecture Overview

```text
Pair 1 React Frontend
        ↓
NestJS REST API (/api/v1)
        ↓
Domain Services & Business Logic
 ├── Supabase Storage (educaro-documents) → PDF/Image files
 ├── Supabase PostgreSQL → Metadata, State, Profile, Journey
 └── Member 4 Document Extraction Service (http://localhost:3001)
              ↓
  (Phase 4: Qualification Engine)
              ↓
  (Phase 5: Next Best Action)
```

```text
backend/
├── src/
│   ├── applicants/            # Applicant domain, CRUD controller, service, DTOs
│   │   ├── dto/               # create-applicant.dto.ts, update-applicant.dto.ts
│   │   ├── entities/          # applicant.entity.ts
│   │   ├── applicants.controller.ts
│   │   ├── applicants.service.ts
│   │   └── applicants.module.ts
│   ├── profile/               # Applicant Profile domain, controller, service, DTOs
│   │   ├── dto/               # update-profile.dto.ts
│   │   ├── entities/          # applicant-profile.entity.ts
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts
│   │   └── profile.module.ts
│   ├── journey/               # Journey state engine, controller, service, DTOs
│   │   ├── dto/               # update-journey.dto.ts
│   │   ├── entities/          # journey.entity.ts
│   │   ├── journey.controller.ts
│   │   ├── journey.service.ts
│   │   └── journey.module.ts
│   ├── documents/             # Document upload, extraction client & management
│   │   ├── dto/               # upload-document.dto.ts
│   │   ├── entities/          # document.entity.ts
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── extraction.client.ts # HTTP client for Member 4 Extraction Service
│   │   ├── storage.service.ts   # Supabase Storage integration & sanitization
│   │   └── documents.module.ts
│   ├── qualification/         # Qualification engine module (Phase 4)
│   ├── next-action/           # Next Best Action module (Phase 5)
│   ├── conversations/         # Multi-channel conversation module (Phase 6)
│   ├── ai/                    # AI Orchestrator module
│   ├── common/                # Shared filters, interceptors, database config, enums
│   ├── app.module.ts          # Central root module
│   └── main.ts                # Application bootstrap
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 🚀 API Documentation

Base prefix: `/api/v1`

### 1. Applicant APIs

| Method | Endpoint | Description |
|---|---|---|
| **POST** | `/api/v1/applicants` | Creates applicant and auto-initializes `Journey` (`STARTED`, 0%) and `Profile` in an atomic transaction |
| **GET** | `/api/v1/applicants/:id` | Retrieves applicant by UUID |
| **PATCH** | `/api/v1/applicants/:id` | Updates applicant fields (name, email, phone, country, goal) |

### 2. Profile APIs

| Method | Endpoint | Description |
|---|---|---|
| **GET** | `/api/v1/applicants/:id/profile` | Retrieves applicant's profile |
| **PATCH** | `/api/v1/applicants/:id/profile` | Updates applicant's profile (education, skills, languages, experience, additionalInfo) |

### 3. Journey APIs

| Method | Endpoint | Description |
|---|---|---|
| **GET** | `/api/v1/applicants/:id/journey` | Retrieves journey stage and progress |
| **PATCH** | `/api/v1/applicants/:id/journey` | Updates journey stage and progress with strict enum and 0-100 range validation |

---

### 4. Document & Extraction APIs

#### **Upload Document**
Accepts multipart form-data, validates file size (max 10MB) & MIME type (PDF, PNG, JPG), sanitizes filename, uploads to Supabase Storage at `applicants/{applicantId}/documents/{documentId}/{filename}`, and saves metadata in PostgreSQL with status `uploaded`.

- **`POST /api/v1/documents/upload`**
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `applicantId` *(string, UUID v4, required)*: Target applicant ID
  - `file` *(binary file, required)*: Document file (PDF, JPG, JPEG, PNG, max 10MB)
  - `type` *(string, optional)*: E.g., `degree_certificate`, `academic_transcript`, `passport`, `cv`
- **Response (`201 Created`):**
```json
{
  "id": "e03552d3-eb19-4693-bdc8-ce32cb231be7",
  "applicantId": "e93c5285-9ddd-49b1-ac8e-febb597d6bc3",
  "name": "Bachelor_Degree_Certificate.pdf",
  "type": "degree_certificate",
  "status": "uploaded",
  "fileUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/educaro-documents/...",
  "extractedData": {},
  "uploadedAt": "2026-10-08T08:45:25.105Z"
}
```

#### **Get All Applicant Documents**
- **`GET /api/v1/applicants/:id/documents`**

#### **Get Single Document**
- **`GET /api/v1/documents/:id`**

#### **Trigger Document Extraction Processing**
Invokes Member 4's Document Extraction Service (`POST http://localhost:3001/api/v1/document-extraction/extract`):
1. Transitions status to `processing`.
2. Sends `documentId`, `documentUrl` (Supabase Storage URL), and `documentType` with configurable timeout.
3. On success, updates status to `processed` and saves structured `extractedData`, `confidence`, and `metadata` to PostgreSQL.
4. On failure, transitions status to `failed` and records error context.

- **`POST /api/v1/documents/:id/process`**
- **Response (`200 OK` on success):**
```json
{
  "id": "e03552d3-eb19-4693-bdc8-ce32cb231be7",
  "applicantId": "e93c5285-9ddd-49b1-ac8e-febb597d6bc3",
  "name": "Bachelor_Degree_Certificate.pdf",
  "type": "degree_certificate",
  "status": "processed",
  "fileUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/...",
  "extractedData": {
    "fullName": "Rahul Sharma",
    "dateOfBirth": "2001-05-15",
    "degree": "Bachelor of Technology in Computer Science",
    "university": "Delhi Technological University",
    "graduationYear": "2024",
    "institutionLocation": "New Delhi, India",
    "gradeOrGpa": "8.8 / 10.0",
    "confidence": 0.96,
    "metadata": {
      "pageCount": 1,
      "ocrEngine": "Tesseract/AI-Vision"
    }
  },
  "uploadedAt": "2026-10-08T08:45:25.105Z"
}
```

---

### 5. Qualification Engine APIs (Phase 4)

Deterministic rule evaluation engine that evaluates applicant facts (Profile, Journey, Extracted Document data) against predefined qualification rules. LLMs do not make qualification decisions.

#### **Get Requirements Schema / Definitions**
- **`GET /api/v1/applicants/:id/requirements`**
- Returns the list of standard requirement definitions applicable to this applicant (codes, category, title, description, required flag).

#### **Get Latest Stored Qualification**
- **`GET /api/v1/applicants/:id/qualification`**
- Returns the latest stored qualification result from PostgreSQL (or calculates & stores if never run before).

#### **Check & Recalculate Qualification**
- **`POST /api/v1/applicants/:id/qualification/check`**
- Recalculates qualification using current Applicant, Profile, and Document extracted data, persists the detailed result in the `qualifications` table, updates the Journey stage (`QUALIFICATION_COMPLETE` if qualified, `QUALIFICATION_PENDING` otherwise), and returns the full evaluation summary.

- **Response (`200 OK`):**
```json
{
  "applicantId": "9fcc6309-471c-4334-9472-82eeb7db2b8b",
  "status": "QUALIFIED",
  "qualificationStatus": "qualified",
  "totalRequirements": 8,
  "satisfied": 8,
  "missing": 0,
  "incomplete": 0,
  "conflicts": 0,
  "pendingVerification": 0,
  "completedRequirements": [
    {
      "code": "FULL_NAME",
      "title": "Full Name Verification",
      "category": "PROFILE",
      "required": true,
      "status": "SATISFIED",
      "reason": "Full name verified: Priya Patel",
      "details": { "name": "Priya Patel" }
    }
  ],
  "missingRequirements": [],
  "requirements": [
    {
      "code": "FULL_NAME",
      "title": "Full Name Verification",
      "category": "PROFILE",
      "required": true,
      "status": "SATISFIED",
      "reason": "Full name verified: Priya Patel"
    },
    {
      "code": "DATE_OF_BIRTH",
      "title": "Date of Birth",
      "category": "PROFILE",
      "required": true,
      "status": "SATISFIED",
      "reason": "Date of birth verified: 2001-08-20"
    },
    {
      "code": "GOAL",
      "title": "Study / Career Goal",
      "category": "PROFILE",
      "required": true,
      "status": "SATISFIED",
      "reason": "Target academic/career goal specified: MASTER_STUDIES"
    },
    {
      "code": "DEGREE_CERTIFICATE",
      "title": "Academic Degree Certificate",
      "category": "EDUCATION",
      "required": true,
      "status": "SATISFIED",
      "reason": "Degree certificate verified: Bachelor of Science in Information Technology"
    },
    {
      "code": "UNIVERSITY",
      "title": "Recognized Institution / University",
      "category": "EDUCATION",
      "required": true,
      "status": "SATISFIED",
      "reason": "University verified: Mumbai University"
    },
    {
      "code": "GRADUATION_YEAR",
      "title": "Graduation Year",
      "category": "EDUCATION",
      "required": true,
      "status": "SATISFIED",
      "reason": "Graduation year verified: 2023"
    },
    {
      "code": "PASSPORT",
      "title": "Valid Passport Document",
      "category": "DOCUMENTS",
      "required": true,
      "status": "SATISFIED",
      "reason": "Passport document uploaded and verified"
    },
    {
      "code": "GERMAN_LANGUAGE_CERTIFICATE",
      "title": "German Language Proficiency",
      "category": "LANGUAGE",
      "required": true,
      "status": "SATISFIED",
      "reason": "German language proficiency recorded: B2"
    }
  ],
  "updatedAt": "2026-10-08T10:05:25.280Z"
}
```

---

### 6. Next Best Action (NBA) Engine APIs (Phase 5)

Deterministic decision engine that identifies exactly ONE highest-priority action for the applicant to progress their German education / relocation pathway. Persists results to the `next_actions` table in PostgreSQL.

#### **Priority Hierarchy (Strict Deterministic Order):**
1. `RESOLVE_CONFLICT` (`HIGH`): Mismatch between profile and official extracted documents (e.g., University discrepancy).
2. `COMPLETE_PROFILE` (`HIGH`): Mandatory profile facts missing (e.g., Date of Birth, Full Name, Goal).
3. `UPLOAD_DOCUMENT` (`HIGH`): Mandatory required documents not yet uploaded (Degree Certificate, Passport, German Certificate).
4. `VERIFY_DOCUMENT` (`HIGH`): Low confidence document extraction requiring verification or re-upload.
5. `COMPLETE_REQUIREMENT` (`MEDIUM`): Remaining qualification items.
6. `CONTACT_EDUCARO` (`MEDIUM`): All mandatory requirements satisfied; profile is qualified for next step.
7. `OPTIONAL_IMPROVEMENT` (`LOW`): Non-mandatory profile enhancement (work experience, skills).
8. `NO_ACTION` (`LOW`): Application fully completed.

#### **Get Next Best Action**
- **`GET /api/v1/applicants/:id/next-action`**
- Returns the single highest-priority next action for the applicant.

- **Response Examples:**

*Missing Profile Field:*
```json
{
  "id": "c2f6c940-4ea6-47d8-abeb-17494add3ede",
  "applicantId": "66133de9-3d01-4144-a67d-c58a4cb528de",
  "action": "COMPLETE_PROFILE",
  "title": "Add your date of birth",
  "reason": "Your date of birth is required to continue your application.",
  "priority": "HIGH",
  "status": "PENDING",
  "requirementCode": "DATE_OF_BIRTH",
  "createdAt": "2026-10-08T10:21:00.000Z",
  "updatedAt": "2026-10-08T10:21:00.000Z"
}
```

*Conflict Detected:*
```json
{
  "id": "afac828c-4694-4b25-ba9d-43bcb8142d5f",
  "applicantId": "rohan-id-guid",
  "action": "RESOLVE_CONFLICT",
  "title": "Resolve your university information",
  "reason": "Your profile university does not match your degree certificate.",
  "priority": "HIGH",
  "status": "PENDING",
  "requirementCode": "UNIVERSITY"
}
```

*Qualified / Ready for Next Step:*
```json
{
  "id": "09e08140-6b46-4191-8b7b-025ebc63373a",
  "applicantId": "aditya-id-guid",
  "action": "CONTACT_EDUCARO",
  "title": "Your profile is ready for the next step",
  "reason": "Your required information and documents are complete.",
  "priority": "MEDIUM",
  "status": "PENDING"
}
```

---

### 7. AI Orchestrator APIs (Phase 6)

Provider-independent coordination layer that reads live database facts (Applicant, Profile, Documents, Journey, Qualification, Next Action) and formulates deterministic, helpful answers while recording conversation history in PostgreSQL.

#### **Chat / Orchestrator Endpoint**
- **`POST /api/v1/ai/chat`**
- **Request Body:**
```json
{
  "applicantId": "c96c473f-c96a-424a-aa77-3bb8e5b4d59b",
  "message": "What documents am I missing?"
}
```

- **Supported Intents:**
  - `GET_MISSING_DOCUMENTS`: Queries qualification missing document rules and lists absent/incomplete credentials.
  - `GET_QUALIFICATION`: Summarizes overall qualification readiness and satisfied requirement count.
  - `GET_NEXT_ACTION`: Resolves the single highest-priority next action for the applicant.
  - `GET_STATUS`: Summarizes journey stage, progress percentage, qualification status, and next action.
  - `GET_PROFILE`: Generates a safe profile summary without leaking internal IDs.
  - `UPLOAD_DOCUMENT`: Explains document upload capabilities and recommended next document.
  - `UNKNOWN`: Helpful fallback guiding the applicant with supported questions.

- **Response (`200 OK`):**
```json
{
  "applicantId": "c96c473f-c96a-424a-aa77-3bb8e5b4d59b",
  "message": "You are currently missing your degree certificate and passport.",
  "intent": "GET_MISSING_DOCUMENTS",
  "nextAction": {
    "action": "UPLOAD_DOCUMENT",
    "title": "Upload your degree certificate",
    "priority": "HIGH",
    "status": "PENDING",
    "reason": "Your academic degree certificate is required to verify your eligibility.",
    "requirementCode": "DEGREE_CERTIFICATE"
  }
}
```

---

## 📜 Supported Requirement Statuses (`RequirementStatus` Enum)

- `SATISFIED`: Requirement conditions fully met.
- `MISSING`: Data or document is completely absent.
- `INCOMPLETE`: Document uploaded but pending OCR processing or missing field.
- `CONFLICT`: Mismatch detected (e.g., Profile university vs Degree document extracted university).
- `PENDING_VERIFICATION`: Low extraction confidence score (< 0.70) requiring manual check.
- `NOT_APPLICABLE`: Requirement not applicable.

---

## 📜 Supported Document Statuses (`DocumentStatus` Enum)

- `uploaded`
- `processing`
- `processed`
- `verified`
- `rejected`
- `conflict`
- `failed`

---

## ⚙️ Environment Configuration

Add to your `backend/.env`:
```env
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# PostgreSQL (Supabase Session Pooler)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
DB_SSL=true
DB_SYNCHRONIZE=false

# Supabase Storage
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_STORAGE_BUCKET=educaro-documents
MAX_FILE_SIZE_MB=10

# Document Extraction Service (Member 4)
DOCUMENT_EXTRACTION_SERVICE_URL=http://localhost:3001
DOCUMENT_EXTRACTION_TIMEOUT_MS=30000
```

---

## 🚀 Running the Server

```bash
cd backend
npm run build
npm run start:prod
```
