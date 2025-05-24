# Product Requirements Document (PRD): AIStoryCraft

## 1. Product Overview

### 1.1 Product Name
AIStoryCraft

### 1.2 Vision
AIStoryCraft is a web-based writing application for authors to create, manage, and publish long-form narratives with AI assistance. It integrates user-selected large language models (LLMs) via APIs, maintains persistent story context (characters, events, settings), and supports writing, AI text generation, editing, and export to print-ready PDFs. Hosted on Netlify for seamless deployment and scalability, with Supabase as the backend database for real-time data management, the app will initially launch as a web app with plans for a future desktop version.

### 1.3 Target Audience
- Fiction and non-fiction writers (novelists, short story authors, memoirists)
- Self-publishing authors needing professional output
- Writing enthusiasts exploring AI-assisted storytelling
- Users comfortable with web-based tools and API integrations

### 1.4 Key Objectives
- Enable secure LLM integration via APIs for text generation.
- Persist story context for coherent AI outputs using Supabase.
- Provide an intuitive writing, editing, and AI generation interface.
- Export manuscripts as print-ready PDFs.
- Leverage Netlify for fast, scalable web app deployment with a roadmap for desktop expansion.

## 2. Features and Functionality

### 2.1 Core Features

#### 2.1.1 LLM Integration
- **Description**: Users connect preferred LLMs (e.g., OpenAI, Anthropic) via API keys.
- **Requirements**:
  - Secure API key input, stored in Supabase with encryption.
  - Support for multiple LLM providers with configurable settings (e.g., temperature, max tokens).
  - Validation of API connectivity using Netlify Functions for serverless API calls.
  - Error handling for API issues (e.g., rate limits, invalid keys).

#### 2.1.2 Story Context Management
- **Description**: Persist story elements (characters, events, settings) for coherent AI outputs.
- **Requirements**:
  - Supabase PostgreSQL tables for story metadata (e.g., characters, events, settings).
  - User-editable context fields via forms (e.g., character traits, plot points).
  - Basic automatic extraction of new elements from text (e.g., new characters).
  - Context injection into LLM prompts via Netlify Functions.

#### 2.1.3 Writing Interface
- **Description**: A distraction-free editor for writing, generating, and editing text.
- **Requirements**:
  - Rich text editor with basic formatting (bold, italic, headings, lists).
  - Inline AI text generation (e.g., “Continue” or “Rewrite” options).
  - Chapter and page organization with drag-and-drop navigation.
  - Word count tracking and autosave to Supabase.
  - Version history stored in Supabase for text recovery.

#### 2.1.4 AI Text Generation
- **Description**: Generate text based on prompts, context, or existing text.
- **Requirements**:
  - Generation types: continue story, rewrite section, suggest dialogue.
  - Adjustable output length (e.g., sentence, paragraph).
  - Preview AI-generated text with accept/reject functionality.
  - Refine prompts with user feedback via Netlify Functions.

#### 2.1.5 PDF Export
- **Description**: Export manuscripts as print-ready PDFs.
- **Requirements**:
  - Standard publishing formats (e.g., 6x9 inches, double-spaced).
  - Include title page, table of contents, chapter headings.
  - Serverless PDF generation using Netlify Functions (e.g., with pdfkit).
  - Preview and download PDF in the app.

### 2.2 Additional Features
- **User Accounts**: Secure signup/login with Supabase Auth (email, OAuth).
- **Project Management**: Support for multiple projects, stored in Supabase.
- **Collaboration**: Basic sharing for co-authors (future phase).
- **Analytics**: Writing progress insights (e.g., words written, AI usage).
- **Themes**: Light/dark mode and customizable editor themes.

### 2.3 Non-Functional Requirements
- **Performance**: Page load time < 2 seconds (Netlify CDN), Supabase queries < 500ms.
- **Scalability**: Handle 10,000 concurrent users via Netlify’s auto-scaling.
- **Security**: Encrypt API keys and user data in Supabase; comply with GDPR/CCPA.
- **Accessibility**: WCAG 2.1 compliance for editor and navigation.
- **Cross-Browser Compatibility**: Chrome, Firefox, Safari, Edge.

## 3. Technical Requirements

### 3.1 Architecture
- **Frontend**: React with JSX, Tailwind CSS, hosted on Netlify.
- **Backend**: Supabase PostgreSQL for data storage (users, projects, context, drafts).
- **Serverless Functions**: Netlify Functions for API calls (LLM integration, PDF generation).
- **PDF Generation**: pdfkit or jsPDF, executed via Netlify Functions.
- **Authentication**: Supabase Auth for email, Google, and GitHub OAuth.

### 3.2 Hosting
- **Netlify**:
  - Host static React app and assets via Netlify CDN.
  - Deploy serverless Netlify Functions for backend logic (e.g., LLM API calls, PDF generation).
  - Continuous deployment with Git integration (e.g., GitHub).
  - Domain management and HTTPS via Netlify.
- **Supabase**:
  - PostgreSQL database for structured data (users, projects, context).
  - Real-time subscriptions for autosave and collaboration (future).
  - Row-level security for user-specific data access.
  - API endpoints for CRUD operations on story data.

### 3.3 Future Desktop App
- Electron for cross-platform desktop app, reusing React codebase.
- Local storage for offline mode, syncing with Supabase when online.
- Netlify Functions replaced with local Node.js server for API calls.

## 4. User Flow
1. **Onboarding**:
   - Sign up via Supabase Auth, configure LLM API keys, create project.
   - Guided tour of editor and context tools.
2. **Writing**:
   - Organize story into chapters, add context in Supabase.
   - Write manually or trigger AI generation via Netlify Functions.
   - Edit text, accept/reject AI suggestions, update context.
3. **Export**:
   - Configure PDF settings, generate via Netlify Functions, download.
4. **Management**:
   - Track progress, switch projects, or share (future).

## 5. Success Metrics
- **User Engagement**: 70% of users complete a project within 3 months.
- **Retention**: 50% monthly active users after 6 months.
- **Feature Usage**: 80% of users utilize AI generation and PDF export.
- **Satisfaction**: NPS score > 50 within 6 months.

## 6. Roadmap
### 6.1 Phase 1 (MVP, 3-6 months)
- Core writing interface, LLM integration, Supabase context management.
- Basic PDF export via Netlify Functions.
- User accounts and single-project support.

### 6.2 Phase 2 (6-12 months)
- Advanced AI generation (dialogue, plot suggestions).
- Collaboration and multiple project support in Supabase.
- Analytics and customizable PDF templates.

### 6.3 Phase 3 (12-18 months)
- Desktop app with Electron, offline mode.
- Real-time collaboration using Supabase subscriptions.
- Advanced analytics and export options.

## 7. Risks and Mitigations
- **Risk**: Netlify Functions timeout (10s limit) for complex LLM calls or PDF generation.
  - **Mitigation**: Optimize API calls, use async processing, or offload to Supabase Edge Functions.
- **Risk**: Supabase free tier limitations (e.g., 500MB storage).
  - **Mitigation**: Monitor usage, upgrade to paid tier, optimize data storage.
- **Risk**: User setup complexity (API keys).
  - **Mitigation**: Provide guides, pre-configured LLM options.

## 8. Assumptions
- Users have LLM API keys or are willing to obtain them.
- Netlify and Supabase free tiers suffice for MVP; paid tiers for full release.
- Print-ready PDF requirements align with standard publishing formats.

## 9. Dependencies
- Netlify for hosting and serverless functions.
- Supabase for database and authentication.
- LLM providers for API access.
- Third-party libraries: React, Tailwind CSS, pdfkit.

## 10. Out of Scope (MVP)
- Real-time collaboration.
- Mobile app.
- Built-in LLM (users provide API keys).
- Advanced analytics.