# Educaro AI

### AI-Powered Companion for the Germany Journey

**Built by Team Pixel Minds**

Educaro AI is an **Agentic AI-powered platform** that helps Indian applicants navigate their journey to Germany for **higher education, vocational training, and career opportunities**.

It brings applicant information, documents, qualification checks, AI assistance, and next-step recommendations into one unified platform.

---

## 📸 Screenshots

### Landing Page

<img width="1600" height="836" alt="image" src="https://github.com/user-attachments/assets/3be16b31-5b8b-4f82-b58e-d22a9d723acd" />


### Applicant Dashboard

<img width="1600" height="839" alt="image" src="https://github.com/user-attachments/assets/60af47be-9566-49d2-8150-a1d61a1ad8e4" />


### Eligibility Assessment

<img width="1600" height="834" alt="image" src="https://github.com/user-attachments/assets/13847f9d-6f16-4994-b37f-63d3a06ab3a9" />


### Journey & Progress

<img width="1203" height="889" alt="image" src="https://github.com/user-attachments/assets/54ce3ae6-2a1d-473f-a51a-4866443379cb" />


### Voice Assistant

<img width="1159" height="888" alt="image" src="https://github.com/user-attachments/assets/683f7252-7536-4071-8fa5-33be0cdc01c1" />



---

## 🎯 Problem

The Germany application journey can involve multiple steps such as:

* Understanding the right pathway
* Checking requirements
* Preparing documents
* Verifying qualifications
* Tracking progress
* Knowing what to do next
* Getting support when needed

Applicant information is often scattered across documents, conversations, and different platforms.

**Educaro AI brings this journey together into one intelligent system.**

---

## 💡 What Educaro AI Does

The platform maintains a structured applicant profile and continuously uses the applicant's current state to provide relevant assistance.

```text
Applicant Profile
       ↓
Journey State
       ↓
Documents & Qualifications
       ↓
AI Analysis
       ↓
Next Best Action
```

The key idea is simple:

> **Don't just answer the applicant. Understand their journey and help them move forward.**

---

# ✨ Key Features

### 🧠 AI Companion

Context-aware AI assistance based on the applicant's profile and current journey.

### 👤 Unified Applicant Profile

Stores important information such as:

* Personal details
* Education
* Career goal
* Qualifications
* Journey progress
* Documents
* Verification status

### 📄 Document Intelligence

Upload documents and extract relevant information using OCR and AI.

```text
Upload
  ↓
Extract
  ↓
Structure
  ↓
Validate
  ↓
Use in Applicant Journey
```

### ✅ Qualification Engine

Evaluates predefined requirements using deterministic rules.

Supported states include:

`SATISFIED` · `MISSING` · `INCOMPLETE` · `CONFLICT` · `PENDING_VERIFICATION`

### 🎯 Next Best Action

The system identifies the most important action an applicant should take next.

Example:

```text
Missing Document
      ↓
Priority Evaluation
      ↓
Upload Document
```

### 🎙️ Voice Interaction

Voice-based AI interaction powered by **ElevenLabs**.

### 📑 CV Generation

Generate a CV using information already available in the applicant profile.

### 🤝 Human Handoff

Cases requiring expert assistance can be escalated to human support.

---

# 🤖 Agentic AI Architecture

```text
                         Applicant
                             │
                             ▼
                     AI Orchestrator
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   Profile Agent      Document Agent      Qualification Agent
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                  Recommendation Agent
                             │
                             ▼
                    Next Best Action
                             │
                             ▼
                     Human Handoff
```

### Agents

| Agent                    | Purpose                             |
| ------------------------ | ----------------------------------- |
| **Orchestrator**         | Coordinates the AI workflow         |
| **Profile Agent**        | Manages applicant context           |
| **Document Agent**       | Extracts information from documents |
| **Qualification Agent**  | Evaluates predefined requirements   |
| **Communication Agent**  | Handles applicant interaction       |
| **Voice Agent**          | Handles voice interaction           |
| **Recommendation Agent** | Determines the next best action     |
| **Human Handoff**        | Escalates cases when required       |

---

# 🏗️ Technology Stack

| Layer               | Technology                  |
| ------------------- | --------------------------- |
| Frontend            | React, Vite, JavaScript     |
| Backend             | NestJS, Node.js, TypeScript |
| Database            | PostgreSQL, TypeORM         |
| AI                  | Google Gemini               |
| Voice               | ElevenLabs                  |
| Storage             | Supabase Storage            |
| Document Processing | OCR + AI                    |
| Deployment          | Vercel                      |

---

# 🔄 Applicant Journey

```text
Create Account
      ↓
Complete Profile
      ↓
Select Germany Pathway
      ↓
Upload Documents
      ↓
Qualification Check
      ↓
Identify Missing Requirements
      ↓
Next Best Action
      ↓
Complete Requirements
      ↓
Verification
      ↓
Human Support if Required
```

---

# 🔐 Design Principles

### Database as Source of Truth

Applicant information is stored and managed by the backend rather than relying on AI-generated responses as the source of truth.

### Deterministic Qualification

Important qualification checks use predefined rules wherever possible.

### AI for Assistance

AI is primarily used for understanding, extraction, communication, and recommendations.

### Human-in-the-Loop

Cases requiring expert judgement can be transferred to human support.

---

# 📂 Project Structure

```text
ImpactX/
│
├── final frontend/
│   └── pixelmind-final/
│
├── backend/
│
├── document-extraction-service/
│
├── telegram-test/
│
├── screenshots/
│
├── vercel.json
└── README.md
```

---

# 🚀 Local Setup

## Prerequisites

* Node.js
* npm
* PostgreSQL
* Supabase
* Google Gemini API key
* ElevenLabs API key

### Frontend

```bash
cd "final frontend/pixelmind-final"
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend runs at:

```text
http://localhost:3000
```

API base:

```text
/api/v1
```

### Environment Variables

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
DB_SSL=false

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model

ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=your_bucket

CORS_ORIGIN=http://localhost:5173
API_PREFIX=api/v1
```

> **Never commit API keys, passwords, or `.env` files to GitHub.**

---

# ☁️ Deployment

Educaro AI is configured for **Vercel deployment**.

Production requires the appropriate environment variables and a cloud PostgreSQL/Supabase database.

---

# 🧪 Core Flows

### Authentication

```text
Signup / Login
      ↓
Applicant
      ↓
Session
      ↓
Dashboard
```

### Document Processing

```text
Upload
  ↓
Extraction
  ↓
Structured Data
  ↓
Qualification Check
```

### Next Best Action

```text
Applicant State
      ↓
Requirement Analysis
      ↓
Priority
      ↓
Recommended Action
```

---

# 🏆 ImpactX'26

**Project:** Educaro AI
**Track:** Agentic AI
**Sponsor:** Educaro Deutschland GmbH
**Team:** Pixel Minds

---

# 👥 Team Pixel Minds

| Member   | Role                     |
| -------- | ------------------------ |
| Member 1 | AI / Backend             |
| Member 2 | Frontend                 |
| Member 3 | AI / Document Processing |
| Member 4 | Product / Integration    |

> Replace the placeholders with your actual team members and roles.

---

## Educaro AI

### One Applicant. One Journey. One Intelligent Companion.

**Made with ❤️ by Team Pixel Minds**
