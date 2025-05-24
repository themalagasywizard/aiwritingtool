# AIStoryCraft: Frontend Design Guidelines for MVP

This document outlines the frontend design guidelines, color palette, typography, and UI components for the Minimum Viable Product (MVP) of AIStoryCraft, a web-based writing app with AI integration. The design prioritizes a distraction-free, intuitive interface for writers, leveraging **React** and **Tailwind CSS**, hosted on **Netlify**, with data managed in **Supabase**.

---

## 1. Design Principles

The frontend design adheres to the following principles to ensure a cohesive and user-friendly experience:

1. **Simplicity**: Clean, minimal UI to keep focus on writing.
2. **Intuitiveness**: Clear navigation and actionable elements for ease of use.
3. **Accessibility**: WCAG 2.1 compliance (Level A) for keyboard navigation, contrast, and alt text.
4. **Responsiveness**: Optimized for desktop and tablet; mobile as secondary (full mobile support in Full Release).
5. **Consistency**: Uniform typography, colors, and component styles across the app.
6. **Performance**: Lightweight design to achieve < 2-second page loads on Netlify’s CDN.

---

## 2. Color Palette

The color palette is designed to be calming and professional, suitable for long writing sessions, with a light mode focus for the MVP. The palette includes primary, secondary, accent, and neutral colors, ensuring sufficient contrast for accessibility.

| **Category**      | **Color**       | **Hex Code** | **Usage**                              |
|--------------------|-----------------|--------------|----------------------------------------|
| **Primary**       | Slate Blue      | `#4B5EAA`    | Buttons, headers, active states        |
| **Primary (Light)**| Light Slate     | `#E6E9F0`    | Button hovers, backgrounds             |
| **Secondary**     | Soft Gray       | `#6B7280`    | Text, borders, secondary buttons       |
| **Accent**        | Coral           | `#F472B6`    | Highlights, AI generation indicators    |
| **Background**    | Off-White       | `#F9FAFB`    | Main app background                    |
| **Text (Primary)**| Charcoal        | `#1F2937`    | Body text, headings                    |
| **Text (Secondary)**| Gray          | `#9CA3AF`    | Subtext, placeholders                  |
| **Success**       | Green           | `#34D399`    | Success messages, accept buttons       |
| **Error**         | Red             | `#EF4444`    | Error messages, alerts                 |
| **Warning**       | Yellow          | `#FBBF24`    | Warnings, unsaved changes indicators   |

### Accessibility Notes
- Contrast ratios meet WCAG 2.1 Level AA (e.g., `#1F2937` on `#F9FAFB` has a 12.5:1 ratio for text).
- Accent color (`#F472B6`) used sparingly to avoid overstimulation.
- Light mode only for MVP; dark mode planned for Full Release.

### Tailwind CSS Configuration
The palette will be integrated into `tailwind.config.js` for consistent usage:

```javascript
module.exports = {
  theme: {
    colors: {
      primary: '#4B5EAA',
      primaryLight: '#E6E9F0',
      secondary: '#6B7280',
      accent: '#F472B6',
      background: '#F9FAFB',
      textPrimary: '#1F2937',
      textSecondary: '#9CA3AF',
      success: '#34D399',
      error: '#EF4444',
      warning: '#FBBF24',
    },
  },
};
```

---

## 3. Typography

Typography is chosen for readability and professionalism, optimized for long-form writing and editing.

| **Element**       | **Font**                     | **Size** | **Weight** | **Usage**                              |
|--------------------|------------------------------|----------|------------|----------------------------------------|
| **Headings (H1)** | Inter (Sans-serif)           | 24px     | Bold (700) | Page titles, project names             |
| **Headings (H2)** | Inter                        | 18px     | Medium (500)| Chapter titles, section headers        |
| **Body Text**     | Merriweather (Serif)         | 16px     | Regular (400)| Editor content, main text              |
| **Subtext**       | Inter                        | 14px     | Regular (400)| Labels, placeholders, tooltips         |
| **Button Text**   | Inter                        | 14px     | Medium (500)| Buttons, CTAs                          |
| **Small Text**    | Inter                        | 12px     | Regular (400)| Metadata, error messages, word count   |

### Typography Notes
- **Inter**: Clean, modern sans-serif for UI elements (navigation, buttons, forms).
- **Merriweather**: Serif font for editor text to enhance readability for long-form writing.
- Fonts served via Google Fonts CDN for performance.
- Line height: 1.5 for body text, 1.3 for headings.
- Letter spacing: 0.02em for body, 0.01em for headings.

### Tailwind CSS Typography
```javascript
module.exports = {
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    fontSize: {
      h1: '24px',
      h2: '18px',
      body: '16px',
      subtext: '14px',
      button: '14px',
      small: '12px',
    },
  },
};
```

---

## 4. Layout Guidelines

The app follows a **sidebar + main content** layout for intuitive navigation and writing focus.

### 4.1 Structure
- **Top Bar** (64px height):
  - Left: App logo, project name (clickable to dashboard).
  - Right: User profile (avatar, dropdown), logout.
  - Background: `#F9FAFB`, border-bottom: 1px `#E6E9F0`.
- **Sidebar** (250px width, collapsible on tablet):
  - Top: Chapter list (drag-and-drop).
  - Middle: Context manager button.
  - Bottom: Export PDF button, word count.
  - Background: `#E6E9F0`, border-right: 1px `#6B7280`.
- **Main Content**:
  - Editor area (80% width on desktop, full-width on collapse).
  - Background: `#F9FAFB`, padding: 24px.
  - Fixed toolbar above editor for formatting, AI actions.
- **Modals**:
  - Centered, max-width: 600px, background: `#F9FAFB`, shadow: `0 4px 12px rgba(0,0,0,0.1)`.
  - Used for AI previews, context forms, export settings.

### 4.2 Spacing
- **Padding**: 16px (components), 24px (sections), 32px (main content).
- **Margin**: 8px (between elements), 16px (sections), 24px (major blocks).
- **Border Radius**: 6px for buttons, cards, modals; 0px for editor and sidebar.
- **Shadows**: Subtle (`0 2px 8px rgba(0,0,0,0.05)`) for buttons, modals.

### 4.3 Responsiveness
- **Desktop** (>1024px): Full sidebar, top bar, main content.
- **Tablet** (768px-1024px): Collapsible sidebar (toggle button), full-width editor.
- **Mobile** (<768px): Sidebar hidden, accessible via hamburger menu; editor full-screen.

---

## 5. UI Components for MVP

The following components are required to build the MVP frontend, covering all features specified in the PRD (LLM integration, context management, writing interface, AI generation, PDF export, user accounts, project management).

### 5.1 Navigation Components
1. **TopBar**
   - **Description**: Fixed header with app branding and user controls.
   - **Elements**:
     - Logo (SVG, 40x40px, `#4B5EAA`).
     - Project name (H1, clickable to dashboard).
     - User avatar (32x32px, circular, dropdown with “Profile,” “Logout”).
   - **Styles**: `bg-background`, `border-b`, `px-6`, `py-4`.
   - **Interactions**: Dropdown toggles on avatar click.

2. **Sidebar**
   - **Description**: Collapsible navigation for chapters and actions.
   - **Elements**:
     - Chapter list (draggable items, H2 text, `hover:bg-primaryLight`).
     - Context manager button (`bg-primary`, `text-white`).
     - Export PDF button (`bg-success`, `text-white`).
     - Word count display (`text-small`, `text-secondary`).
   - **Styles**: `bg-primaryLight`, `border-r`, `w-[250px]`, `p-4`.
   - **Interactions**: Drag-and-drop chapters, collapse on tablet.

3. **HamburgerMenu** (Tablet/Mobile)
   - **Description**: Toggles sidebar on smaller screens.
   - **Elements**: Icon (24x24px, `#1F2937`), hidden on desktop.
   - **Styles**: `absolute`, `top-4`, `right-4`.
   - **Interactions**: Toggles sidebar visibility.

### 5.2 Editor Components
4. **RichTextEditor**
   - **Description**: Core writing area with formatting and AI integration.
   - **Elements**:
     - Text area (Merriweather, `text-body`, `min-h-screen`).
     - Toolbar: Buttons for bold, italic, headings, lists (`bg-background`, `shadow-sm`).
     - Inline AI menu: “Continue,” “Rewrite,” “Suggest” (pops up on text selection).
   - **Styles**: `bg-white`, `p-6`, `rounded-md`, `shadow-sm`.
   - **Interactions**: Real-time typing, autosave to Supabase, AI menu on selection.

5. **WordCountDisplay**
   - **Description**: Shows word count for chapter/project.
   - **Elements**: Text (`text-small`, `text-secondary`, e.g., “1,234 words”).
   - **Styles**: `absolute`, `bottom-4`, `right-4`.
   - **Interactions**: Updates on typing.

### 5.3 AI Integration Components
6. **AIPreviewModal**
   - **Description**: Displays AI-generated text for review.
   - **Elements**:
     - Header (H2, “AI Suggestion”).
     - Text preview (`text-body`, `bg-background`, `p-4`).
     - Buttons: Accept (`bg-success`), Reject (`bg-error`), Regenerate (`bg-primary`).
     - Tone dropdown (`border-secondary`, options: “Suspenseful,” “Humorous”).
     - Length slider (`accent`, 50-500 words).
   - **Styles**: `max-w-[600px]`, `bg-background`, `shadow-md`, `p-6`.
   - **Interactions**: Accept inserts text, Regenerate calls Netlify Function.

7. **AICustomPromptInput**
   - **Description**: Textarea for custom AI prompts.
   - **Elements**: Textarea (`text-subtext`, `border-secondary`, placeholder: “e.g., Add a plot twist”).
   - **Styles**: `w-full`, `h-20`, `p-2`, `rounded-md`.
   - **Interactions**: Submits to Netlify Function on Enter or button click.

### 5.4 Context Management Components
8. **ContextManagerButton**
   - **Description**: Opens context management interface.
   - **Elements**: Button (`bg-primary`, `text-white`, “Manage Context”).
   - **Styles**: `w-full`, `py-2`, `rounded-md`.
   - **Interactions**: Opens ContextFormModal.

9. **ContextFormModal**
   - **Description**: Form to add/edit story elements.
   - **Elements**:
     - Tabs: Characters, Events, Settings.
     - Fields: Name (`text-subtext`), Description (`textarea`), optional Backstory.
     - Save (`bg-success`), Cancel (`bg-secondary`) buttons.
   - **Styles**: `max-w-[600px]`, `bg-background`, `p-6`, `shadow-md`.
   - **Interactions**: Saves to Supabase, updates context list.

10. **ContextList**
    - **Description**: Displays saved context elements in sidebar.
    - **Elements**: List items (`text-subtext`, `hover:bg-primaryLight`, e.g., “John Doe - Protagonist”).
    - **Styles**: `p-2`, `border-b`, `border-secondary`.
    - **Interactions**: Click to edit in ContextFormModal.

### 5.5 PDF Export Components
11. **ExportPDFButton**
    - **Description**: Triggers PDF export process.
    - **Elements**: Button (`bg-success`, `text-white`, “Export PDF”).
    - **Styles**: `w-full`, `py-2`, `rounded-md`.
    - **Interactions**: Opens ExportPDFModal.

12. **ExportPDFModal**
    - **Description**: Configures and previews PDF export.
    - **Elements**:
      - Preview pane (first page, `bg-white`, `shadow-sm`).
      - Settings: Font (dropdown), Margins (sliders), Title Page (checkbox).
      - Download button (`bg-success`, “Download PDF”).
    - **Styles**: `max-w-[800px]`, `bg-background`, `p-6`, `shadow-md`.
    - **Interactions**: Calls Netlify Function for PDF generation.

### 5.6 Authentication Components
13. **LoginForm**
    - **Description**: Handles user login via Supabase Auth.
    - **Elements**:
      - Email input (`text-subtext`, `border-secondary`).
      - Password input (`type=password`).
      - Login button (`bg-primary`).
      - OAuth buttons (Google, GitHub, `bg-secondary`).
      - Forgot Password link (`text-small`, `text-accent`).
    - **Styles**: `max-w-[400px]`,