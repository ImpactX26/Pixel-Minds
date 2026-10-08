# Pair 2 Workflow - Educaro AI Companion

## Pair 2 Members

### Member 3 - Backend + Core AI
- NestJS backend
- PostgreSQL database
- Applicant/profile APIs
- Journey state management
- Document processing
- Qualification engine
- Next Best Action logic
- AI orchestration

### Member 4 - AI + Communication Integrations
- AI Agent logic
- Telegram integration
- WhatsApp integration
- AI conversation handling
- Voice/communication support
- External AI/OCR/document services
- Supporting backend services

---

# 1. Overall Workflow

```text
Applicant
   ↓
Web / Telegram / WhatsApp / AI Voice
   ↓
Backend API
   ↓
AI Orchestrator
   ↓
┌──────────────────────────────┐
│ Profile Agent                │
│ Document Agent               │
│ Qualification Engine         │
│ Next Best Action             │
└──────────────────────────────┘
   ↓
Applicant Journey State
   ↓
PostgreSQL
   ↓
Backend API
   ↓
Frontend Pair 1
```

**Main rule:** PostgreSQL + backend is the source of truth.

The AI should not become the database or make qualification decisions outside predefined rules.

---

# 2. Member 3 - Backend + Core AI

## Step 1: Backend Setup

Set up:

- NestJS
- TypeScript
- PostgreSQL
- Environment variables
- Database connection
- REST API structure
- Authentication if required
- Basic error handling

Recommended structure:

```text
backend/
├── src/
│   ├── applicants/
│   ├── profile/
│   ├── journey/
│   ├── documents/
│   ├── qualification/
│   ├── next-action/
│   ├── ai/
│   ├── conversations/
│   └── common/
```

---

# 3. Database Design

Create the main entities/tables.

### Applicant

```text
id
name
email
phone
country
goal
createdAt
updatedAt
```

### Applicant Profile

```text
applicantId
education
experience
skills
languages
workExperience
additionalInfo
```

### Documents

```text
id
applicantId
name
type
status
fileUrl
extractedData
uploadedAt
```

### Journey

```text
applicantId
currentStage
progress
status
updatedAt
```

### Qualification

```text
applicantId
requirements
completedRequirements
missingRequirements
status
```

### Next Action

```text
applicantId
action
title
reason
priority
status
```

### Conversations

```text
id
applicantId
channel
message
sender
createdAt
```

---

# 4. Applicant APIs

Build the APIs that Pair 1 will consume.

```http
GET /api/v1/applicants/:id
PATCH /api/v1/applicants/:id
```

Profile:

```http
GET /api/v1/applicants/:id/profile
PATCH /api/v1/applicants/:id/profile
```

The response structure must be agreed with Pair 1 before frontend integration.

---

# 5. Journey Engine

Journey flow:

```text
Goal Detection
      ↓
Profile Building
      ↓
Document Processing
      ↓
Missing / Inconsistent Information
      ↓
Qualification Check
      ↓
Next Best Action
      ↓
Germany Journey
```

Example:

```json
{
  "currentStage": "DOCUMENT_PROCESSING",
  "progress": 68
}
```

API:

```http
GET /api/v1/applicants/:id/journey
```

This data controls the globe/plane movement on Pair 1's frontend.

---

# 6. Document Workflow

```text
Upload Document
      ↓
Backend receives file
      ↓
Store file
      ↓
Document Processing
      ↓
Extract useful information
      ↓
Update Applicant Profile
      ↓
Check missing/inconsistent information
      ↓
Update Journey
      ↓
Calculate Next Best Action
```

APIs:

```http
POST /api/v1/documents/upload
GET /api/v1/applicants/:id/documents
GET /api/v1/documents/:id
POST /api/v1/documents/:id/process
```

---

# 7. Qualification Workflow

```text
Applicant Profile
      +
Processed Documents
      ↓
Qualification Engine
      ↓
Check Requirements
      ↓
┌─────────────────────┐
│ Completed           │
│ Missing             │
│ Inconsistent        │
└─────────────────────┘
      ↓
Qualification Result
```

APIs:

```http
GET /api/v1/applicants/:id/qualification
POST /api/v1/applicants/:id/qualification/check
GET /api/v1/applicants/:id/requirements
```

---

# 8. Next Best Action

The backend should determine:

> **What should this applicant do next?**

Example:

```text
Applicant uploaded CV
        ↓
Profile extracted
        ↓
German language information missing
        ↓
Qualification cannot be completed
        ↓
Next Best Action:
"Upload German language certificate"
```

API:

```http
GET /api/v1/applicants/:id/next-action
```

Example:

```json
{
  "action": "UPLOAD_DOCUMENT",
  "title": "Upload your German language certificate",
  "reason": "Language qualification is still pending",
  "priority": "high"
}
```

Pair 1 displays this directly in the frontend.

---

# 9. AI Orchestrator - Member 3 + Member 4

```text
User Message
     ↓
AI Orchestrator
     ↓
Understand Intent
     ↓
Read Applicant State
     ↓
Decide Required Action
     ↓
Call Appropriate Service
     ↓
Update Applicant State
     ↓
Determine Next Best Action
     ↓
Respond to Applicant
```

Example:

```text
Applicant:
"I want to work in Germany as a software developer."

        ↓

AI understands:
Goal = Employment

        ↓

Profile Agent:
Checks existing profile

        ↓

Missing:
German language level
Experience certificate

        ↓

AI:
Asks applicant for missing information

        ↓

Profile updated

        ↓

Qualification checked

        ↓

Next Best Action generated
```

---

# 10. Member 4 - Communication Workflow

## Telegram

```text
Telegram User
      ↓
Telegram Bot
      ↓
Telegram Webhook
      ↓
Backend
      ↓
Find Applicant
      ↓
AI Orchestrator
      ↓
Response
      ↓
Telegram
```

Endpoint:

```http
POST /api/v1/channels/telegram/webhook
```

## WhatsApp

```text
WhatsApp User
      ↓
WhatsApp Cloud API
      ↓
Webhook
      ↓
Backend
      ↓
Applicant State
      ↓
AI Orchestrator
      ↓
Response
      ↓
WhatsApp
```

Endpoint:

```http
POST /api/v1/channels/whatsapp/webhook
```

Telegram and WhatsApp must use the same applicant profile and journey state.

---

# 11. AI Chat

```http
POST /api/v1/ai/chat
```

Request:

```json
{
  "applicantId": "rahul-001",
  "message": "What documents am I missing?"
}
```

Backend:

```text
Message
 ↓
Applicant State
 ↓
Documents
 ↓
Qualification
 ↓
Next Action
 ↓
AI
 ↓
Response
```

Example:

```json
{
  "message": "You still need to provide your German language certificate."
}
```

---

# 12. Real-Time Updates

If implemented:

```text
Backend Event
      ↓
WebSocket / SSE
      ↓
Pair 1 Frontend
      ↓
UI updates automatically
```

Possible events:

```text
DOCUMENT_PROCESSING
DOCUMENT_PROCESSED
PROFILE_UPDATED
QUALIFICATION_UPDATED
NEXT_ACTION_CHANGED
JOURNEY_STAGE_CHANGED
```

Example:

```text
Document processed
      ↓
Backend updates profile
      ↓
Qualification recalculated
      ↓
Next action changes
      ↓
Frontend receives event
      ↓
Globe + cards update
```

---

# 13. How Pair 2 Works Together

### Member 3

```text
Database
   ↓
Backend APIs
   ↓
Journey
   ↓
Documents
   ↓
Qualification
   ↓
Next Best Action
   ↓
AI Orchestrator
```

### Member 4

```text
AI
 ↓
Telegram
 ↓
WhatsApp
 ↓
Voice
 ↓
External AI/OCR services
 ↓
Conversation handling
```

Member 4's integrations depend on Member 3's backend APIs and applicant state, so both members should coordinate continuously.

---

# 14. Integration With Pair 1

```text
                 PAIR 2
                   │
                   ▼
        ┌─────────────────────┐
        │     NestJS API      │
        └──────────┬──────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
     PostgreSQL        AI Services
          │                 │
          └────────┬────────┘
                   │
                   ▼
              PAIR 1
        React + TypeScript UI
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
     Globe      Profile     AI Chat
```

---

# 15. Development Order

## Phase 1 - Foundation

### Member 3
- NestJS
- PostgreSQL
- Database schema
- Basic API structure

### Member 4
- AI provider setup
- AI system instructions
- Telegram/WhatsApp setup

## Phase 2 - Core Applicant

### Member 3
- Applicant API
- Profile API
- Journey API

### Member 4
- AI understands applicant goal
- Connect AI to applicant state

## Phase 3 - Documents

### Member 3
- Upload API
- Document storage
- Document status

### Member 4
- OCR/extraction integration
- Extract useful information
- Send extracted data to backend

## Phase 4 - Qualification

### Member 3
- Requirement engine
- Qualification API
- Missing information detection

### Member 4
- AI explanation of missing information
- Follow-up questions

## Phase 5 - Next Best Action

Both members:

```text
Profile
+
Documents
+
Qualification
+
Journey
      ↓
Next Best Action
```

## Phase 6 - Communication

### Member 4
- Telegram
- WhatsApp
- AI chat
- Voice if time permits

All channels must connect to the same applicant state.

## Phase 7 - Pair 1 Integration

```text
Frontend
   ↓
API
   ↓
Database
   ↓
AI
   ↓
Updated State
   ↓
Frontend
```

Test one complete applicant journey from start to finish before adding extra features.

---

# 16. Hackathon Priority

## 🔴 Must Have

1. PostgreSQL
2. NestJS backend
3. Applicant profile
4. Journey state
5. Document upload/extraction
6. Qualification check
7. Missing information
8. Next Best Action
9. AI Orchestrator
10. APIs for Pair 1

## 🟡 Should Have

11. Telegram
12. AI Chat
13. Real-time updates
14. WhatsApp

## 🟢 If Time Allows

15. AI Voice
16. Advanced conflict detection
17. Video analysis
18. Advanced consultant features

---

# 17. Final Definition of Done

- [ ] Backend is running
- [ ] PostgreSQL is connected
- [ ] Applicant can be created/read/updated
- [ ] Applicant profile works
- [ ] Journey state works
- [ ] Documents can be uploaded
- [ ] Document information can be extracted
- [ ] Missing information can be detected
- [ ] Qualification can be checked
- [ ] Next Best Action is generated
- [ ] AI understands the applicant's current state
- [ ] AI asks relevant follow-up questions
- [ ] Telegram works
- [ ] WhatsApp works if implemented
- [ ] APIs are connected with Pair 1
- [ ] API responses match the agreed API contract
- [ ] No important applicant state is hardcoded
- [ ] One complete applicant journey works from start to finish

---

## Main Goal of Pair 2

> **Build the brain and backend of Educaro AI Companion, then expose clean APIs so Pair 1 can turn that functionality into the actual product UI.**
