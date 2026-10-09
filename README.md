# 🇩🇪 Educaro AI

### Your AI Companion for the Germany Journey

**Built by Team Pixel Minds**

Educaro AI is an **Agentic AI-powered applicant companion** designed to simplify the journey of Indian students, professionals, and applicants who want to **study, pursue vocational training, or build a career in Germany**.

Instead of making applicants manage multiple disconnected steps, Educaro AI maintains a structured applicant profile, understands their journey, processes documents, evaluates predefined requirements, identifies missing information, and recommends the **Next Best Action**.

---

## 📸 Project Preview

> Add your screenshots inside a `screenshots/` folder in the repository.

### Landing Page

![Educaro AI Landing Page](./screenshots/landing-page.png)

### Applicant Dashboard

![Educaro AI Dashboard](./screenshots/dashboard.png)

### AI Companion

![Educaro AI Companion](./screenshots/ai-companion.png)

### Document Processing

![Document Processing](./screenshots/document-processing.png)

### Journey Tracking

![Journey Tracking](./screenshots/journey.png)

### Voice Assistant

![Voice Assistant](./screenshots/voice.png)

---

# 🎯 The Problem

For Indian applicants planning to move to Germany, the journey can involve many different steps:

* Understanding available pathways
* Checking eligibility
* Preparing documents
* Verifying qualifications
* Tracking missing requirements
* Understanding what to do next
* Communicating with advisors
* Managing information across different platforms

This can become confusing because applicant information is often scattered across **documents, conversations, portals, and support channels**.

Applicants need more than a chatbot that simply answers questions.

They need a system that understands **where they are in their journey and what they should do next**.

---

# 💡 Our Solution

Educaro AI creates a **unified digital journey for every applicant**.

The system maintains a structured applicant profile and continuously understands:

```text
Applicant
    ↓
Profile
    ↓
Journey State
    ↓
Documents
    ↓
Qualifications
    ↓
Current Progress
    ↓
Next Best Action
```

The applicant does not need to repeatedly explain their situation.

The AI uses the applicant's existing context to provide more relevant and personalized assistance.

---

# 🤖 Why Agentic AI?

Traditional chatbot:

```text
Question → Answer
```

Educaro AI:

```text
Understand Applicant
        ↓
Understand Journey
        ↓
Analyze Current State
        ↓
Identify Missing Requirements
        ↓
Reason About Next Step
        ↓
Recommend Action
        ↓
Track Progress
```

The goal is not simply to build another chatbot.

Educaro AI acts as an **intelligent companion that continuously understands and assists the applicant throughout their Germany journey**.

---

# ✨ Key Features

## 1. 🧠 AI Applicant Companion

A conversational AI assistant that understands the applicant's journey and provides contextual guidance.

It can help applicants:

* Understand their current status
* Ask questions about their journey
* Identify missing information
* Understand required documents
* Understand qualification requirements
* Decide what to do next

---

## 2. 👤 Unified Applicant Profile

Each applicant has a structured profile containing information such as:

* Personal details
* Country
* Career goal
* Education
* Qualifications
* Journey stage
* Uploaded documents
* Verification status
* Recommended actions

This profile acts as the central context for the AI.

---

## 3. 📄 Intelligent Document Processing

Applicants can upload documents that are processed by the system.

The document pipeline follows:

```text
Upload Document
       ↓
Document Extraction
       ↓
OCR / AI Processing
       ↓
Extract Relevant Information
       ↓
Store Structured Data
       ↓
Use Information for Qualification Checks
```

This reduces repetitive manual data entry.

---

## 4. ✅ Qualification Evaluation

Educaro AI evaluates predefined qualification requirements using structured applicant information.

The system supports states such as:

| Status                 | Meaning                                     |
| ---------------------- | ------------------------------------------- |
| `SATISFIED`            | Requirement is fulfilled                    |
| `MISSING`              | Required information or document is missing |
| `INCOMPLETE`           | Required information is incomplete          |
| `CONFLICT`             | Conflicting information detected            |
| `PENDING_VERIFICATION` | Verification is required                    |
| `NOT_APPLICABLE`       | Requirement does not apply                  |

Important qualification decisions are handled using **deterministic logic wherever possible**, rather than relying entirely on an LLM.

---

# 🎯 Next Best Action

One of the core ideas behind Educaro AI is the **Next Best Action (NBA)** system.

Instead of only answering:

> "What is my current status?"

The system also answers:

> **"What should I do next?"**

Example:

```text
Missing Passport
       ↓
System identifies missing requirement
       ↓
Priority evaluation
       ↓
Next Best Action
       ↓
Upload Passport
```

The system prioritizes important actions such as:

1. Resolve conflicts
2. Complete missing profile information
3. Upload missing documents
4. Complete pending verification
5. Complete remaining requirements
6. Contact Educaro when human assistance is required

---

# 🎙️ Voice AI

Educaro AI also supports voice-based interaction using **ElevenLabs**.

Applicants can interact with their AI companion using voice instead of relying only on text.

```text
User Voice
    ↓
Speech Processing
    ↓
AI Companion
    ↓
Response Generation
    ↓
Voice Response
```

This creates a more natural and accessible experience.

---

# 📑 CV Generation

Educaro AI includes a CV generation workflow that helps applicants prepare their professional profile for their Germany journey.

The system can use structured applicant information already available in the platform to reduce repetitive data entry.

---

# 🤝 Human Handoff

AI should not handle every situation.

When a case requires human expertise or verification, Educaro AI can identify the need for **human intervention**.

```text
AI Assistance
      +
Human Expertise
      ↓
Better Applicant Support
```

This creates a hybrid AI + human support model.

---

# 🏗️ Agent Architecture

Educaro AI uses multiple specialized agents coordinated through an **AI Orchestrator**.

```text
                         ┌──────────────────┐
                         │    Applicant     │
                         └────────┬─────────┘
                                  │
                         Web / Chat / Voice
                                  │
                                  ▼
                      ┌──────────────────────┐
                      │   AI Orchestrator    │
                      └──────────┬───────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       Profile Agent      Document Agent    Qualification Agent
              │                  │                  │
              └──────────────────┼──────────────────┘
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

### Core Agents

| Agent                    | Responsibility                              |
| ------------------------ | ------------------------------------------- |
| **Orchestrator Agent**   | Coordinates the overall AI workflow         |
| **Profile Agent**        | Maintains applicant context                 |
| **Document Agent**       | Processes and extracts document information |
| **Qualification Agent**  | Evaluates predefined requirements           |
| **Communication Agent**  | Handles applicant communication             |
| **Voice Agent**          | Enables voice-based interaction             |
| **Recommendation Agent** | Determines the next best action             |
| **Human Handoff**        | Escalates cases requiring human support     |

---

# 🏛️ System Architecture

```text
                         ┌─────────────────┐
                         │    Applicant    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ React Frontend  │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   NestJS API    │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       PostgreSQL            AI Services       Supabase Storage
              │                   │                   │
              │                   ▼                   │
              │             Gemini / LLM              │
              │                                       │
              ▼                                       ▼
       Applicant Data                            Documents
```

---

# 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* NestJS
* Node.js
* TypeScript
* REST API

### Database

* PostgreSQL
* TypeORM

### AI

* Google Gemini
* Agentic AI architecture
* Deterministic qualification engine

### Voice

* ElevenLabs

### Storage

* Supabase Storage

### Document Processing

* OCR
* AI-powered document extraction
* Dedicated document extraction service

### Deployment

* Vercel

---

# 📂 Project Structure

```text
ImpactX/
│
├── final frontend/
│   └── pixelmind-final/
│       ├── src/
│       │   ├── components/
│       │   ├── api/
│       │   ├── pages/
│       │   └── ...
│       └── package.json
│
├── backend/
│   ├── src/
│   │   ├── applicants/
│   │   ├── documents/
│   │   ├── ai/
│   │   ├── qualifications/
│   │   ├── journeys/
│   │   └── ...
│   └── package.json
│
├── document-extraction-service/
│   └── ...
│
├── telegram-test/
│   └── ...
│
├── vercel.json
└── README.md
```

---

# 🔄 Applicant Journey

```text
Create Account
      ↓
Applicant Profile
      ↓
Select Germany Pathway
      ↓
Upload Documents
      ↓
Document Processing
      ↓
Qualification Evaluation
      ↓
Identify Missing Requirements
      ↓
Next Best Action
      ↓
Complete Requirements
      ↓
Verification
      ↓
Human Support When Required
      ↓
Journey Completion
```

---

# 🔐 Data & AI Principles

## Database as Source of Truth

The backend database remains the source of truth for important applicant information.

AI is primarily used to:

* Understand
* Extract
* Assist
* Recommend

Important applicant information should be validated before being treated as authoritative.

## Deterministic Qualification

Qualification decisions use predefined rules wherever possible.

This helps reduce inconsistent or unreliable eligibility decisions from generative AI.

## Human Escalation

When a case requires expert judgement, the system can recommend human assistance instead of forcing an AI-only decision.

---

# 🌐 Multi-Channel Vision

Educaro AI is designed around a **unified applicant state**, rather than isolated conversations.

```text
                  ┌─────────────┐
                  │     Web     │
                  └──────┬──────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
        Chat           Voice        Telegram
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                Applicant Profile
                         │
                         ▼
                  Journey State
```

The long-term goal is for applicants to receive consistent assistance regardless of which channel they use.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js
* npm
* PostgreSQL
* Supabase project
* Gemini API key
* ElevenLabs API key

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ImpactX
```

---

## 2. Install Frontend Dependencies

```bash
cd "final frontend/pixelmind-final"
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 3. Install Backend Dependencies

Open another terminal:

```bash
cd backend
npm install
```

---

## 4. Configure Environment Variables

Create a `.env` file inside `backend/`.

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
SUPABASE_STORAGE_BUCKET=your_storage_bucket

CORS_ORIGIN=http://localhost:5173
API_PREFIX=api/v1
```

> ⚠️ **Never commit `.env` files, API keys, database passwords, or service-role keys to GitHub.**

---

## 5. Start the Backend

```bash
npm run start:dev
```

Backend:

```text
http://localhost:3000
```

API:

```text
http://localhost:3000/api/v1
```

---

# ☁️ Deployment

Educaro AI is configured for deployment using **Vercel**.

The project includes Vercel configuration for the frontend and backend serverless deployment.

Production deployment requires the required environment variables to be configured in Vercel.

### Production Database

A local PostgreSQL or Docker database should **not** be used as the production database.

Use a cloud PostgreSQL/Supabase database for production.

---

# 🧪 Testing

Important flows to test before deployment:

### Authentication

```text
Signup
   ↓
Applicant Created
   ↓
Session Stored
   ↓
Dashboard
```

### Login

```text
Email
   ↓
Find Applicant
   ↓
Session Stored
   ↓
Dashboard
```

### Document Processing

```text
Upload
   ↓
Extraction
   ↓
Structured Information
   ↓
Qualification Evaluation
```

### Next Best Action

```text
Applicant State
       ↓
Missing / Conflict / Pending Requirement
       ↓
Priority Evaluation
       ↓
Recommended Action
```

---

# 📸 Screenshots

Place project screenshots inside:

```text
screenshots/
```

Recommended structure:

```text
screenshots/
├── landing-page.png
├── dashboard.png
├── ai-companion.png
├── voice.png
├── document-processing.png
├── qualification.png
├── next-action.png
├── journey.png
└── cv-generator.png
```

Then add them to this section:

### Landing Page

![Landing Page](./screenshots/landing-page.png)

### Dashboard

![Dashboard](./screenshots/dashboard.png)

### AI Companion

![AI Companion](./screenshots/ai-companion.png)

### Voice Assistant

![Voice Assistant](./screenshots/voice.png)

### Document Processing

![Document Processing](./screenshots/document-processing.png)

### Qualification

![Qualification](./screenshots/qualification.png)

### Next Best Action

![Next Best Action](./screenshots/next-action.png)

### Journey

![Journey](./screenshots/journey.png)

### CV Generator

![CV Generator](./screenshots/cv-generator.png)

---

# 🔮 Future Scope

Educaro AI can be further extended with:

* WhatsApp integration
* Advanced multilingual support
* More Germany pathways
* Improved document verification
* More advanced recommendation models
* Educaro advisor dashboard
* Applicant analytics
* Real-time journey notifications
* Additional voice capabilities
* Deeper integration with Educaro workflows

---

# 🏆 ImpactX'26

**Project:** Educaro AI
**Track:** Agentic AI
**Sponsor:** Educaro Deutschland GmbH
**Team:** Pixel Minds

Educaro AI focuses on transforming a complex Germany application journey into a **personalized, intelligent, and action-oriented experience**.

---

# 👥 Team Pixel Minds

**Educaro AI is built by Team Pixel Minds for ImpactX'26.**

| Member   | Role                     |
| -------- | ------------------------ |
| Member 1 | AI / Backend             |
| Member 2 | Frontend                 |
| Member 3 | AI / Document Processing |
| Member 4 | Product / Integration    |

> Replace the roles above with your actual team member names and responsibilities.

---

# ❤️ Educaro AI

### One Applicant. One Journey. One Intelligent Companion.

**Made with ❤️ by Team Pixel Minds**

**ImpactX'26 · Agentic AI**
