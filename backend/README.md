# Educaro AI Companion - Backend

NestJS + TypeScript + TypeORM backend connected to Supabase PostgreSQL database and Supabase Storage.

---

## 📁 Architecture Overview

```text
Pair 1 React Frontend
        ↓
NestJS REST API (/api/v1)
        ↓
Domain Services & Business Logic
 ├── Supabase Storage (educaro-documents) → PDF/Image files
 └── Supabase PostgreSQL → Metadata, State, Profile, Journey
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
│   ├── documents/             # Document upload & management (Phase 3)
│   │   ├── dto/               # upload-document.dto.ts
│   │   ├── entities/          # document.entity.ts
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── storage.service.ts # Supabase Storage integration & sanitization
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

### 4. Document APIs (Phase 3)

#### **Upload Document**
Accepts multipart form-data, validates file size (max 10MB) & MIME type (PDF, PNG, JPG), sanitizes the filename, uploads to Supabase Storage at `applicants/{applicantId}/documents/{documentId}/{filename}`, and saves metadata in PostgreSQL.

- **`POST /api/v1/documents/upload`**
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `applicantId` *(string, UUID v4, required)*: Target applicant ID
  - `file` *(binary file, required)*: Document file (PDF, JPG, JPEG, PNG, max 10MB)
  - `type` *(string, optional)*: E.g., `ACADEMIC_TRANSCRIPT`, `PASSPORT`, `CV`, `LANGUAGE_CERTIFICATE`
- **Response (`201 Created`):**
```json
{
  "id": "e03552d3-eb19-4693-bdc8-ce32cb231be7",
  "applicantId": "e93c5285-9ddd-49b1-ac8e-febb597d6bc3",
  "name": "Bachelor_Degree_Certificate.pdf",
  "type": "ACADEMIC_TRANSCRIPT",
  "status": "uploaded",
  "fileUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/educaro-documents/applicants/e93c5285-9ddd-49b1-ac8e-febb597d6bc3/documents/e03552d3-eb19-4693-bdc8-ce32cb231be7/Bachelor_Degree_Certificate.pdf",
  "extractedData": {},
  "uploadedAt": "2026-10-08T08:45:25.105Z"
}
```

#### **Get All Applicant Documents**
- **`GET /api/v1/applicants/:id/documents`**
- **Response (`200 OK`):**
```json
[
  {
    "id": "e03552d3-eb19-4693-bdc8-ce32cb231be7",
    "applicantId": "e93c5285-9ddd-49b1-ac8e-febb597d6bc3",
    "name": "Bachelor_Degree_Certificate.pdf",
    "type": "ACADEMIC_TRANSCRIPT",
    "status": "uploaded",
    "fileUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/...",
    "extractedData": {},
    "uploadedAt": "2026-10-08T08:45:25.105Z"
  }
]
```

#### **Get Single Document**
- **`GET /api/v1/documents/:id`**
- **Response (`200 OK`):**
```json
{
  "id": "e03552d3-eb19-4693-bdc8-ce32cb231be7",
  "applicantId": "e93c5285-9ddd-49b1-ac8e-febb597d6bc3",
  "name": "Bachelor_Degree_Certificate.pdf",
  "type": "ACADEMIC_TRANSCRIPT",
  "status": "uploaded",
  "fileUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/...",
  "extractedData": {},
  "uploadedAt": "2026-10-08T08:45:25.105Z"
}
```

#### **Trigger Document Processing**
Transitions document status to `processing` and prepares the record for external OCR / AI extraction (Member 4 integration).

- **`POST /api/v1/documents/:id/process`**
- **Response (`200 OK`):**
```json
{
  "documentId": "e03552d3-eb19-4693-bdc8-ce32cb231be7",
  "applicantId": "e93c5285-9ddd-49b1-ac8e-febb597d6bc3",
  "name": "Bachelor_Degree_Certificate.pdf",
  "type": "ACADEMIC_TRANSCRIPT",
  "status": "processing",
  "message": "Document queued for processing"
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

## ⚙️ Setup & Running

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure Supabase variables:
```env
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# PostgreSQL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
DB_SSL=true
DB_SYNCHRONIZE=false

# Supabase Storage
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=educaro-documents
MAX_FILE_SIZE_MB=10
```

### 3. Start Server
```bash
npm run build
npm run start:prod
```
