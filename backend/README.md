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
