# PixelMind AI — Document Intelligence & Extraction Service

> **Role:** Member 4 – AI + Communication Integrations  
> **Status:** Phase 1 Working OCR + AI Extraction Service

---

## 1. Overview & Purpose

This service acts as an **External Document Intelligence Service** for PixelMind AI. It receives a document reference (`documentId` + file URL / path / base64), runs OCR/text processing, passes the text to an AI extraction model (Google Gemini with strict structured output), validates the extracted JSON schema, calculates an extraction confidence score, and returns the result linked directly to the original `documentId`.

```text
Existing Document (in Member 3's Supabase Storage)
        ↓
    documentId
        ↓
Retrieve & Access Document
        ↓
Detect File Type (PDF / JPG / PNG)
        ↓
PDF / Image Processing & OCR (pdf-parse / tesseract.js)
        ↓
AI Structured Extraction (Google Gemini / Zero-Hallucination Prompt)
        ↓
Strict Schema Validation (Zod)
        ↓
Confidence Scoring (0.00 – 1.00)
        ↓
Return Extraction Result to Member 3 Backend
```

---

## 2. Architecture & Single Source of Truth

- **Member 3 Backend (NestJS + Supabase PostgreSQL):** Remains the **SINGLE SOURCE OF TRUTH** for Applicants, Profiles, Journey States, Document records, Supabase Storage, and Qualification logic.
- **This Service (Member 4):** Pure, stateless document extraction engine. It **does NOT** create duplicate database tables or alter schemas.

---

## 3. Directory Structure

```text
document-extraction-service/
├── src/
│   ├── config/
│   │   └── env.ts                                # Environment configuration and safe secret masking
│   ├── types/
│   │   └── extraction.types.ts                   # Zod schemas, DTOs, and TypeScript interfaces
│   ├── services/
│   │   ├── document-loader.service.ts            # Fetches documents from URLs, paths, or base64
│   │   ├── ocr/
│   │   │   ├── ocr.interface.ts                  # Provider interface for OCR engines
│   │   │   ├── pdf-parser.provider.ts            # Text extraction from PDF documents
│   │   │   ├── tesseract-ocr.provider.ts         # OCR for images (PNG, JPG/JPEG)
│   │   │   └── ocr-manager.service.ts            # Routing between PDF and Image OCR
│   │   ├── ai/
│   │   │   ├── ai.interface.ts                   # Provider interface for AI extraction
│   │   │   ├── gemini-extraction.provider.ts     # Gemini API integration with zero-hallucination rules
│   │   │   ├── mock-fallback-extraction.provider.ts # Deterministic local rules fallback for offline dev/tests
│   │   │   └── ai-manager.service.ts             # Provider selector and coordinator
│   │   ├── confidence-evaluator.service.ts       # Evaluates extraction confidence score (0.00 - 1.00)
│   │   └── document-extraction.service.ts        # Main end-to-end pipeline orchestrator
│   ├── controllers/
│   │   └── extraction.controller.ts              # API endpoints for extraction & testing
│   ├── nestjs-integration/
│   │   └── document-extraction.client.ts         # Ready-to-use client for Member 3's backend
│   ├── tests/
│   │   └── test-sample.ts                        # Automated test script
│   └── server.ts                                 # Express application setup
├── .env                                          # Local secrets (git-ignored)
├── .env.example                                  # Template for environment variables
├── package.json                                  # Dependencies and NPM scripts
├── tsconfig.json                                 # TypeScript compiler configuration
└── README.md                                     # Documentation and Integration Guide
```

---

## 4. Environment Configuration (`.env`)

Copy `.env.example` to `.env`:

```env
PORT=3001
NODE_ENV=development

# AI Provider ('gemini' or 'mock')
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# OCR Provider ('tesseract' or 'mock')
OCR_PROVIDER=tesseract
```

*(Note: If `GEMINI_API_KEY` is omitted or empty, the service automatically falls back to its deterministic local extraction engine so tests run smoothly out-of-the-box).*

---

## 5. How to Install and Start

```bash
# 1. Navigate to the service folder
cd "document-extraction-service"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Run automated test suite
npm run test:sample
```

---

## 6. API Reference

### A. Extract Document Data
- **Route:** `POST /api/v1/document-extraction/extract`
- **Content-Type:** `application/json`

#### Request Body:
```json
{
  "documentId": "doc-deg-1001",
  "documentUrl": "https://your-supabase-project.supabase.co/storage/v1/object/public/documents/sample-degree.pdf",
  "documentType": "degree_certificate"
}
```

#### Successful Response (`200 OK`):
```json
{
  "documentId": "doc-deg-1001",
  "documentType": "degree_certificate",
  "status": "processed",
  "extractedData": {
    "fullName": "Nithin N",
    "dateOfBirth": "2008-01-01",
    "degree": "Bachelor of Engineering",
    "university": "Visvesvaraya Technological University",
    "graduationYear": "2028",
    "institutionLocation": "Bengaluru, Karnataka, India",
    "gradeOrGpa": null
  },
  "confidence": 0.94,
  "metadata": {
    "ocrMethod": "pdf-native-text-extraction",
    "aiProvider": "Google Gemini",
    "processingTimeMs": 620,
    "charCount": 380,
    "extractedAt": "2026-10-08T09:00:00.000Z"
  }
}
```

#### Failed Response (`422 Unprocessable Entity`):
```json
{
  "documentId": "doc-deg-1001",
  "status": "failed",
  "extractedData": null,
  "confidence": 0,
  "error": "File not found at specified URL"
}
```

---

### B. Built-in Sample Test Endpoint
- **Route:** `GET /api/v1/document-extraction/sample-test`
- Returns an instant verification extraction of a sample degree certificate without needing any file upload.

---

### C. Health Check Endpoint
- **Route:** `GET /health`
- Response:
```json
{
  "status": "ok",
  "service": "PixelMind AI - Member 4 Document Intelligence & Extraction Service",
  "timestamp": "2026-10-08T09:00:00.000Z",
  "aiProvider": "gemini",
  "ocrProvider": "tesseract"
}
```

---

## 7. How Member 3 Calls This Service

In Member 3's NestJS document processing workflow (`POST /api/v1/documents/:id/process`), call this extraction service:

```typescript
import { DocumentExtractionClient } from './document-extraction.client';

@Injectable()
export class DocumentProcessingService {
  private extractionClient = new DocumentExtractionClient('http://localhost:3001');

  async processApplicantDocument(documentId: string, fileUrl: string) {
    // 1. Call Member 4's Extraction Service
    const extraction = await this.extractionClient.extractDocument({
      documentId,
      documentUrl: fileUrl,
      documentType: 'degree_certificate',
    });

    // 2. Member 3 updates database record with extracted structured data
    if (extraction.status === 'processed') {
      await this.documentRepo.update(documentId, {
        status: 'PROCESSED',
        extractedData: extraction.extractedData,
        confidence: extraction.confidence,
      });

      // 3. Trigger Qualification Engine & Next Best Action
      await this.qualificationEngine.evaluate(documentId);
    }
  }
}
```
