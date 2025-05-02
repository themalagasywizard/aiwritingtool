# AIStoryCraft: Context Editor Technical Requirements

This document details the technical requirements for implementing the **Context Editor** feature in AIStoryCraft, a web-based writing app. The Context Editor enables users to define and manage story context elements (protagonists, settings, timeline, and other details) that the AI considers during text generation and editing. The implementation leverages **React** with **Tailwind CSS** for the frontend, **Supabase** for the backend, **Netlify Functions** for serverless processing, and integrates with user-selected **LLMs** (e.g., OpenAI, Anthropic) via APIs.

---

## 1. Feature Overview

The Context Editor allows users to:
- Create, edit, and delete context elements categorized as:
  - **Protagonists**: Characters with attributes (name, role, traits, backstory).
  - **Settings**: Locations or environments (name, description, key features).
  - **Timeline**: Story events or milestones (description, date/time, significance).
  - **Other Details**: Miscellaneous elements (e.g., themes, objects, factions).
- View a list of context elements in the UI.
- Ensure AI-generated text aligns with defined context by injecting relevant elements into LLM prompts.
- Support basic automatic extraction of context from user-written or AI-generated text for user confirmation.

The feature is critical for maintaining narrative coherence, especially for long-form writing, by providing the AI with a persistent knowledge base.

---

## 2. Technical Requirements: AI Integration

The AI integration ensures that context elements are effectively incorporated into LLM prompts to produce coherent and contextually relevant text.

### 2.1 Prompt Engineering
- **Context Injection**:
  - Construct LLM prompts by appending relevant context elements from Supabase.
  - Structure: `[Instruction] + [Selected Text (if any)] + [Context Summary] + [User Prompt (if provided)]`.
  - Example:
    ```
    Instruction: Continue the story in a suspenseful tone.
    Selected Text: "The forest was silent except for a distant rustle."
    Context Summary: Protagonist: Jane (brave, curious), Setting: Darkwood Forest (eerie, dense), Timeline: Night of the full moon.
    User Prompt: Introduce a mysterious figure.
    ```
- **Context Selection**:
  - Automatically select relevant context based on:
    - Current chapter or selected text (e.g., characters mentioned).
    - User-specified elements (e.g., via checkboxes in UI).
  - Limit context to avoid token overflow (e.g., 2,000 tokens max, prioritizing recent or critical elements).
- **Prompt Optimization**:
  - Summarize context to fit token limits (e.g., “Jane: brave, curious” instead of full backstory).
  - Use structured JSON for context in prompts to improve LLM parsing (if supported by provider).

### 2.2 LLM API Integration
- **Supported Providers**:
  - OpenAI (GPT models), Anthropic (Claude), via user-provided API keys stored in Supabase.
- **API Call Structure**:
  - Use Netlify Functions to make HTTP POST requests to LLM APIs.
  - Parameters:
    - `prompt`: Constructed as above.
    - `max_tokens`: Configurable (default: 500 for generation, 200 for suggestions).
    - `temperature`: User-adjustable (default: 0.7 for balanced creativity).
    - `top_p`: Default 1.0 (configurable in Full Release).
  - Response handling: Parse JSON response, extract generated text, and display in UI.
- **Error Handling**:
  - Handle API errors (e.g., rate limits, invalid keys) with user-friendly messages.
  - Cache recent prompts/responses in Supabase to retry failed calls or reduce API costs.

### 2.3 Context Extraction
- **Basic NLP**:
  - Implement lightweight NLP in Netlify Functions to detect potential context elements in text.
  - Example: Identify proper nouns (e.g., “Jane”) as potential characters, or locations (e.g., “Darkwood Forest”) as settings.
  - Use regex or simple libraries (e.g., `compromise` NLP) to avoid heavy dependencies.
- **User Confirmation**:
  - Present extracted elements in UI (e.g., “Add ‘Jane’ as a character?”).
  - Save confirmed elements to Supabase.
- **Limitations**:
  - MVP focuses on basic extraction (names, locations); advanced NLP (e.g., sentiment, relationships) deferred to Full Release.

### 2.4 Performance
- **Token Efficiency**: Ensure context injection stays within LLM token limits (e.g., 4,000 for GPT-4, 8,000 for Claude).
- **Latency**: API calls via Netlify Functions should complete in < 5 seconds (optimize by caching context summaries).
- **Cost Management**: Log token usage in Supabase to warn users of high API consumption.

---

## 3. Frontend Requirements

The frontend, built with **React** and **Tailwind CSS**, provides an intuitive interface for managing context and integrating it with the editor.

### 3.1 UI Components
The Context Editor reuses and extends components from the MVP design guidelines, with new components specific to context management.

1. **ContextManagerButton**
   - **Description**: Sidebar button to open context editor.
   - **Props**: `onClick` (opens modal).
   - **Styles**: `bg-primary (#4B5EAA)`, `text-white`, `w-full`, `py-2`, `rounded-md`.
   - **Accessibility**: ARIA label (“Open context manager”), keyboard focusable.

2. **ContextEditorModal**
   - **Description**: Modal for adding/editing context elements.
   - **Props**:
     - `isOpen`: Boolean to show/hide modal.
     - `onClose`: Closes modal.
     - `onSave`: Saves element to Supabase.
     - `element`: Optional existing element for editing.
   - **Elements**:
     - Tabs: Protagonists, Settings, Timeline, Other (Tailwind `border-b`, `text-primary`).
     - Form fields (per category, see below).
     - Buttons: Save (`bg-success`), Cancel (`bg-secondary`), Delete (if editing, `bg-error`).
   - **Styles**: `max-w-[600px]`, `bg-background (#F9FAFB)`, `p-6`, `shadow-md`, `rounded-md`.
   - **Interactions**:
     - Tab switching updates form fields.
     - Save validates fields, submits to Supabase.
     - Delete confirms via prompt.
   - **Accessibility**: ARIA labels for tabs, fields; keyboard navigation (Tab, Enter, Esc).

3. **ContextForm**
   - **Description**: Dynamic form for context categories.
   - **Props**: `category` (Protagonist, Setting, Timeline, Other), `data` (prefilled for edits).
   - **Fields**:
     - **Protagonist**:
       - Name (text, required, `text-subtext`).
       - Role (dropdown: Protagonist, Antagonist, Supporting, `border-secondary`).
       - Traits (textarea, optional, `h-20`).
       - Backstory (textarea, optional, `h-20`).
     - **Setting**:
       - Name (text, required).
       - Description (textarea, required, `h-20`).
       - Key Features (textarea, optional, e.g., “haunted, foggy”).
     - **Timeline**:
       - Event Name (text, required).
       - Date/Time (text, optional, e.g., “Full moon, 2025”).
       - Description (textarea, required).
       - Significance (textarea, optional, e.g., “Turning point”).
     - **Other**:
       - Name (text, required).
       - Type (text, optional, e.g., “Theme: Betrayal”).
       - Description (textarea, required).
   - **Styles**: `w-full`, `p-2`, `border-secondary`, `rounded-md`.
   - **Interactions**: Validates required fields, disables Save if invalid.

4. **ContextList**
   - **Description**: Sidebar list of context elements.
   - **Props**: `elements` (array from Supabase), `onSelect` (opens edit modal).
   - **Elements**: List items (`text-subtext`, `hover:bg-primaryLight (#E6E9F0)`), grouped by category.
   - **Styles**: `p-2`, `border-b`, `border-secondary`.
   - **Interactions**: Click to edit, drag-and-drop for reordering (optional in MVP).

5. **ContextSuggestionModal**
   - **Description**: Displays extracted context for user confirmation.
   - **Props**: `suggestions` (array from NLP), `onConfirm`, `onReject`.
   - **Elements**:
     - List of suggestions (e.g., “Jane - Character”, `text-subtext`).
     - Checkboxes to select items.
     - Confirm (`bg-success`), Reject (`bg-error`) buttons.
   - **Styles**: `max-w-[400px]`, `bg-background`, `p-4`, `shadow-md`.
   - **Interactions**: Confirm saves to Supabase, Reject closes modal.

### 3.2 State Management
- **React Hooks**:
  - `useState` for modal visibility, form data, and selected category.
  - `useEffect` to fetch context elements from Supabase on mount.
- **Supabase Client**:
  - Use `@supabase/supabase-js` to query `context_elements` table.
  - Real-time subscription for context updates (e.g., new element added).
- **Context Caching**:
  - Store fetched context in local storage (`localStorage`) to reduce Supabase queries.
  - Sync with Supabase on save or delete.

### 3.3 Accessibility
- **WCAG 2.1 Level A**:
  - ARIA labels for tabs, inputs, buttons (e.g., `aria-label="Add protagonist"`).
  - Keyboard navigation: Tab through fields, Enter to submit, Esc to close modals.
  - Contrast: `#1F2937` on `#F9FAFB` for text (12.5:1 ratio).
- **Screen Readers**: Ensure form fields and list items are announced correctly.
- **Focus Management**: Trap focus in modals, return to trigger element on close.

### 3.4 Performance
- **Lazy Loading**: Load `ContextEditorModal` and `ContextSuggestionModal` dynamically with React `lazy`.
- **Debouncing**: Debounce form input changes (300ms) to reduce Supabase writes.
- **Pagination**: For large context lists (>50 elements), paginate results from Supabase.

---

## 4. Backend Requirements

The backend, powered by **Supabase** and **Netlify Functions**, stores and processes context elements, integrating with the AI for prompt construction.

### 4.1 Supabase Database
- **Table: `context_elements`**:
  - Schema:
    ```sql
    CREATE TABLE context_elements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id),
      project_id UUID REFERENCES projects(id),
      category VARCHAR(20) NOT NULL, -- 'Protagonist', 'Setting', 'Timeline', 'Other'
      data JSONB NOT NULL, -- Stores category-specific fields
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```
  - **Data Examples**:
    - Protagonist: `{"name": "Jane", "role": "Protagonist", "traits": "brave, curious", "backstory": "Orphaned explorer"}`
    - Setting: `{"name": "Darkwood Forest", "description": "Eerie, dense woods", "features": "haunted, foggy"}`
    - Timeline: `{"name": "Full Moon Encounter", "date": "2025-05-01", "description": "Jane meets figure", "significance": "Turning point"}`
    - Other: `{"name": "Betrayal", "type": "Theme", "description": "Central to plot"}`
  - **Indexes**:
    - `CREATE INDEX idx_context_user_project ON context_elements(user_id, project_id);`
    - `CREATE INDEX idx_context_category ON context_elements(category);`
  - **Row-Level Security (RLS)**:
    ```sql
    ALTER TABLE context_elements ENABLE ROW LEVEL SECURITY;
    CREATE POLICY user_access ON context_elements
      FOR ALL TO authenticated
      USING (user_id = auth.uid());
    ```

- **Table: `projects`** (for reference):
  - Ensure `project_id` links context to specific projects.
  - Existing schema includes `id`, `user_id`, `name`, `description`.

### 4.2 Supabase API
- **CRUD Operations**:
  - **Create**: `supabase.from('context_elements').insert([{ user_id, project_id, category, data }])`.
  - **Read**: `supabase.from('context_elements').select('*').eq('project_id', projectId).order('created_at', { ascending: true })`.
  - **Update**: `supabase.from('context_elements').update({ data, updated_at: now() }).eq('id', elementId)`.
  - **Delete**: `supabase.from('context_elements').delete().eq('id', elementId)`.
- **Real-Time**:
  - Subscribe to `context_elements` changes for live updates in `ContextList`.
  - Example: `supabase.channel('context_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'context_elements' }, handleUpdate).subscribe()`.
- **Authentication**:
  - Use Supabase Auth to ensure only authenticated users access their context.
  - Validate `user_id` matches `auth.uid()` in RLS.

### 4.3 Netlify Functions
- **Function: `extract-context`**:
  - **Purpose**: Analyze text for potential context elements.
  - **Input**: `{ text: string, project_id: string }`.
.Concurrent users: 10,000 for MVP, 50,000 for Full Release.
  - **Logic**:
    - Use `compromise` NLP library to extract proper nouns, places, dates.
    - Return array of suggestions: `[{ type: 'Protagonist', value: 'Jane' }, { type: 'Setting', value: 'Darkwood Forest' }]`.
  - **Output**: JSON response with suggestions.
  - **File**: `functions/extract-context.js`.
  - **Limits**: Optimize for Netlify’s 10s timeout; handle 1,000-word input max.

- **Function: `generate-text`**:
  - **Purpose**: Call LLM with context-injected prompt.
  - **Input**: `{ prompt: string, selectedText: string, contextIds: string[], project_id: string, parameters: { max_tokens, temperature } }`.
  - **Logic**:
    - Fetch context elements from Supabase using `contextIds`.
    - Construct prompt with instruction, selected text, context, and user prompt.
    - Call LLM API (e.g., OpenAI `/completions` or Anthropic `/messages`).
    - Cache response in Supabase `cache` table (optional for MVP).
  - **Output**: JSON with generated text or error message.
  - **File**: `functions/generate-text.js`.
  - **Limits**: Handle 2,000-token context; retry on rate limit errors.

### 4.4 Backend Security
- **API Key Storage**: Encrypt LLM API keys in Supabase `users` table using `pgcrypto`.
  - Example: `UPDATE users SET api_key = pgp_sym_encrypt(:key, :secret) WHERE id = :userId`.
- **Rate Limiting**: Use Netlify’s built-in limits or Supabase Edge Functions (future) to cap API calls.
- **Data Validation**:
  - Validate `data` JSON in `context_elements` (e.g., required fields like `name`).
  - Sanitize inputs in Netlify Functions to prevent injection.

### 4.5 Performance
- **Supabase**:
  - Query latency: < 500ms for context fetches.
  - Optimize with indexes and pagination for large projects (>100 elements).
- **Netlify Functions**:
  - Execution time: < 5s for LLM calls, < 2s for extraction.
  - Cache context summaries in Supabase to reduce redundant fetches.
- **Scalability**: Supabase free tier (500MB) sufficient for MVP; upgrade to paid tier for Full Release.

---

## 5. Data Flow

1. **User Adds Context**:
   - User clicks `ContextManagerButton`, opens `ContextEditorModal`.
   - Selects category, fills form, submits to Supabase via `insert`.
   - `ContextList` updates via real-time subscription.

2. **Text Analysis**:
   - User writes text in editor; Netlify Function `extract-context` analyzes it.
   - Suggestions displayed in `ContextSuggestionModal`.
   - Confirmed elements saved to Supabase.

3. **AI Generation**:
   - User selects text, triggers AI action (e.g., “Continue”).
   - Frontend fetches relevant context from Supabase (e.g., by `project_id`).
   - Netlify Function `generate-text` constructs prompt, calls LLM, returns text.
   - Text displayed in `AIPreviewModal` for acceptance.

4. **Context Update**:
   - User edits/deletes context in `ContextEditorModal`.
   - Supabase updates `context_elements`, notifies frontend via subscription.

---

## 6. Development Notes
- **Dependencies**:
  - Frontend: `@supabase/supabase-js`, `react`, `tailwindcss`, `quill` (editor).
  - Backend: `node-fetch` (Netlify Functions), `compromise` (NLP), `pgcrypto` (Supabase).
- **Testing**:
  - Unit tests for components (`Jest`, `React Testing Library`).
  - Integration tests for Supabase CRUD and Netlify Functions (`Cypress`).
  - Test edge cases: Empty context, large text inputs, API failures.
- **Deployment**:
  - Netlify: Deploy functions in `functions/` folder, test with `netlify dev`.
  - Supabase: Apply schema migrations via Supabase CLI or dashboard.
- **Monitoring**:
  - Log Netlify Function errors to Netlify dashboard.
  - Track Supabase query performance in dashboard analytics.

---

## 7. Risks and Mitigations
- **Risk**: Netlify Function timeout (10s) for LLM calls with large context.
  - **Mitigation**: Summarize context, use async processing, or offload to Supabase Edge Functions (future).
- **Risk**: Supabase storage limits (500MB free tier).
  - **Mitigation**: Optimize JSON data, monitor usage, upgrade to paid tier if needed.
- **Risk**: Inaccurate context extraction.
  - **Mitigation**: Rely on user confirmation, improve NLP in Full Release.
- **Risk**: Token overflow in LLM prompts.
  - **Mitigation**: Cap context at 2,000 tokens, prioritize critical elements.

---

## 8. Future Enhancements (Post-MVP)
- **Advanced NLP**: Use more robust libraries (e.g., spaCy via serverless) for context extraction.
- **Context Relationships**: Store relationships (e.g., “Jane allies with Bob”) in Supabase.
- **Timeline Visualization**: Gantt-style UI for timeline events.
- **Context Export/Import**: JSON export/import for sharing or backups.
- **Real-Time Collaboration**: Use Supabase subscriptions for multi-user context editing.