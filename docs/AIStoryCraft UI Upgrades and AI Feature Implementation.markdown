# AIStoryCraft: UI Upgrades and AI Feature Implementation

This document analyzes the current state of the AIStoryCraft MVP frontend UI, suggests improvements, and provides a detailed plan for integrating AI features (Generate, Edit, Chat) with a toggleable mode-switching interface. The recommendations enhance usability, aesthetics, and functionality while aligning with the existing design and tech stack.

---

## 1. Overview of Current MVP UI

The current UI, as seen in `index.html`, is a well-structured prototype with a clean, writer-focused design. Key elements include:

### Strengths
- **Consistent Design Language**:
  - Uses Tailwind CSS with a custom palette (Slate Blue `#4B5EAA`, Coral `#F472B6`) and typography (Inter for UI, Merriweather for editor content).
  - Adheres to accessibility with high-contrast text (`#1F2937` on `#F9FAFB`) and ARIA labels (e.g., buttons).
- **Intuitive Layout**:
  - Sidebar (250px) for chapters, context, and actions; main editor area for writing.
  - Top bar with branding, save status, and user profile dropdown.
- **Interactive Features**:
  - Context Manager with a character network visualization (nodes, tooltips, relationships).
  - Modals for AI suggestions and context management with smooth transitions.
  - Drag-and-drop chapter reordering (via icons).
- **Responsive Design**:
  - Tailwind’s responsive classes (`md:grid-cols-2`) ensure adaptability, though mobile support is limited (as per MVP scope).
- **Performance**:
  - Lightweight with Google Fonts and Font Awesome CDNs.
  - Tailwind CSS configuration minimizes CSS bloat.

### Areas for Improvement
1. **Mobile Responsiveness**:
   - The sidebar and editor layout aren’t optimized for mobile (<768px). The sidebar should collapse into a hamburger menu, and the editor should take full width.
2. **Accessibility Gaps**:
   - Missing ARIA roles for modals (`role="dialog"`) and tabs (`role="tablist"`).
   - Keyboard navigation for the character network is limited (e.g., no focusable nodes).
   - Screen reader support for dynamic content (e.g., character relationships) needs enhancement.
3. **Interactivity**:
   - The character network is static (hardcoded positions). Dynamic positioning based on relationships (e.g., force-directed graph) would improve usability.
   - Lack of real-time feedback for form validation or AI interactions.
4. **Performance**:
   - Inline JavaScript in `<script>` is not modularized, making maintenance harder.
   - No lazy-loading for modals or heavy components like the character tree.
5. **Visual Polish**:
   - The character network could use animations for node additions/removals.
   - Modals lack subtle entrance animations (beyond `fade-in`).
   - Buttons could benefit from micro-interactions (e.g., scale on click).

---

## 2. Potential Upgrades and Improvements

To enhance the UI before backend integration, consider the following upgrades:

### 2.1 Mobile Responsiveness
- **Collapsible Sidebar**:
  - Add a hamburger menu (`<i class="fas fa-bars">`) in the top bar for mobile.
  - Hide the sidebar by default on mobile, sliding it in when toggled (Tailwind: `translate-x-[-250px]` to `translate-x-0`).
- **Editor Full-Width**:
  - Use `w-full` on `<main>` for mobile, with `max-w-3xl` only on desktop (`md:max-w-3xl`).
- **Implementation**:
  ```html
  <button class="md:hidden p-2" id="toggleSidebar">
      <i class="fas fa-bars text-primary"></i>
  </button>
  <aside class="sidebar fixed top-16 left-0 h-[calc(100vh-4rem)] transform translate-x-[-250px] md:translate-x-0 transition-transform duration-300" id="sidebar">
      <!-- Sidebar content -->
  </aside>
  ```
  ```javascript
  document.getElementById('toggleSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('translate-x-[-250px]');
  });
  ```

### 2.2 Accessibility Enhancements
- **Modal ARIA Roles**:
  - Add `role="dialog" aria-labelledby="modal-title"` to `#aiModal` and `#contextModal`.
  - Trap focus within modals (JavaScript to prevent Tab outside modal).
- **Tab Navigation**:
  - Add `role="tablist"` to the context tab container, `role="tab"` to buttons, and `aria-selected="true"` for the active tab.
- **Character Network**:
  - Make nodes focusable (`tabindex="0"`) and add `aria-label` (e.g., “John Doe, Protagonist, click to edit”).
  - Announce relationship changes to screen readers using `aria-live="polite"`.
- **Implementation**:
  ```html
  <div class="flex space-x-2" role="tablist">
      <button role="tab" aria-selected="true" class="px-4 py-2 border-b-2 border-primary text-primary font-medium context-tab" data-tab="protagonists">Characters</button>
  </div>
  <div class="fixed inset-0" role="dialog" aria-labelledby="contextModalTitle" id="contextModal">
      <h2 id="contextModalTitle" class="text-xl font-bold text-primary">Manage Story Context</h2>
  </div>
  ```

### 2.3 Interactivity Improvements
- **Dynamic Character Network**:
  - Use a library like **D3.js** or **vis-network** for force-directed graph layout, positioning nodes based on relationships.
  - Example: Protagonist at center, antagonists/supporters radiating outward.
- **Real-Time Form Validation**:
  - Add `onInput` handlers to form fields (e.g., `#protagonistName`) to show error messages instantly (e.g., “Name is required”).
  ```javascript
  document.getElementById('protagonistName').addEventListener('input', (e) => {
      const error = e.target.value ? '' : 'Name is required';
      e.target.nextElementSibling?.remove();
      if (error) {
          e.target.insertAdjacentHTML('afterend', `<span class="text-error text-xs">${error}</span>`);
      }
  });
  ```
- **Undo/Redo for Context**:
  - Store context changes in a stack (local storage or state) to allow undoing deletions or edits.

### 2.4 Performance Optimizations
- **Modular JavaScript**:
  - Move inline `<script>` to a separate `app.js` file, using modules for maintainability.
  - Example structure:
    ```
    src/
    ├── js/
    │   ├── components/
    │   │   ├── ContextModal.js
    │   │   ├── CharacterTree.js
    │   ├── app.js
    ```
- **Lazy-Loading Modals**:
  - Load modal content dynamically (e.g., using `IntersectionObserver`) to reduce initial page load.
- **CSS Purging**:
  - Configure Tailwind’s `purge` option in `tailwind.config.js` to remove unused styles:
    ```javascript
    module.exports = {
        purge: ['./src/**/*.{html,js}'],
        theme: { /* existing config */ }
    };
    ```

### 2.5 Visual Polish
- **Animations**:
  - Add scale transitions to buttons (`transform: scale(1.05)` on click).
  - Use Framer Motion for modal entrances (e.g., slide-in from bottom).
  ```html
  <div class="modal" x-data="{ open: false }" x-show="open" x-transition:enter="transform ease-out duration-300"
       x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
  ```
- **Character Node Animations**:
  - Animate node additions (e.g., fade-in, scale-up) using CSS keyframes:
    ```css
    .character-node.new {
        animation: nodeEnter 0.5s ease;
    }
    @keyframes nodeEnter {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
    }
    ```
- **Consistent Micro-Interactions**:
  - Add hover effects to all interactive elements (e.g., `hover:shadow-md` for cards).

---

## 3. Implementing AI Features (Generate, Edit, Chat)

To integrate the AI features (Generate, Edit, Chat) into the UI, we’ll enhance the existing toolbar and introduce a toggleable button to switch between modes. The design will be user-friendly, sleek, and consistent with your aesthetic. The AI will leverage the Hugging Face Inference API (e.g., DistilGPT-2 for free tier, GPT-Neo for subscribers) and user-provided context from Supabase.

### 3.1 AI Feature Requirements
- **Generate**: Create new text from a user prompt and context (e.g., “Write a scene with Jane in Darkwood Forest”).
- **Edit**: Modify selected text based on a prompt (e.g., “Make this paragraph more suspenseful”).
- **Chat**: Brainstorm with the AI via a conversational interface (e.g., “Suggest plot twists for my story”).
- **Mode Toggle**: A sleek button in the toolbar to switch between Generate, Edit, and Chat modes.

### 3.2 UI Integration Plan

#### 3.2.1 Toolbar Enhancements
Replace the current AI buttons (`Continue with AI`, `Rewrite`, `Suggest`) with a single **AI Control Panel** that includes a mode toggle and dynamic input based on the selected mode.

**Updated Toolbar Structure**:
```html
<div class="bg-white border-b border-gray-100 p-2 flex items-center space-x-2 shadow-sm-custom">
    <!-- Formatting Buttons -->
    <div class="flex items-center space-x-1 mr-2">
        <button class="toolbar-btn" title="Bold"><i class="fas fa-bold"></i></button>
        <button class="toolbar-btn" title="Italic"><i class="fas fa-italic"></i></button>
        <button class="toolbar-btn" title="Heading"><i class="fas fa-heading"></i></button>
        <button class="toolbar-btn" title="List"><i class="fas fa-list-ul"></i></button>
    </div>
    <div class="h-6 w-px bg-gray-200 mx-2"></div>
    <!-- AI Control Panel -->
    <div class="flex items-center space-x-2 bg-primaryLight p-2 rounded-lg">
        <!-- Mode Toggle -->
        <div class="relative inline-flex bg-white rounded-md shadow-sm">
            <button class="ai-mode-btn px-3 py-1 text-sm font-medium text-primary bg-white rounded-l-md" data-mode="generate">Generate</button>
            <button class="ai-mode-btn px-3 py-1 text-sm font-medium text-secondary" data-mode="edit">Edit</button>
            <button class="ai-mode-btn px-3 py-1 text-sm font-medium text-secondary rounded-r-md" data-mode="chat">Chat</button>
        </div>
        <!-- Dynamic Input -->
        <div class="flex-1 relative">
            <input type="text" id="aiInput" class="w-full border border-gray-200 rounded-lg p-2 pr-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter your prompt...">
            <button id="aiSubmit" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
    <div class="flex-grow"></div>
    <button class="toolbar-btn" title="Full Screen"><i class="fas fa-expand"></i></button>
</div>
```

**CSS for Mode Toggle**:
```css
.ai-mode-btn {
    transition: all 0.2s ease;
}
.ai-mode-btn.active {
    background-color: var(--primary);
    color: white;
}
.ai-mode-btn:not(.active):hover {
    background-color: var(--primaryLight);
}
```

**JavaScript for Mode Toggle**:
```javascript
const modeButtons = document.querySelectorAll('.ai-mode-btn');
let currentMode = 'generate';

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => {
            b.classList.remove('active');
            b.classList.add('text-secondary');
            b.classList.remove('text-primary', 'bg-white');
        });
        btn.classList.add('active', 'text-white');
        currentMode = btn.dataset.mode;
        updateAIInputPlaceholder();
    });
});

function updateAIInputPlaceholder() {
    const aiInput = document.getElementById('aiInput');
    const placeholders = {
        generate: 'e.g., Write a scene with Jane in Darkwood Forest',
        edit: 'e.g., Make this paragraph more suspenseful',
        chat: 'e.g., Suggest plot twists for my story'
    };
    aiInput.placeholder = placeholders[currentMode];
}
```

#### 3.2.2 AI Modal Enhancements
Reuse the existing `#aiModal` for all AI interactions, adapting its content based on the mode. Add a chat-specific view for conversational interactions.

**Updated AI Modal Structure**:
```html
<div class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center modal" id="aiModal" role="dialog" aria-labelledby="aiModalTitle">
    <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-md-custom fade-in">
        <div class="flex items-center justify-between mb-4">
            <h2 id="aiModalTitle" class="text-xl font-bold text-primary"></h2>
            <button class="text-gray-400 hover:text-gray-600" id="closeModal">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        <!-- Dynamic Content -->
        <div id="aiModalContent">
            <!-- Generate/Edit View -->
            <div id="generateEditView" class="hidden">
                <div class="bg-gray-50 p-5 rounded-lg mb-5 border border-gray-100">
                    <p id="aiOutput" class="text-gray-700 leading-relaxed"></p>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div>
                        <label class="text-sm font-medium block mb-2">Tone</label>
                        <select id="aiTone" class="w-full border border-gray-200 rounded-lg p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                            <option>Suspenseful</option>
                            <option>Humorous</option>
                            <option>Dramatic</option>
                            <option>Reflective</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-sm font-medium block mb-2">Length</label>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-gray-500">Short</span>
                            <input type="range" min="50" max="500" value="200" id="aiLength" class="flex-grow">
                            <span class="text-xs text-gray-500">Long</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Chat View -->
            <div id="chatView" class="hidden">
                <div class="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100 max-h-64 overflow-y-auto" id="chatHistory">
                    <!-- Chat messages will be appended here -->
                </div>
                <div class="flex items-center space-x-2">
                    <input type="text" id="chatInput" class="flex-1 border border-gray-200 rounded-lg p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Ask the AI...">
                    <button id="chatSubmit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="flex justify-end space-x-3" id="aiModalActions">
            <button class="btn btn-primary hidden" id="regenerateBtn">
                <i class="fas fa-sync-alt"></i>
                Regenerate
            </button>
            <button class="btn btn-error" id="rejectBtn">
                <i class="fas fa-times"></i>
                Reject
            </button>
            <button class="btn btn-success hidden" id="acceptBtn">
                <i class="fas fa-check"></i>
                Accept
            </button>
        </div>
    </div>
</div>
```

**JavaScript for Modal Content**:
```javascript
function showAIModal(mode, output = '', selectedText = '') {
    const modal = document.getElementById('aiModal');
    const title = document.getElementById('aiModalTitle');
    const generateEditView = document.getElementById('generateEditView');
    const chatView = document.getElementById('chatView');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const acceptBtn = document.getElementById('acceptBtn');

    title.textContent = {
        generate: 'AI Generated Text',
        edit: 'AI Edited Text',
        chat: 'AI Chat'
    }[mode];

    if (mode === 'chat') {
        chatView.classList.remove('hidden');
        generateEditView.classList.add('hidden');
        regenerateBtn.classList.add('hidden');
        acceptBtn.classList.add('hidden');
    } else {
        generateEditView.classList.remove('hidden');
        chatView.classList.add('hidden');
        document.getElementById('aiOutput').textContent = output || 'Generating...';
        regenerateBtn.classList.remove('hidden');
        acceptBtn.classList.remove('hidden');
    }

    modal.style.display = 'flex';
}
```

#### 3.2.3 AI Feature Workflows

1. **Generate Mode**:
   - **Trigger**: User enters a prompt in `#aiInput` (e.g., “Write a scene with Jane”) and clicks `#aiSubmit`.
   - **Context**: Fetch context from Supabase (e.g., `context_elements` for the current project).
   - **API Call**: Send prompt + context to Hugging Face API via Netlify Function (e.g., `functions/generate-text.js`).
   - **Output**: Display result in `#aiModal` (Generate view). User can adjust tone/length and regenerate.
   - **Accept**: Insert text at the editor’s cursor position (`contenteditable`).
   ```javascript
   document.getElementById('aiSubmit').addEventListener('click', async () => {
       if (currentMode === 'generate') {
           const prompt = document.getElementById('aiInput').value;
           const context = await fetchContextFromSupabase(); // Mock function
           const response = await fetch('/.netlify/functions/generate-text', {
               method: 'POST',
               body: JSON.stringify({ prompt, context, tone: document.getElementById('aiTone').value, length: document.getElementById('aiLength').value })
           });
           const { text } = await response.json();
           showAIModal('generate', text);
       }
   });
   ```

2. **Edit Mode**:
   - **Trigger**: User selects text in the editor, enters a prompt (e.g., “Make this suspenseful”), and clicks `#aiSubmit`.
   - **Context**: Include selected text and relevant context from Supabase.
   - **API Call**: Send selected text + prompt + context to Hugging Face API.
   - **Output**: Show edited text in `#aiModal`. Highlight changes (e.g., `<ins>` for additions, `<del>` for deletions).
   - **Accept**: Replace selected text with the edited version.
   ```javascript
   document.getElementById('aiSubmit').addEventListener('click', async () => {
       if (currentMode === 'edit') {
           const selection = window.getSelection().toString();
           if (!selection) {
               alert('Please select text to edit.');
               return;
           }
           const prompt = document.getElementById('aiInput').value;
           const context = await fetchContextFromSupabase();
           const response = await fetch('/.netlify/functions/edit-text', {
               method: 'POST',
               body: JSON.stringify({ selectedText: selection, prompt, context, tone: document.getElementById('aiTone').value, length: document.getElementById('aiLength').value })
           });
           const { text } = await response.json();
           showAIModal('edit', text, selection);
       }
   });
   ```

3. **Chat Mode**:
   - **Trigger**: User clicks `#chatSubmit` or presses Enter in `#chatInput` with a prompt (e.g., “Suggest plot twists”).
   - **Context**: Include project context to ground brainstorming.
   - **API Call**: Send prompt + context to Hugging Face API, maintaining conversation history in `#chatHistory`.
   - **Output**: Append AI response to `#chatHistory` as a chat bubble.
   - **No Accept/Reject**: Chat is informational, so only “Reject” (close modal) is needed.
   ```html
   <div class="chat-message ai-message p-3 bg-primaryLight rounded-lg mb-2">
       <p class="text-sm text-textPrimary">Try adding a betrayal by Sarah to create tension.</p>
   </div>
   <div class="chat-message user-message p-3 bg-white border border-gray-200 rounded-lg mb-2">
       <p class="text-sm text-textPrimary">Suggest another plot twist.</p>
   </div>
   ```
   ```javascript
   document.getElementById('chatSubmit').addEventListener('click', async () => {
       const prompt = document.getElementById('chatInput').value;
       if (!prompt) return;
       const chatHistory = document.getElementById('chatHistory');
       chatHistory.insertAdjacentHTML('beforeend', `
           <div class="chat-message user-message p-3 bg-white border border-gray-200 rounded-lg mb-2">
               <p class="text-sm text-textPrimary">${prompt}</p>
           </div>
       `);
       const context = await fetchContextFromSupabase();
       const response = await fetch('/.netlify/functions/chat-text', {
           method: 'POST',
           body: JSON.stringify({ prompt, context, history: getChatHistory() })
       });
       const { text } = await response.json();
       chatHistory.insertAdjacentHTML('beforeend', `
           <div class="chat-message ai-message p-3 bg-primaryLight rounded-lg mb-2">
               <p class="text-sm text-textPrimary">${text}</p>
           </div>
       `);
       document.getElementById('chatInput').value = '';
       chatHistory.scrollTop = chatHistory.scrollHeight;
   });
   ```

#### 3.2.4 Netlify Functions for AI
Create three Netlify Functions to handle AI requests, using the Hugging Face Inference API:

1. **Generate Text** (`functions/generate-text.js`):
   ```javascript
   const fetch = require('node-fetch');

   exports.handler = async (event) => {
       const { prompt, context, tone, length } = JSON.parse(event.body);
       const fullPrompt = `Context: ${context.join('\n')}\nTone: ${tone}\n${prompt}`;
       const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
           method: 'POST',
           headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
           body: JSON.stringify({ inputs: fullPrompt, parameters: { max_length: parseInt(length) } })
       });
       const result = await response.json();
       return {
           statusCode: 200,
           body: JSON.stringify({ text: result[0].generated_text })
       };
   };
   ```

2. **Edit Text** (`functions/edit-text.js`):
   ```javascript
   exports.handler = async (event) => {
       const { selectedText, prompt, context, tone, length } = JSON.parse(event.body);
       const fullPrompt = `Context: ${context.join('\n')}\nSelected Text: ${selectedText}\nInstruction: ${prompt}\nTone: ${tone}`;
       const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
           method: 'POST',
           headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
           body: JSON.stringify({ inputs: fullPrompt, parameters: { max_length: parseInt(length) } })
       });
       const result = await response.json();
       return {
           statusCode: 200,
           body: JSON.stringify({ text: result[0].generated_text })
       };
   };
   ```

3. **Chat Text** (`functions/chat-text.js`):
   ```javascript
   exports.handler = async (event) => {
       const { prompt, context, history } = JSON.parse(event.body);
       const fullPrompt = `Context: ${context.join('\n')}\nConversation History: ${history.join('\n')}\nUser: ${prompt}`;
       const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
           method: 'POST',
           headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
           body: JSON.stringify({ inputs: fullPrompt, parameters: { max_length: 200 } })
       });
       const result = await response.json();
       return {
           statusCode: 200,
           body: JSON.stringify({ text: result[0].generated_text })
       };
   };
   ```

#### 3.2.5 User-Friendly and Sleek Design
- **Visual Consistency**:
  - Use `bg-primaryLight` for the AI Control Panel to match the sidebar’s aesthetic.
  - Style chat messages with rounded corners and subtle shadows (`shadow-sm-custom`).
- **Feedback**:
  - Show a loading spinner in `#aiModal` while fetching AI responses (`<i class="fas fa-spinner fa-spin"></i>`).
  - Display success/error messages (e.g., “Text inserted!”) using a toast component:
    ```html
    <div id="toast" class="fixed bottom-4 right-4 bg-success text-white p-3 rounded-lg shadow-md-custom hidden">
        Action completed!
    </div>
    ```
- **Micro-Interactions**:
  - Animate mode toggle buttons (e.g., `scale(1.1)` on hover).
  - Add a subtle pulse effect to `#aiSubmit` when a valid prompt is entered.
- **Context Integration**:
  - Show a context preview in the modal (e.g., “Using context: Jane, Darkwood Forest”) with a toggle to edit context directly.

---

## 4. Implementation Notes
- **React Migration**:
  - Convert the inline JavaScript to React components for better state management:
    - `AIToolbar.js`: Handles mode toggle and input.
    - `AIModal.js`: Manages Generate/Edit/Chat views.
    - `CharacterTree.js`: Dynamic network visualization.
  - Use React Context or Redux for global state (e.g., current mode, context).
- **Supabase Integration**:
  - Fetch context from `context_elements` table when constructing AI prompts.
  - Store chat history temporarily in Supabase for session persistence.
- **Hugging Face API**:
  - Use environment variables (`HF_API_KEY`) in Netlify for security.
  - Implement rate limiting and error handling (e.g., retry on 429 errors).
- **Testing**:
  - Test AI modes with sample prompts and context.
  - Ensure accessibility (e.g., keyboard navigation for mode toggle).
  - Verify performance (e.g., modal load time < 500ms).

---

## 5. Future Considerations
- **Advanced AI Models**: Upgrade to GPT-Neo or Flan-T5 for subscribers.
- **Context Suggestions**: Auto-suggest context elements based on editor content.
- **Chat Memory**: Persist chat history across sessions in Supabase.
- **Voice Input**: Add a microphone button for voice-based prompts (Web Speech API).

---

## Summary
- **Upgrades**: Improve mobile responsiveness, accessibility, interactivity (dynamic character network), performance (modular JS), and visual polish (animations).
- **AI Features**:
  - **Generate**: Prompt-based text creation with context, displayed in a modal.
  - **Edit**: Modify selected text with context-aware prompts.
  - **Chat**: Conversational brainstorming with a chat interface.
  - **Mode Toggle**: Sleek toggle button in the toolbar to switch modes, with dynamic input and modal content.
- **Implementation**: Use Tailwind for styling, React for components, Netlify Functions for Hugging Face API calls, and Supabase for context storage.

Let me know if you need:
- React component code for the AI Control Panel or Modal.
- A detailed Netlify Function setup guide.
- Wireframes for the updated toolbar or chat interface.
- Assistance with Supabase schema for storing AI interactions.