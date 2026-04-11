# AI Voice Component Builder

AI Voice Component Builder is a conversational UI generation app that turns spoken or typed product ideas into production-ready React components. It combines a live Gemini-based generation flow with a preview surface so you can describe a component, iterate on it in real time, and copy the result into your app.

## What It Does

- Accepts natural language component requests
- Supports voice-driven prompt creation for faster iteration
- Also supports written prompts for precise control
- Streams Gemini responses live as the model generates
- Cleans the model output into usable JSX
- Renders the generated component in an isolated preview
- Lets you switch between preview and code views
- Supports copying the generated component code

## Core Use Cases

- Build marketing components from a voice prompt
- Generate UI cards, forms, dashboards, and pricing sections
- Rapidly prototype interface ideas without switching tools
- Explore multiple design directions in a conversational workflow

## How The Flow Works

1. You enter a prompt by typing or speaking a component idea.
2. The app sends the request to Gemini Live.
3. Gemini streams the generated JSX back in real time.
4. The app cleans and normalizes the output.
5. The preview panel renders the component in a sandboxed frame.
6. You inspect the code, copy it, or refine the prompt.

## Features

- Live generation streaming
- Voice-first prompt workflow
- React + Tailwind output
- Code preview and rendered preview
- Copy-to-clipboard support
- Local API key storage in the browser
- Error handling for empty or invalid responses

## Suggested Tech Stack

- `Next.js` for the application shell and routing
- `React` for the UI
- `TypeScript` for type safety
- `Tailwind CSS` for styling
- `@google/genai` for Gemini Live integration
- Web Speech API or a custom audio capture layer for voice input

## Architecture

### Frontend

The frontend is responsible for:

- Prompt entry and voice capture
- Live chat-style state updates
- Rendering generated components
- Displaying code and preview modes

### AI Layer

The AI layer handles:

- Gemini Live session creation
- Streaming response handling
- Prompt formatting for component generation
- JSX cleanup and validation

### Preview Layer

The preview layer handles:

- Isolated rendering of generated JSX
- Safe execution in a sandboxed frame
- Error fallback when the component fails to render

## Environment Variables

Use a local `.env.local` file for secrets.

```env
GEMINI_API_KEY=your_gemini_api_key
```

If you use Firebase or other services later, add those keys here as well.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create `.env.local` and add your Gemini API key.

### 3. Run the app

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

### 5. Lint the project

```bash
npm run lint
```

## Voice Interaction Idea

For the voice experience, the user can:

- Hold a mic button and speak a request
- Dictate a component description
- Ask for changes such as color, layout, spacing, or content
- Refine the output through short follow-up voice prompts

## Writing Workflow

You can also use the app like a normal prompt-to-component builder:

- Type a component request in the prompt box
- Generate a component from a short or detailed brief
- Refine it with follow-up typed prompts
- Compare the code and preview side by side

Example prompts:

- "Create a dark pricing card with a monthly and yearly toggle"
- "Make a sleek profile card with avatar, stats, and social links"
- "Generate a landing page hero with a CTA and abstract background"
- "Build a compact dashboard summary card with three metrics"

## Prompting Tips

- Be specific about the component type
- Mention layout, theme, and style direction
- Include desired content and interactions
- Ask for one component at a time
- Use follow-up prompts to refine the result

Example:

```text
Create a modern voice assistant card with a waveform, status text, and action buttons. Use a dark theme and soft gradients.
```

## Implementation Notes

- The generated output should be raw JSX, not a full page
- Tailwind classes are preferred for styling consistency
- The preview should stay isolated from the main UI
- The app should handle partial streamed output gracefully
- A backend proxy is recommended if you want to keep keys private in production

## Security Notes

- Do not expose long-lived API keys directly in the browser for production
- Prefer a backend endpoint or ephemeral token flow for live AI sessions
- Store only non-sensitive user preferences locally

## Roadmap

- Voice capture and playback
- Conversation history
- Component versioning
- Saved component gallery
- Export to Next.js / React files
- Backend auth and secure token exchange
- Multi-turn refinement with prompt memory
- Image or screenshot-based UI generation

## License

Add your preferred license here before publishing the project.

## Project Summary

This project is intended to be a fast, voice-first component ideation tool powered by Gemini Live. It focuses on turning spoken ideas into clean React UI with a minimal feedback loop between prompt, generation, and preview.
