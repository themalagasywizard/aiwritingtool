# AIStoryCraft: Detailed Feature List for MVP and Full Product Release

This feature list outlines the **Minimum Viable Product (MVP)** and **Full Product Release** for AIStoryCraft, tailored to use **Netlify** for hosting and **Supabase** as the database. Features are designed to leverage Netlify’s CDN and serverless functions and Supabase’s PostgreSQL and real-time capabilities.

---

## 1. Minimum Viable Product (MVP) Feature List

The MVP delivers core functionality for writing, AI-assisted text generation, context management, and PDF export, optimized for Netlify and Supabase.

### 1.1 LLM Integration
- **API Key Management**:
  - Secure form to input LLM API keys (e.g., OpenAI, Anthropic).
  - Store keys in Supabase with AES-256 encryption.
  - Client-side format validation; server-side connectivity check via Netlify Functions.
- **Supported Providers**:
  - Support for OpenAI GPT and Anthropic Claude.
  - Configurable parameters (temperature, max tokens) with defaults.
- **Error Handling**:
  - Display errors for invalid keys or API limits in UI.
  - Retry option for failed API calls via Netlify Functions.

### 1.2 Story Context Management
- **Supabase Database**:
  - PostgreSQL tables: `characters` (name, traits, role), `events` (description, timestamp), `settings` (name, details).
  - Row-level security to restrict access to user’s data.
- **Manual Context Input**:
  - React form to add/edit/delete elements (e.g., “Add Character” modal).
  - Required fields: name, description; optional: backstory.
- **Automatic Context Extraction**:
  - Basic NLP (via Netlify Functions) to detect new elements (e.g., character names).
  - Prompt user to confirm extracted elements for Supabase storage.
- **Context Injection**:
  - Fetch context from Supabase and append to LLM prompts (max 2,000 tokens).
  - Cache recent context in local storage for performance.

### 1.3 Writing Interface
- **Rich Text Editor**:
  - React-based editor (e.g., Quill) with bold, italic, headings (H1-H3), lists.
  - Distraction-free mode with full-screen toggle.
- **Chapter Organization**:
  - Sidebar with drag-and-drop chapter list.
  - Add/rename/delete chapters, stored in Supabase `chapters` table.
- **AI Integration**:
  - Inline options: highlight text, select “Continue,” “Rewrite,” or “Suggest.”
  - Modal preview for AI output with “Accept” or “Reject.”
- **Progress Tracking**:
  - Word count per chapter and project, displayed in UI.
  - Autosave to Supabase every 10 seconds using real-time API.
- **Version History**:
  - Store last 5 versions in Supabase `drafts` table.
  - Restore previous version via “History” modal.

### 1.4 AI Text Generation
- **Generation Types**:
  - Continue: Extend selected text (e.g., next paragraph).
  - Rewrite: Rephrase with user-specified tone.
  - Suggest: Generate plot or dialogue ideas.
- **Controls**:
  - Slider for length: short (50-100 words), medium (100-300 words), long (300-500 words).
  - Optional prompt field for custom instructions.
- **Feedback**:
  - “Regenerate” button for same parameters.
  - Tone dropdown (e.g., “suspenseful,” “humorous”).

### 1.5 PDF Export
- **Formatting**:
  - Standard manuscript: 12pt Times New Roman, double-spaced, 1-inch margins.
  - Title page (project title, author name) and chapter headings.
- **Process**:
  - “Export PDF” button triggers Netlify Function with pdfkit.
  - Preview first page in modal before download.
- **Download**:
  - File named “ProjectName_Manuscript.pdf”.

### 1.6 User Accounts
- **Authentication**:
  - Supabase Auth with email/password and OAuth (Google, GitHub).
  - Password reset via Supabase email templates.
- **Profile**:
  - Settings: display name, email, API key management.
  - Delete account option, removing Supabase data.

### 1.7 Project Management
- **Single Project**:
  - Create one project with name and description, stored in Supabase `projects` table.
  - Dashboard showing chapters, word count, export option.
- **Data Storage**:
  - Link project data to user ID in Supabase.

### 1.8 UI/UX
- **Design**:
  - Tailwind CSS for minimal, responsive UI.
  - Light mode only, optimized for desktop/tablet.
- **Navigation**:
  - Top bar: project name, profile, logout.
  - Sidebar: chapters, context manager, export.
- **Onboarding**:
  - 3-step tour: API key setup, project creation, first chapter.
  - Tooltips for key actions.

### 1.9 Non-Functional
- **Performance**: Netlify CDN loads < 2s, Supabase queries < 500ms.
- **Security**: Encrypt API keys; Supabase row-level security; HTTPS.
- **Accessibility**: Basic WCAG 2.1 (keyboard nav, alt text).
- **Browser Support**: Chrome, Firefox, Safari, Edge.

---

## 2. Full Product Release Feature List

The Full Release enhances the MVP with advanced AI, collaboration, analytics, and desktop app support, leveraging Netlify and Supabase capabilities.

### 2.1 LLM Integration (Enhanced)
- **Providers**:
  - Support 5+ providers, including open-source models via hosted APIs.
  - Pre-configured templates for quick setup.
- **Configuration**:
  - Fine-tune parameters (top-p, frequency penalty).
  - Batch generation for multiple outputs via Netlify Functions.
- **Monitoring**:
  - Track token usage per session, stored in Supabase.
  - Warn users of rate limits in UI.

### 2.2 Story Context Management (Enhanced)
- **Database**:
  - Advanced Supabase schema for relationships (e.g., character alliances).
  - Real-time subscriptions for context updates.
- **AI-Driven Context**:
  - Improved NLP (Netlify Functions) for nuanced extraction (e.g., motivations).
  - Suggest context updates based on story (e.g., “Add trait: angry”).
- **Export/Import**:
  - Export context as JSON from Supabase.
  - Import to new projects via file upload.

### 2.3 Writing Interface (Enhanced)
- **Editor**:
  - Full formatting: tables, block quotes, inline images (notes).
  - Spellcheck via browser or third-party SDK.
- **Sub-Pages**:
  - Pages within chapters (e.g., scenes), stored in Supabase.
  - Nested sidebar navigation.
- **Version Control**:
  - Full history with diffs, stored in Supabase.
  - Merge or restore any version.
- **Offline Mode**:
  - Local storage for drafts, sync with Supabase (desktop app).

### 2.4 AI Text Generation (Enhanced)
- **Types**:
  - Plot Hole Filler: Fix inconsistencies.
  - Dialogue Generator: Multi-character conversations.
  - World-Building: Setting/lore descriptions.
- **Prompt Library**:
  - Pre-built prompts (e.g., “Introduce villain”).
  - Save custom prompts in Supabase.
- **Feedback**:
  - Reject with reason to refine output.
  - Train AI on user style preferences.

### 2.5 PDF Export (Enhanced)
- **Formatting**:
  - Custom fonts, margins, page sizes (A4, 6x9).
  - Genre-specific templates (novel, screenplay).
- **Features**:
  - Auto-generate table of contents.
  - Front/back matter (dedication, acknowledgments).
  - Embed PDF metadata.
- **Options**:
  - Export to ePub, Word via Netlify Functions.
  - Save to Google Drive/Dropbox.

### 2.6 User Accounts (Enhanced)
- **Team Accounts**:
  - Multiple users per account, stored in Supabase.
  - Roles: admin, editor, viewer.
- **Customization**:
  - Editor preferences (font size, autosave).
  - Save UI theme in Supabase.
- **Security**:
  - 2FA via Supabase Auth.
  - Audit log in Supabase `logs` table.

### 2.7 Project Management (Enhanced)
- **Multiple Projects**:
  - Unlimited projects in Supabase.
  - Dashboard with thumbnails, progress bars.
- **Collaboration**:
  - Share projects with permissions.
  - Real-time editing via Supabase subscriptions.
  - Commenting on text sections.
- **Archiving**:
  - Archive/restore projects in Supabase.

### 2.8 Analytics
- **Insights**:
  - Word count trends, writing time, AI usage (Supabase storage).
  - Character/event frequency, sentiment analysis.
- **Reports**:
  - Export as CSV/PDF via Netlify Functions.
  - Charts (e.g., words over time).

### 2.9 UI/UX (Enhanced)
- **Themes**:
  - Light, dark, sepia, high-contrast.
  - Custom color picker, saved in Supabase.
- **Mobile**:
  - Fully responsive for mobile browsers.
  - Touch-friendly editor.
- **Accessibility**:
  - WCAG 2.1 AA (screen readers, shortcuts).
- **Help Center**:
  - In-app docs, video tutorials.

### 2.10 Desktop App
- **Platform**:
  - Electron for Windows, macOS, Linux.
  - Reuse React codebase, hosted locally.
- **Offline Mode**:
  - Store drafts/context in IndexedDB, sync with Supabase.
- **Native**:
  - System tray, file picker for exports.
  - Cache LLM responses locally.

### 2.11 Non-Functional (Enhanced)
- **Performance**: Netlify loads < 1.5s, Supabase < 300ms.
- **Scalability**: 50,000 users via Netlify auto-scaling, Supabase paid tier.
- **Security**: Penetration testing, GDPR/CCPA, SOC 2.
- **Reliability**: 99.9% uptime, Supabase backups.
- **Localization**: English, Spanish, French UI.

---

## 3. Feature Comparison Table

| **Category**                 | **MVP**                                                                 | **Full Release**                                                                 |
|------------------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| **LLM Integration**          | 2 providers, basic config, Netlify Functions                           | 5+ providers, advanced config, token tracking                                   |
| **Story Context**            | Supabase tables, basic extraction, injection                          | Advanced schema, AI-driven extraction, real-time, export/import                |
| **Writing Interface**        | Rich text, chapters, inline AI, basic history                          | Full formatting, sub-pages, spellcheck, full history, offline                  |
| **AI Generation**            | Continue, rewrite, suggest; basic controls                             | Plot filler, dialogue, world-building; prompt library, advanced feedback       |
| **PDF Export**               | Standard format, Netlify Functions                                     | Custom formats, table of contents, ePub/Word, cloud integration                |
| **User Accounts**            | Supabase Auth, email/OAuth, basic profile                             | Team accounts, 2FA, customization, audit log                                   |
| **Project Management**       | Single project, Supabase storage                                      | Multiple projects, real-time collaboration, archiving                          |
| **Analytics**                | None                                                                  | Insights, story analysis, exportable charts                                    |
| **UI/UX**                    | Light mode, desktop/tablet, basic accessibility                       | Themes, mobile, full accessibility, help center                                |
| **Desktop App**              | None                                                                  | Electron, offline mode, native features                                        |
| **Non-Functional**           | Basic performance, security, accessibility                            | Enhanced scalability, reliability, localization, advanced security             |

---

## 4. Notes
- **Netlify**: Simplifies deployment with CDN and serverless functions but requires optimization for LLM calls (e.g., chunking large requests) due to 10s timeout.
- **Supabase**: PostgreSQL and real-time features suit MVP and scale well; paid tier needed for Full Release to handle storage and compute.
- **MVP Focus**: Core writing and AI features to validate user adoption.
- **Full Release**: Professional tool with collaboration and cross-platform support.
- **Future**: Explore Supabase Edge Functions for complex backend logic, mobile app post-desktop.