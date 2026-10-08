# PRD: Educaro AI Companion

## Agentic AI Applicant Journey for Germany

**Hackathon:** ImpactX'26\
**Track:** Agentic AI Track\
**Sponsor:** Educaro Deutschland GmbH\
**Product:** Educaro AI Companion\
**Document Type:** Product Requirements Document (PRD)\
**Version:** 1.0

------------------------------------------------------------------------

# 1. Product Overview

## 1.1 Product Vision

Educaro AI Companion is an agentic AI system designed to guide
applicants from India through their Germany journey for **study,
vocational training, or employment**.

Instead of making applicants repeatedly navigate a website, search for
requirements, understand documents, and manually track what is pending,
the system acts as a continuous AI companion.

The applicant can interact through:

-   Web application
-   AI voice assistant
-   WhatsApp or Telegram
-   Document uploads
-   Natural-language chat
-   Applicant introduction video

The same applicant profile and journey state are shared across all
channels.

### Core idea

> **Don't make the applicant navigate the process. Let the AI navigate
> it for them.**

The AI continuously understands the applicant's current state,
identifies what is missing, decides what should happen next, asks for
the required information, processes documents, evaluates predefined
requirements, and recommends the next step.

------------------------------------------------------------------------

# 2. Problem Statement

Applicants from India exploring opportunities in Germany often face a
fragmented journey involving:

-   Information collection
-   Document preparation
-   Qualification checks
-   Understanding requirements
-   Identifying missing information
-   Deciding what to do next

Information may be distributed across CVs, degree certificates,
experience letters, language certificates, forms, conversations, and
other inputs.

This creates unnecessary manual effort and makes it difficult for
applicants to understand:

-   What information has already been completed
-   Which documents have been received
-   Which documents are missing
-   Whether information is inconsistent
-   Whether they satisfy predefined requirements
-   What they should do next

Educaro's problem statement asks for an integrated AI-powered applicant
journey that progressively builds a structured profile, processes
supporting documents, assesses the applicant against relevant
requirements, and recommends an appropriate next step.

------------------------------------------------------------------------

# 3. Product Goals

## 3.1 Primary Goals

1.  Create one structured applicant profile from multiple inputs.
2.  Understand whether the applicant wants to pursue study, vocational
    training, or employment.
3.  Extract useful information from uploaded documents.
4.  Capture information from an applicant introduction video and
    transcript.
5.  Identify missing, incomplete, or inconsistent information.
6.  Ask intelligent follow-up questions instead of showing unnecessary
    forms.
7.  Assess the applicant against predefined qualification requirements.
8.  Provide a clear qualification outcome and explain missing
    requirements.
9.  Recommend the next appropriate action.
10. Allow applicants to continue the journey through voice and messaging
    channels.
11. Reduce repeated website visits and manual follow-up.
12. Provide consultants with a structured and transparent applicant
    case.

## 3.2 Secondary Goals

-   Generate a professional CV from verified applicant information.
-   Provide proactive reminders and updates.
-   Maintain a unified conversation and application history.
-   Enable human consultant handoff when AI cannot confidently resolve
    an issue.
-   Clearly distinguish applicant-provided, verified, and AI-generated
    information.

------------------------------------------------------------------------

# 4. Non-Goals

The prototype will not attempt to:

-   Replace Educaro consultants completely.
-   Make legally binding immigration decisions.
-   Guarantee admission, employment, visa approval, or relocation
    outcomes.
-   Invent missing applicant information.
-   Automatically make decisions outside predefined qualification rules.
-   Build separate disconnected AI demos.

The system should support applicants and consultants while keeping
qualification logic transparent and controlled.

------------------------------------------------------------------------

# 5. Target Users

## 5.1 Primary User: Applicant

An applicant from India interested in:

-   Studying in Germany
-   Vocational training in Germany
-   Employment in Germany

The applicant may have limited knowledge of the German application
process and may not know which documents or requirements apply to them.

## 5.2 Secondary User: Educaro Consultant

A consultant who needs to:

-   Review applicant profiles
-   Understand missing requirements
-   Inspect extracted documents
-   Review qualification results
-   Continue cases requiring human intervention
-   Contact applicants with the relevant context already available

## 5.3 Internal/Admin User

An internal user who can configure:

-   Qualification requirements
-   Journey stages
-   Document types
-   Required fields
-   Routing rules
-   Consultant assignment

------------------------------------------------------------------------

# 6. Core Product Concept

The product consists of one central AI-powered applicant journey with
multiple interfaces.

``` text
                    APPLICANT
                        |
          +-------------+-------------+
          |             |             |
        Web          WhatsApp      AI Voice
          |          /Telegram        |
          +-------------+-------------+
                        |
                AI Orchestrator
                        |
       +----------------+----------------+
       |                |                |
 Profile Agent     Document Agent   Qualification Agent
       |                |                |
       +----------------+----------------+
                        |
                 Journey State
                        |
                Next Best Action
                        |
          +-------------+-------------+
          |             |             |
      Applicant      Consultant    Notification
```

The key principle is that all channels operate on the same applicant
profile and journey state.

------------------------------------------------------------------------

# 7. Key Differentiator

## 7.1 AI-Driven Next Best Action

The system should continuously answer:

> **"What should this applicant do next?"**

Instead of making the applicant search through the application, the AI
checks the current profile and identifies the next required action.

Example:

``` text
Applicant profile:
- Education: verified
- CV: generated
- Work experience: verified
- English: verified
- German certificate: missing

AI decision:
Next action = Request German certificate

Applicant sees:
"Your next step is to upload your German language certificate."
```

This concept is central to the product.

------------------------------------------------------------------------

# 8. Applicant Journey

## Stage 1: Welcome and Goal Discovery

The applicant starts through the website, messaging bot, or voice
assistant.

The AI asks:

> "What are you planning to do in Germany?"

Options:

-   Study
-   Vocational Training
-   Employment
-   Not sure

The applicant can also answer naturally:

> "I completed my B.Tech in Computer Science and I want to work in
> Germany."

The AI extracts:

``` text
Goal = Employment
Education = B.Tech Computer Science
```

------------------------------------------------------------------------

# 9. Stage 2: Progressive Profile Building

The system should not force the applicant to complete a large form.

Instead, it progressively builds the profile.

The AI asks only for information that is:

-   Missing
-   Relevant
-   Required for the current journey
-   Needed for qualification

Example:

``` text
AI:
"I have your education details from your CV.
I still need your work experience. Do you have any professional experience?"

Applicant:
"Yes, I worked as a software developer for 2 years."

AI:
"Great. Which company did you work for?"
```

The profile gradually becomes complete.

------------------------------------------------------------------------

# 10. Stage 3: Document Processing

Applicants can upload:

-   CV
-   Degree certificates
-   Educational certificates
-   Experience letters
-   Language certificates
-   Other supporting documents

The Document Agent performs:

1.  File validation
2.  OCR/document extraction
3.  Information extraction
4.  Classification
5.  Cross-checking with profile
6.  Confidence scoring
7.  Missing/inconsistency detection

Example:

``` text
Uploaded document:
B.Tech Certificate

Extracted:
Degree: Bachelor of Engineering
Field: Computer Science
Institution: XYZ University
Graduation Year: 2025

Status:
Extracted successfully
Pending verification
```

------------------------------------------------------------------------

# 11. Stage 4: Document and Profile Consistency

The system compares information across sources.

Example:

``` text
CV:
Graduation Year = 2025

Degree Certificate:
Graduation Year = 2024
```

The system should not silently choose one.

Instead:

> "I found different graduation years in your CV and degree certificate.
> Which one is correct?"

This supports the requirement that the system should identify
inconsistent information and should not invent applicant information.

------------------------------------------------------------------------

# 12. Stage 5: AI Introduction Video

The applicant can upload a short introduction video.

The system extracts:

-   Background
-   Motivation
-   Career goals
-   Preferred pathway
-   Relevant statements

Pipeline:

``` text
Video
  ↓
Audio Extraction
  ↓
Speech-to-Text
  ↓
Transcript
  ↓
AI Information Extraction
  ↓
Applicant Profile
```

The extracted information should be marked as applicant-provided and
should not automatically be treated as verified facts.

------------------------------------------------------------------------

# 13. Stage 6: Qualification Assessment

The Qualification Agent checks the structured applicant profile against
predefined requirements.

Example:

``` text
Requirement              Status
--------------------------------------
Relevant degree          ✓
Experience               ✓
Language requirement     ⚠
Required certificate     ✕
Profile completeness     92%
```

Possible outcomes:

-   Qualified based on available information
-   Not currently qualified
-   Additional information required
-   Human verification required

The system should explain the outcome instead of showing only a score.

------------------------------------------------------------------------

# 14. Stage 7: Next Best Action

After qualification or profile analysis, the system identifies the next
action.

Possible actions:

-   Upload missing document
-   Clarify information
-   Complete profile
-   Generate/update CV
-   Proceed to a relevant Educaro service
-   Contact a consultant
-   Wait for verification
-   Complete another required step

Example:

> **Your next step:** Upload your German language certificate.

> **Why:** Your profile is otherwise complete, but language
> qualification information is still pending.

------------------------------------------------------------------------

# 15. Stage 8: Multi-Channel AI Companion

## 15.1 Web Assistant

The applicant can interact with the AI inside the website.

Capabilities:

-   Ask questions
-   View status
-   Upload documents
-   Complete missing information
-   See next action
-   Start a voice interaction

------------------------------------------------------------------------

## 15.2 WhatsApp / Telegram Assistant

The applicant can receive updates without repeatedly opening the
website.

Example:

``` text
Educaro AI

Your application has been updated.

✓ CV processed
✓ Education information extracted
✓ Experience added

⚠ German language certificate is still pending.

Reply:
1. Upload certificate
2. Why is it required?
3. Talk to AI
```

The applicant can upload the document directly through the messaging
channel.

The backend updates the same applicant profile.

------------------------------------------------------------------------

## 15.3 AI Voice Assistant

The applicant can call the AI assistant.

Example conversation:

``` text
AI:
Hi Rahul. I checked your application.
Your education and experience details are complete,
but your German language certificate is still pending.

Applicant:
I have completed B1 but I haven't uploaded the certificate.

AI:
No problem. I'll record your German level as B1.
Please upload the certificate when available.
Would you like me to explain what is pending in your application?
```

The voice agent should be able to:

-   Understand the applicant's current journey
-   Answer questions
-   Identify missing information
-   Collect information
-   Create/update tasks
-   Trigger document requests
-   Escalate to a consultant when necessary

------------------------------------------------------------------------

# 16. AI Inbox

The applicant gets one centralized place for AI-generated updates.

Example:

``` text
AI INBOX

✓ Your CV has been generated
✓ Your degree document was processed
⚠ Clarification required for work experience
⚠ German certificate pending
→ Your next action is ready
```

The goal is to make the applicant feel that the system is actively
managing their journey rather than waiting for them to check the portal.

------------------------------------------------------------------------

# 17. "What Should I Do Next?" Feature

The applicant gets one prominent action:

> **What should I do next?**

When clicked, the AI analyzes:

-   Profile completeness
-   Document status
-   Qualification status
-   Outstanding requirements
-   Previous actions
-   Current journey stage

It then returns one prioritized next step.

Example:

> **Your next step**
>
> Upload your German B1 certificate.
>
> **Why?** Your other required profile information is currently
> complete.

This keeps the user experience simple.

------------------------------------------------------------------------

# 18. AI Agent Architecture

## 18.1 Orchestrator Agent

The Orchestrator is responsible for understanding the current state and
selecting the appropriate agent/tool.

Responsibilities:

-   Understand user intent
-   Read applicant state
-   Decide the next action
-   Call specialized agents
-   Maintain workflow
-   Route to human consultant when required

------------------------------------------------------------------------

## 18.2 Profile Agent

Responsibilities:

-   Extract profile information
-   Structure applicant data
-   Identify missing fields
-   Ask follow-up questions
-   Update the profile

------------------------------------------------------------------------

## 18.3 Document Agent

Responsibilities:

-   Process uploaded documents
-   Extract text
-   Classify document type
-   Extract relevant fields
-   Compare against existing profile
-   Flag inconsistencies

------------------------------------------------------------------------

## 18.4 Qualification Agent

Responsibilities:

-   Retrieve relevant predefined requirements
-   Evaluate profile against requirements
-   Identify satisfied requirements
-   Identify missing requirements
-   Explain qualification status

Deterministic rules should be used wherever predefined rules are more
reliable than generative AI.

------------------------------------------------------------------------

## 18.5 Communication Agent

Responsibilities:

-   Generate applicant-friendly messages
-   Send WhatsApp/Telegram updates
-   Manage reminders
-   Provide status updates
-   Maintain consistent context across channels

------------------------------------------------------------------------

## 18.6 Voice Agent

Responsibilities:

-   Speech-to-text
-   Understand user intent
-   Retrieve applicant context
-   Execute permitted actions
-   Generate response
-   Text-to-speech

------------------------------------------------------------------------

## 18.7 Recommendation Agent

Responsibilities:

-   Analyze current journey state
-   Determine next best action
-   Recommend relevant Educaro service, consultant referral, or
    applicant action

------------------------------------------------------------------------

## 18.8 Human Handoff Agent

The system should escalate when:

-   Information cannot be verified
-   A case falls outside predefined rules
-   The applicant requests human support
-   Confidence is too low
-   A sensitive or complex case requires consultant review

The consultant should receive:

-   Applicant profile
-   Documents
-   Missing information
-   Qualification status
-   AI conversation history
-   Reason for escalation

------------------------------------------------------------------------

# 19. Applicant Profile Data Model

The system should maintain a structured profile.

## Personal

-   Name
-   Contact details
-   Location
-   Availability

## Education

-   Institution
-   Degree/qualification
-   Field of study
-   Graduation date

## Employment

-   Employer
-   Role
-   Responsibilities
-   Duration
-   Relevant experience

## Skills

-   Technical skills
-   Professional skills
-   Certifications

## Languages

-   German
-   English
-   Other languages
-   Proficiency levels
-   Supporting certificates

## Documents

-   CV
-   Degree certificates
-   Experience letters
-   Language certificates
-   Other supporting documents

## Motivation

-   Reason for moving to Germany
-   Preferred pathway
-   Long-term goals

## Media

-   Introduction video
-   Transcript
-   Extracted information

## Qualification

-   Eligibility status
-   Profile completeness
-   Requirements
-   Outstanding requirements

## Recommended Journey

-   Suggested Educaro service
-   Consultant referral
-   Required applicant action

------------------------------------------------------------------------

# 20. Data Provenance

Every important piece of information should have a source.

Example:

``` text
German Level: B1

Source:
Applicant statement

Verification:
Not verified

Confidence:
High
```

Another example:

``` text
Graduation Year: 2025

Source:
Degree Certificate

Verification:
Document processed

Status:
Verified / Pending human verification
```

The system should distinguish:

-   Applicant-provided
-   Document-extracted
-   Verified
-   AI-generated
-   Consultant-confirmed

This reduces the risk of AI-generated information being mistaken for
verified information.

------------------------------------------------------------------------

# 21. Dashboard

## Applicant Dashboard

The applicant should see:

### Profile Completion

``` text
92% Complete
```

### Journey

``` text
Profile       ✓
Documents     ✓
Verification  ✓
Qualification ⚠
Next Step     →
```

### Documents

``` text
✓ CV
✓ Degree Certificate
✓ Experience Letter
⚠ German Certificate
```

### AI Assistant

Chat interface with:

> What do you need help with?

### Next Best Action

Large primary card:

> Upload German Certificate

------------------------------------------------------------------------

# 22. Consultant Dashboard

Consultants should see:

-   Applicant list
-   Journey stage
-   Profile completeness
-   Qualification status
-   Missing documents
-   Inconsistencies
-   AI confidence
-   Last applicant interaction
-   Recommended next action
-   Escalated cases

Example:

``` text
Applicant: Rahul Sharma

Goal: Employment
Profile: 92%
Qualification: Additional information required

Missing:
- German certificate

AI Flag:
Graduation year mismatch

Recommended action:
Review document inconsistency
```

------------------------------------------------------------------------

# 23. Notification System

Notifications can be triggered by:

-   Missing document
-   Profile inactivity
-   Qualification result
-   Document processing completion
-   Consultant message
-   Clarification request
-   Next action availability

Channels:

-   Website
-   WhatsApp
-   Telegram
-   Email
-   Voice call where appropriate

The same event should not create unnecessary duplicate notifications.

------------------------------------------------------------------------

# 24. Example End-to-End Scenario

## Applicant

Rahul is from India.

He wants to work in Germany as a software developer.

### Step 1

Rahul says:

> "I want to work in Germany as a software developer."

AI identifies:

``` text
Goal = Employment
```

### Step 2

Rahul uploads his CV.

AI extracts:

``` text
B.Tech Computer Science
2 years software development experience
English proficiency
Technical skills
```

### Step 3

AI identifies missing information:

``` text
German language level
Experience letter
```

### Step 4

Instead of showing a long form, AI asks:

> "Do you have a German language certificate?"

Rahul replies:

> "Yes, B1."

The profile is updated as:

``` text
German = B1
Source = Applicant-provided
Verification = Pending
```

### Step 5

The AI asks Rahul to upload the certificate.

Rahul uploads it through WhatsApp.

### Step 6

Document Agent processes the certificate.

### Step 7

Qualification Agent checks predefined requirements.

### Step 8

The AI generates:

``` text
Profile: 96% complete

Completed:
✓ Education
✓ Experience
✓ CV
✓ Language information

Pending:
⚠ Final verification

Next step:
Consultant review
```

### Step 9

The applicant receives a WhatsApp message:

> "Your profile is almost complete. Your next step is consultant
> review."

The same status appears on the website.

------------------------------------------------------------------------

# 25. Functional Requirements

## FR-01: Applicant Registration

The system shall allow an applicant to create an account and start an
application.

## FR-02: Goal Detection

The system shall identify whether the applicant's goal is study,
vocational training, or employment.

## FR-03: Progressive Profile

The system shall progressively build a structured applicant profile.

## FR-04: Document Upload

The system shall accept supported applicant documents.

## FR-05: Document Extraction

The system shall extract relevant information from documents.

## FR-06: Inconsistency Detection

The system shall compare extracted information against existing profile
data and flag conflicts.

## FR-07: Missing Information Detection

The system shall identify required information that is missing or
incomplete.

## FR-08: Clarification

The system shall ask applicants for clarification when required.

## FR-09: Video Processing

The system shall accept a short introduction video and extract useful
information through transcription and analysis.

## FR-10: Qualification

The system shall assess applicants against predefined requirements.

## FR-11: Next Best Action

The system shall generate a clear next action based on the current
journey state.

## FR-12: CV Generation

The system shall generate a professional CV from collected and verified
information.

## FR-13: Messaging Integration

The system shall support applicant interaction through a messaging
channel such as WhatsApp or Telegram.

## FR-14: Voice Interaction

The system shall support voice-based interaction with the applicant.

## FR-15: Shared Context

All interfaces shall operate using the same applicant profile and
journey state.

## FR-16: Notifications

The system shall send relevant updates and reminders.

## FR-17: Consultant Handoff

The system shall allow cases to be escalated to a human consultant.

## FR-18: Data Provenance

The system shall track the source and status of important applicant
information.

------------------------------------------------------------------------

# 26. Non-Functional Requirements

## Performance

-   Common dashboard operations should respond quickly.
-   AI responses should provide clear progress indicators when
    processing takes time.
-   Document processing should show processing status.

## Reliability

-   Applicant data must not be lost during multi-step interactions.
-   Failed AI/document operations should be retryable.

## Security

-   Authentication required for applicant profiles.
-   Documents must be access-controlled.
-   Sensitive applicant information must not be exposed to unauthorized
    users.
-   API keys must remain server-side.
-   Role-based access should be used for applicants, consultants, and
    administrators.

## Transparency

The system should clearly distinguish:

-   Verified information
-   Applicant-provided information
-   AI-generated content
-   Consultant-confirmed information

## Extensibility

The architecture should allow additional:

-   AI models
-   Messaging channels
-   Document types
-   Qualification rules
-   Educaro services
-   Agent tools

to be added without redesigning the complete system.

------------------------------------------------------------------------

# 27. Suggested Technology Stack

## Frontend

-   ReactJS
-   TypeScript
-   Vite
-   Tailwind CSS

## Backend

-   NestJS
-   TypeScript
-   REST APIs
-   WebSocket support where useful

## Database

-   PostgreSQL

## AI Layer

A suitable LLM provider can be selected by the team.

The AI layer should support:

-   Structured extraction
-   Tool calling
-   Agent orchestration
-   Conversation
-   Reasoning over applicant state

## Document Processing

Potential components:

-   OCR
-   PDF parser
-   Document classification
-   Structured extraction

## Speech

-   Speech-to-text
-   Text-to-speech
-   Voice agent

## Messaging

-   WhatsApp Business API and/or Telegram Bot API

## Storage

Object storage for:

-   Documents
-   CVs
-   Videos
-   Audio

## Optional

-   Vector database for retrieval
-   Redis for queues/caching
-   Background workers
-   Analytics
-   Observability

------------------------------------------------------------------------

# 28. High-Level System Architecture

``` text
                         CLIENTS
                            |
       +--------------------+--------------------+
       |                    |                    |
   React Web            WhatsApp/Telegram     Voice
       |                    |                    |
       +--------------------+--------------------+
                            |
                         API Layer
                            |
                    Authentication Layer
                            |
                    AI Orchestrator
                            |
       +----------+---------+---------+----------+
       |          |         |         |          |
    Profile    Document  Qualify   Voice    Recommendation
     Agent      Agent     Agent     Agent       Agent
       |          |         |         |          |
       +----------+---------+---------+----------+
                            |
                    Applicant State
                            |
              +-------------+-------------+
              |                           |
          PostgreSQL                 Object Storage
              |
       Qualification Rules
              |
       Consultant Dashboard
```

------------------------------------------------------------------------

# 29. Database Entities

Suggested tables:

``` text
users
applicant_profiles
education
employment
skills
languages
documents
document_extractions
document_verifications
videos
video_transcripts
requirements
qualification_results
journey_stages
journey_actions
ai_conversations
ai_messages
notifications
consultant_assignments
audit_logs
```

------------------------------------------------------------------------

# 30. Key API Areas

## Authentication

``` text
POST /auth/register
POST /auth/login
POST /auth/refresh
```

## Applicant

``` text
GET /applicant/profile
PATCH /applicant/profile
GET /applicant/status
GET /applicant/next-action
```

## Documents

``` text
POST /documents/upload
GET /documents
GET /documents/:id
POST /documents/:id/process
```

## Qualification

``` text
POST /qualification/assess
GET /qualification/result
GET /qualification/requirements
```

## AI

``` text
POST /ai/chat
POST /ai/voice/session
POST /ai/next-action
```

## Messaging

``` text
POST /webhooks/whatsapp
POST /webhooks/telegram
```

## Consultant

``` text
GET /consultant/applicants
GET /consultant/applicants/:id
POST /consultant/escalate
POST /consultant/message
```

------------------------------------------------------------------------

# 31. Agent Tool Examples

The Orchestrator should be able to call controlled tools such as:

``` text
getApplicantProfile()
updateApplicantProfile()
getMissingRequirements()
requestDocument()
processDocument()
compareProfileData()
runQualificationCheck()
generateCV()
getJourneyStatus()
setNextAction()
sendWhatsAppMessage()
sendTelegramMessage()
createConsultantTask()
escalateToConsultant()
```

AI should not directly modify sensitive information without validation.

------------------------------------------------------------------------

# 32. Guardrails

The AI must:

1.  Never invent applicant information.
2.  Never mark an unverified document as verified without the defined
    verification process.
3.  Ask for clarification when conflicting information exists.
4.  Use predefined qualification rules where applicable.
5.  Explain why information is requested where useful.
6.  Maintain a clear distinction between facts and AI-generated
    suggestions.
7.  Escalate uncertain cases to a consultant.
8.  Keep an audit trail of important changes.
9.  Avoid giving unsupported guarantees about admission, employment, or
    visa outcomes.

------------------------------------------------------------------------

# 33. MVP Scope for Hackathon

The prototype should focus on a complete working journey rather than
implementing every possible feature.

## Must Have

### Applicant

-   Registration/login
-   Goal selection
-   AI chat
-   Progressive profile
-   CV upload
-   Document upload
-   Document extraction
-   Missing information detection
-   Qualification assessment
-   Next Best Action
-   Applicant dashboard

### Agentic Layer

-   Orchestrator Agent
-   Profile Agent
-   Document Agent
-   Qualification Agent
-   Recommendation/Next Action Agent

### Communication

At least one external channel:

-   WhatsApp OR Telegram

### Voice

A working AI voice demonstration.

### Consultant

Basic consultant dashboard showing:

-   Applicant profile
-   Missing requirements
-   Qualification result
-   AI recommendation
-   Escalated issues

------------------------------------------------------------------------

# 34. Nice-to-Have Features

If time allows:

-   Introduction video analysis
-   Automatic CV generation
-   Multiple languages
-   AI Inbox
-   Proactive reminders
-   Consultant live chat
-   Advanced document verification
-   Analytics dashboard
-   Email notifications
-   Multiple messaging channels
-   Voice call initiation from dashboard

------------------------------------------------------------------------

# 35. Demo Flow for Hackathon

The ideal demo should take the judges through one applicant.

### Demo

1.  Applicant creates account.
2.  Says: "I want to work in Germany as a software developer."
3.  AI identifies employment pathway.
4.  Applicant uploads CV.
5.  AI extracts education, experience and skills.
6.  AI notices German certificate is missing.
7.  AI asks a targeted question.
8.  Applicant replies through WhatsApp.
9.  Applicant uploads the certificate.
10. Document Agent processes it.
11. Qualification Agent checks predefined requirements.
12. AI identifies the next best action.
13. Applicant receives the result on WhatsApp.
14. Applicant asks the voice assistant what is pending.
15. Voice AI explains the status.
16. Consultant dashboard shows the same updated profile.
17. If required, AI escalates the case to a consultant.

This demonstrates that the system is one continuous journey rather than
separate AI features.

------------------------------------------------------------------------

# 36. Success Metrics

For the prototype, the following metrics can demonstrate value:

## Applicant Experience

-   Percentage of profile completed without manual form filling
-   Time required to reach a structured profile
-   Number of unnecessary website visits reduced
-   Percentage of missing information successfully collected
-   Applicant task completion rate

## AI Performance

-   Document extraction accuracy
-   Correct missing-field detection
-   Correct requirement matching
-   Successful next-action recommendations
-   Number of cases correctly escalated

## Consultant Efficiency

-   Reduction in manual data entry
-   Reduction in repetitive applicant questions
-   Percentage of cases ready for consultant review
-   Time required to understand a new applicant case

------------------------------------------------------------------------

# 37. Example Applicant Experience

### Before

``` text
Applicant
   ↓
Open website
   ↓
Find requirements
   ↓
Fill long form
   ↓
Upload documents
   ↓
Wait
   ↓
Check website again
   ↓
Find missing document
   ↓
Upload again
   ↓
Contact consultant
```

### With Educaro AI Companion

``` text
Applicant
   ↓
Talk to AI
   ↓
AI builds profile
   ↓
Upload documents
   ↓
AI checks everything
   ↓
AI finds missing item
   ↓
WhatsApp notification
   ↓
Applicant uploads from chat
   ↓
AI updates profile
   ↓
Qualification check
   ↓
AI tells applicant what to do next
   ↓
Consultant receives structured case if needed
```

------------------------------------------------------------------------

# 38. Product Principles

## Principle 1: One Journey

Everything should contribute to the same applicant journey.

## Principle 2: Ask Less, Understand More

The AI should avoid unnecessary questions.

## Principle 3: Action Over Information

The applicant should always understand what to do next.

## Principle 4: AI With Boundaries

AI should assist and reason, while deterministic rules handle clearly
defined qualification logic.

## Principle 5: One Profile, Multiple Channels

Website, messaging and voice should never create separate applicant
records.

## Principle 6: No Hallucinated Applicant Data

The system must never fill gaps by guessing.

## Principle 7: Human When Needed

Complex or uncertain cases should move smoothly to an Educaro
consultant.

------------------------------------------------------------------------

# 39. Unique Value Proposition

> **Educaro AI Companion is an agentic AI case manager that follows an
> applicant throughout their Germany journey, understands their current
> state, finds what is missing, communicates through web, messaging and
> voice, and continuously tells them what to do next.**

The key innovation is not simply having a chatbot, WhatsApp bot, or
voice assistant.

The innovation is the **shared intelligent journey underneath them**.

Every interaction updates the same applicant state.

------------------------------------------------------------------------

# 40. Final Product Flow

``` text
                    START
                      |
              "What is your goal?"
                      |
       +--------------+--------------+
       |              |              |
     STUDY      VOCATIONAL       EMPLOYMENT
       |              |              |
       +--------------+--------------+
                      |
             PROFILE BUILDING
                      |
             DOCUMENT PROCESSING
                      |
           VIDEO / CONVERSATION
                      |
          MISSING INFO DETECTION
                      |
             CLARIFICATION
                      |
           QUALIFICATION CHECK
                      |
             +--------+--------+
             |                 |
        Information        Qualified /
          Missing          Next Stage
             |                 |
             ↓                 ↓
       AI Requests        Recommendation
        Information            |
             |                 |
             +--------+--------+
                      |
                NEXT ACTION
                      |
       +--------------+--------------+
       |              |              |
      WEB          WHATSAPP        VOICE
       |              |              |
       +--------------+--------------+
                      |
              CONSULTANT HANDOFF
                  IF NEEDED
```

------------------------------------------------------------------------

# 41. Conclusion

Educaro AI Companion transforms the applicant journey from a fragmented,
form-driven process into a continuous AI-assisted experience.

The applicant can communicate naturally, upload documents, receive
updates, ask questions, use voice, and complete actions without
repeatedly navigating the website.

Behind these interfaces, a central agentic system maintains the
applicant profile, processes information, identifies gaps, evaluates
predefined requirements, and determines the next best action.

The result is a single integrated journey:

> **Understand the applicant → Build the profile → Process the documents
> → Find the gaps → Fix the gaps → Qualify the applicant → Recommend the
> next step → Connect with a consultant when needed.**

------------------------------------------------------------------------

# 42. PS Compliance & Traceability Matrix

This section is the primary checklist for ensuring that the product
strictly follows the Educaro sponsor Problem Statement.

The product must satisfy the Educaro PS first. The AI Companion,
WhatsApp/Telegram, voice assistant, AI Inbox, and Next Best Action are
innovation layers built on top of those mandatory requirements.

## 42.1 Mandatory PS Requirements

  -------------------------------------------------------------------------------------------------------------------
  PS Requirement                             Product Implementation         Responsible       Demo Evidence
                                                                            Component         
  ------------------------------------------ ------------------------------ ----------------- -----------------------
  Understand applicant's goal                Detect Study, Vocational       Orchestrator +    Applicant states their
                                             Training, or Employment intent Profile Agent     goal and AI identifies
                                                                                              pathway

  Progressively build structured applicant   Collect only relevant missing  Profile Agent     Profile grows after
  profile                                    information over multiple                        chat/voice/document
                                             interactions                                     inputs

  Extract information from degrees           OCR + structured extraction    Document Agent    Degree uploaded and
                                                                                              fields extracted

  Extract information from certificates      Document classification +      Document Agent    Certificate uploaded
                                             extraction                                       and processed

  Extract information from experience        Experience extraction          Document Agent    Experience information
  letters                                                                                     added to profile

  Extract language certificate information   Language level/certificate     Document Agent    Language certificate
                                             extraction                                       processed

  Extract information from existing CV       CV parsing                     Document Agent    Existing CV converted
                                                                                              into structured profile

  Generate professional CV                   Generate CV from collected and CV Generation     Download/view generated
                                             verified information           module            CV

  Capture introduction video information     Video transcription +          Media/Video Agent Video transcript and
                                             information extraction                           extracted
                                                                                              motivation/background

  Capture background                         Extract background from        Profile Agent     Background appears in
                                             conversation/video/documents                     structured profile

  Capture motivation                         Extract motivation for moving  Profile Agent +   Motivation shown in
                                             to Germany                     Media Agent       profile

  Capture career goals                       Extract career goals and       Profile Agent     Career goal appears in
                                             preferred pathway                                profile

  Identify missing information               Compare current profile with   Profile Agent     Missing fields shown
                                             required fields                                  

  Identify incomplete information            Detect partially completed     Profile Agent     Incomplete field
                                             profile fields                                   flagged

  Identify inconsistent information          Cross-check profile and        Document Agent    Conflicting data
                                             documents                                        flagged

  Request clarification                      Ask targeted follow-up         Orchestrator      AI asks only for the
                                             questions                                        conflicting/missing
                                                                                              information

  Assess against predefined requirements     Evaluate applicant using       Qualification     Requirement checklist
                                             configurable rules             Agent             and result

  Provide qualification outcome              Produce clear status           Qualification     Qualification result
                                                                            Agent             shown

  Show missing requirements                  Explain outstanding            Qualification     Missing requirements
                                             requirements                   Agent + Next      list
                                                                            Action Agent      

  Recommend appropriate Educaro next step    Route applicant to relevant    Recommendation    Next step displayed
                                             service, consultant, or action Agent             

  Meaningful agentic AI                      Agents reason over state,      AI Orchestrator   End-to-end agent
                                             select tools, coordinate                         workflow
                                             tasks, and decide next action                    

  Reduce manual effort                       Automated extraction, profile  All agents        Before/after workflow
                                             building, reminders,                             comparison
                                             qualification preparation                        

  Integrated applicant journey               One profile and journey state  Journey State +   Web, messaging, and
                                             across all channels            Backend           voice show same status

  Do not invent applicant information        Provenance and verification    Guardrail Layer   Source shown for
                                             controls                                         important data

  Distinguish                                Data provenance labels         Profile +         Source/status displayed
  verified/applicant-provided/AI-generated                                  Verification      
  content                                                                   Layer             

  Clean/extensible solution                  Modular agents, services, and  System            Architecture
                                             APIs                           Architecture      demonstration

  ReactJS + TypeScript                       Web application                Frontend          Running React
                                                                                              application

  NestJS + TypeScript                        Backend/API                    Backend           Running NestJS server

  PostgreSQL                                 Persistent applicant/journey   Database          Applicant state stored
                                             data                                             in PostgreSQL
  -------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 43. Innovation Layer

The following features are intentionally positioned as innovations built
on top of the PS.

They must not replace the mandatory PS functionality.

## 43.1 AI Companion Across Channels

The same applicant can interact with the system through:

-   Web
-   WhatsApp
-   Telegram
-   AI Voice

All channels connect to the same applicant profile and journey state.

### Why it matters

Applicants should not have to repeatedly open the website just to check
what is missing or respond to a simple request.

------------------------------------------------------------------------

## 43.2 AI Voice Assistant

The applicant can call the AI and ask questions naturally.

The AI can:

-   Explain application status
-   Identify missing information
-   Ask clarification questions
-   Collect applicant information
-   Explain the next action
-   Create/update permitted tasks
-   Escalate to a consultant

### Example

``` text
AI:
"I checked your application. Your education and
experience details are complete, but your German
language certificate is still pending."

Applicant:
"I have B1 but haven't uploaded it."

AI:
"Got it. I'll record B1 as applicant-provided.
Please upload the certificate so it can be processed."
```

The voice interface is not a separate chatbot. It accesses the same
journey state used by the web and messaging interfaces.

------------------------------------------------------------------------

# 44. WhatsApp / Telegram Journey

The applicant can continue their journey through messaging.

### Example

``` text
EDUCARO AI

Your application has been updated.

✓ CV processed
✓ Education information extracted
✓ Experience information added

⚠ German certificate pending

What would you like to do?

[Upload Certificate]
[Why is it required?]
[Talk to AI]
[View Status]
```

The applicant can upload the document directly in the conversation.

The document enters the same Document Agent pipeline used by the web
application.

------------------------------------------------------------------------

# 45. "What Should I Do Next?" Feature

This is a simple user-facing feature built around the agentic core.

The applicant sees:

> **What should I do next?**

When triggered, the system checks:

-   Current profile
-   Missing fields
-   Document status
-   Verification status
-   Qualification requirements
-   Previous actions
-   Current journey stage

It returns one prioritized action.

### Example

``` text
YOUR NEXT STEP

Upload your German B1 certificate.

Why?
Your education and experience information is
complete, but language qualification is still pending.

[Upload Certificate]
```

This makes the agentic reasoning visible to the applicant.

------------------------------------------------------------------------

# 46. AI Inbox

The AI Inbox provides a centralized feed of important journey updates.

``` text
AI INBOX

✓ CV generated
✓ Degree document processed
⚠ Work experience clarification required
✓ German certificate received
→ Qualification assessment ready
→ Consultant review recommended
```

The inbox prevents applicants from having to repeatedly search the
portal for updates.

------------------------------------------------------------------------

# 47. Proactive AI

The system should not always wait for the applicant to ask a question.

When a meaningful action is required, the system can proactively notify
the applicant through the available channel.

Examples:

> "Your document has been processed. One field needs clarification."

> "Your profile is almost complete. Please upload your language
> certificate."

> "Your qualification assessment is ready."

The notification should be based on an actual journey state or pending
action and should not generate unnecessary messages.

------------------------------------------------------------------------

# 48. One Applicant, One Journey State

This is a key architectural innovation.

The applicant does not have separate profiles for:

-   Website
-   WhatsApp
-   Telegram
-   Voice

Instead:

``` text
                    APPLICANT
                        |
             Applicant ID / Profile
                        |
              Central Journey State
                        |
       +----------------+----------------+
       |                |                |
      WEB           WHATSAPP/         VOICE
                    TELEGRAM
       |                |                |
       +----------------+----------------+
                        |
                  Same AI Agents
                        |
              Same Documents
                        |
            Same Qualification State
                        |
              Same Next Best Action
```

Example:

The applicant uploads a document through WhatsApp.

Immediately:

-   Document Agent processes it
-   Profile Agent updates the profile
-   Qualification Agent can reassess requirements
-   Next Best Action changes
-   Website dashboard reflects the update
-   Voice assistant can explain the new status

This is the core reason the multi-channel experience remains one
integrated applicant journey.

------------------------------------------------------------------------

# 49. Innovation vs PS Boundary

To avoid scope confusion, the team should use this rule:

## Mandatory

If it is explicitly required by the Educaro PS, it must be demonstrated.

## Innovation

If it improves accessibility, reduces manual work, improves
communication, or makes the journey more intelligent, it can be added
after the mandatory PS flow is working.

### Priority

``` text
                    PRIORITY 1
                 Educaro PS Core
                       ↓
              Complete Applicant
                    Journey
                       ↓
                    PRIORITY 2
               Agentic Orchestration
                       ↓
                    PRIORITY 3
             Voice + WhatsApp/Telegram
                       ↓
                    PRIORITY 4
             AI Inbox + Proactive AI
                       ↓
                    PRIORITY 5
            Additional enhancements
```

The team should never sacrifice a PS requirement just to add another
innovation feature.

------------------------------------------------------------------------

# 50. Strict PS Demo Checklist

Before the final hackathon demo, the team should verify every item
below.

## Applicant Understanding

-   [ ] Study pathway supported
-   [ ] Vocational training pathway supported
-   [ ] Employment pathway supported
-   [ ] Natural-language goal understanding demonstrated

## Profile

-   [ ] Structured applicant profile created
-   [ ] Profile built progressively
-   [ ] Personal information captured
-   [ ] Education captured
-   [ ] Employment captured
-   [ ] Skills captured
-   [ ] Languages captured
-   [ ] Motivation captured
-   [ ] Career goals captured

## Documents

-   [ ] CV processed
-   [ ] Degree processed
-   [ ] Certificate processed
-   [ ] Experience letter processed
-   [ ] Language certificate processed
-   [ ] Missing document detected
-   [ ] Inconsistent information detected
-   [ ] Clarification requested

## Media

-   [ ] Introduction video accepted
-   [ ] Video transcribed
-   [ ] Relevant background extracted
-   [ ] Motivation extracted
-   [ ] Career goals extracted

## Qualification

-   [ ] Predefined requirements configured
-   [ ] Requirements evaluated
-   [ ] Qualification outcome produced
-   [ ] Missing requirements shown
-   [ ] Reason for outstanding requirements shown

## Recommendation

-   [ ] Next step generated
-   [ ] Educaro service/consultant/action routing demonstrated

## Agentic AI

-   [ ] Orchestrator demonstrated
-   [ ] Agents use applicant state
-   [ ] AI decides what information is needed next
-   [ ] Agents coordinate tasks
-   [ ] AI uses tools/actions rather than only generating text

## Trust

-   [ ] No applicant information is invented
-   [ ] Applicant-provided information is labeled
-   [ ] Extracted information has a source
-   [ ] Verification state is visible
-   [ ] Uncertain cases can be escalated

## Innovation

-   [ ] AI Voice Assistant demonstrated
-   [ ] WhatsApp or Telegram demonstrated
-   [ ] Same profile visible across channels
-   [ ] "What should I do next?" demonstrated
-   [ ] AI Inbox demonstrated
-   [ ] Proactive notification demonstrated
-   [ ] Consultant handoff demonstrated

------------------------------------------------------------------------

# 51. Recommended Hackathon MVP

The strongest MVP should demonstrate one complete applicant journey
rather than many disconnected features.

## Core demo

``` text
Applicant starts
      ↓
Chooses employment/study/vocational pathway
      ↓
AI collects profile information
      ↓
Uploads CV + documents
      ↓
Document Agent extracts information
      ↓
Profile becomes structured
      ↓
AI finds a missing requirement
      ↓
AI asks for clarification
      ↓
Applicant responds through WhatsApp
      ↓
Applicant uploads missing document
      ↓
Document Agent processes it
      ↓
Qualification Agent checks requirements
      ↓
AI gives qualification outcome
      ↓
Next Best Action generated
      ↓
Applicant asks AI Voice Assistant
      ↓
Voice AI explains exactly what is pending
      ↓
Consultant receives case if required
```

This single flow demonstrates both the sponsor requirements and the
team's unique innovation.

------------------------------------------------------------------------

# 52. Final Product Positioning

## Short Pitch

> **Educaro AI Companion is an agentic AI system that manages the
> applicant's Germany journey from first interaction to qualification
> and next-step routing. It builds the applicant profile, processes
> documents and video, finds missing or inconsistent information,
> evaluates predefined requirements, and continuously tells the
> applicant what to do next through web, WhatsApp/Telegram, and voice.**

## Simple Human Explanation

> Instead of making applicants repeatedly visit a website, fill forms,
> check documents, and ask what they should do next, we give them an AI
> companion that understands their complete application and guides them
> throughout the journey.

## Core USP

> **Don't make the applicant navigate the process. Let the AI navigate
> it for them.**

------------------------------------------------------------------------

# 53. Final Product Principle

The product should always answer three questions:

### 1. What do we know about this applicant?

Structured profile + documents + conversations + verified information.

### 2. What is missing or uncertain?

Missing fields + missing documents + inconsistencies + pending
verification.

### 3. What should happen next?

One clear next action, executed or communicated through the most
convenient channel.

That is the foundation connecting the Educaro PS with the team's unique
AI Companion concept.
