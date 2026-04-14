# AI Voice Component Builder — 12-Hour Build Guide

## Context
User wants to build an AI component builder where they have a live voice call with Gemini. User talks, Gemini listens and updates a React component preview in real time via WebSocket (Gemini Live API). User will write all code — this is a step-by-step guide.

---

## Architecture Overview

```
Browser
  ├── Mic (AudioWorklet → PCM 16kHz)
  │     └──► Gemini Live WebSocket (direct from browser)
  │                └── Gemini responds: AUDIO + function call (render_component)
  ├── Audio playback (PCM → AudioContext)
  ├── Component Preview (iframe sandbox with Babel standalone)
  └── Code Panel (display current JSX)
```

**Key decision**: Connect Gemini Live **directly from the browser** (not via a Next.js API proxy). Simpler for a 12h build. Uses `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local`.

---

## Step 1: Install + Env Setup

```bash
bun add @google/genai
```

Create `.env.local`:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

---

## Step 2: `lib/prompt.ts` — System Prompt

Define the system instruction for Gemini. Tell it:
- It's a React component builder assistant
- It must ALWAYS call the `render_component` function when building/updating components
- Components should use Tailwind CSS + React hooks
- Keep components self-contained (no imports — Babel sandbox will inject React)

```ts
export const SYSTEM_PROMPT = `
You are an AI React component builder assistant. You help users build UI components through voice conversation.

When the user asks you to build, modify, or update any component:
1. Respond conversationally (you will speak your response)
2. ALWAYS call the render_component function with the complete updated component code

Component code rules:
- Use Tailwind CSS for all styling
- Use React hooks freely (useState, useEffect, etc.)
- Do NOT import React or anything — the sandbox provides it
- Export a default function component named App
- Make it visually beautiful

Start with a default "Hello World" component on session start.
`;
```

---

## Step 3: `lib/gemini.ts` — Gemini Live Session Manager

This is the core. It manages the WebSocket session lifecycle.

**What to implement:**

```ts
import { GoogleGenAI, Modality } from "@google/genai";

// The tool Gemini will call to update the component
const TOOLS = [{
  functionDeclarations: [{
    name: "render_component",
    description: "Renders/updates the React component in the preview panel",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Complete React component JSX" },
        description: { type: "string", description: "What the component does" }
      },
      required: ["code", "description"]
    }
  }]
}];

// Session config
const SESSION_CONFIG = {
  model: "gemini-2.0-flash-live-001",
  config: {
    responseModalities: [Modality.AUDIO, Modality.TEXT],
    systemInstruction: SYSTEM_PROMPT,
    tools: TOOLS,
  }
};

// Export a class or set of functions:
// - createSession(onCodeUpdate, onAudioChunk, onTranscript): Session
// - session.sendAudio(base64PCM: string)
// - session.close()
```

**Callback shapes:**
- `onCodeUpdate(code: string, description: string)` — called when Gemini fires `render_component`
- `onAudioChunk(base64PCM: string, sampleRate: number)` — called for each audio response chunk
- `onTranscript(text: string, isUser: boolean)` — for displaying conversation

**Key Gemini Live events to handle in `onmessage`:**
```
msg.serverContent?.modelTurn?.parts → check for functionCall parts
msg.serverContent?.modelTurn?.parts → check for inlineData (audio)
msg.serverContent?.outputTranscription?.text → Gemini's speech text
msg.serverContent?.inputTranscription?.text → user speech text
```

When you receive a `functionCall` with name `render_component`, call your `onCodeUpdate` callback. Then send back a function response:
```ts
session.sendToolResponse({
  functionResponses: [{
    id: part.functionCall.id,
    name: "render_component",
    response: { result: "Component rendered successfully" }
  }]
})
```

---

## Step 4: `public/audio-processor.js` — AudioWorklet

This runs in a separate audio thread. Captures mic PCM and sends it to the main thread.

```js
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0];
    if (input) {
      // Downsample from AudioContext rate (usually 48000) to 16000Hz
      // Then convert Float32 → Int16 → base64
      this.port.postMessage({ pcm: /* base64 string */ });
    }
    return true;
  }
}
registerProcessor("pcm-processor", PCMProcessor);
```

**Downsampling**: Simple decimation — take every Nth sample where N = sampleRate / 16000. For 48kHz: take every 3rd sample.

**Float32 → Int16 → base64**:
```js
// Float32Array → Int16Array
const int16 = new Int16Array(float32.length);
for (let i = 0; i < float32.length; i++) {
  int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
}
// Int16Array → base64
const bytes = new Uint8Array(int16.buffer);
const binary = String.fromCharCode(...bytes);
const b64 = btoa(binary);
```

---

## Step 5: `components/MicButton.tsx` — Voice Capture

Manages the full audio pipeline:
1. `getUserMedia({ audio: true })`
2. Create `AudioContext`
3. Load AudioWorklet: `audioCtx.audioWorklet.addModule('/audio-processor.js')`
4. `new AudioWorkletNode(audioCtx, 'pcm-processor')`
5. Connect mic stream → worklet node
6. On worklet message → `session.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64 } })`

**State**: `idle | listening | processing`

**UI**: Big pulsing mic button. Red when listening, gray when idle.

---

## Step 6: `components/PreviewPanel.tsx` — Live Component Preview

Use a sandboxed `<iframe>` with `srcdoc`. When code updates, set new srcdoc:

```ts
const buildSandboxHTML = (code: string) => `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useCallback } = React;
    ${code}
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</body>
</html>
`;
```

**Note**: React/ReactDOM scripts must load BEFORE Babel runs. Put them before the babel script tag, or load React first then Babel type="text/babel" will pick it up.

Actually correct order:
1. Tailwind CDN
2. React + ReactDOM UMD scripts (no type=module)
3. Babel standalone
4. `<script type="text/babel">` with your component + render call

---

## Step 7: `components/CodePanel.tsx` — Code Display

Simple. Show the current JSX code. Use a `<pre>` with syntax highlighting or just a `<textarea readonly>`. Add a copy button.

Optional: Add `highlight.js` or `prism.js` from CDN for syntax coloring.

---

## Step 8: `components/TranscriptionBox.tsx` — Chat Log

Show the conversation as a scrollable list of messages:
- User messages (right-aligned, blue)
- Gemini messages (left-aligned, gray)

Auto-scroll to bottom on new message.

---

## Step 9: `components/BuilderShell.tsx` — Layout

Split layout:
```
┌─────────────────┬────────────────────────────┐
│   Left Panel    │      Right Panel            │
│                 │  ┌──────────────────────┐   │
│  TranscriptBox  │  │   PreviewPanel       │   │
│                 │  │   (live iframe)      │   │
│  MicButton      │  └──────────────────────┘   │
│  (center)       │  ┌──────────────────────┐   │
│                 │  │   CodePanel          │   │
│  Status text    │  │   (JSX code)         │   │
└─────────────────┴──┴──────────────────────┘   
```

Props/state to pass down:
- `currentCode` — passed to PreviewPanel + CodePanel
- `transcript` — array of messages
- `sessionState` — idle/connecting/live

---

## Step 10: `app/page.tsx` — Wire It All Together

```tsx
'use client'
import { useState, useCallback } from 'react'
import BuilderShell from '@/components/BuilderShell'

const DEFAULT_COMPONENT = `
function App() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <h1 className="text-4xl font-bold text-white">Hello World</h1>
    </div>
  )
}
`;

export default function Home() {
  const [code, setCode] = useState(DEFAULT_COMPONENT);
  const [transcript, setTranscript] = useState([]);
  
  const handleCodeUpdate = useCallback((newCode, description) => {
    setCode(newCode);
    setTranscript(prev => [...prev, { role: 'assistant', text: description }]);
  }, []);

  return (
    <BuilderShell
      code={code}
      transcript={transcript}
      onCodeUpdate={handleCodeUpdate}
    />
  );
}
```

---

## Audio Playback (Gemini's Voice)

When you receive audio chunks from Gemini (`onAudioChunk`), you need to play them:

```ts
// Decode base64 PCM → Int16Array → Float32Array → AudioBuffer → play
const playAudioChunk = async (base64: string, sampleRate: number) => {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  const audioCtx = getAudioContext(); // reuse same context
  const buffer = audioCtx.createBuffer(1, float32.length, sampleRate);
  buffer.getChannelData(0).set(float32);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
};
```

**Important**: Queue chunks and play sequentially — don't call `start()` on overlapping chunks. Use a simple queue with `source.onended` to advance.

---

## Types (`types/types.ts`)

```ts
export type SessionState = 'idle' | 'connecting' | 'live' | 'error';
export type MessageRole = 'user' | 'assistant';

export interface TranscriptMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
}

export interface ComponentUpdate {
  code: string;
  description: string;
  timestamp: number;
}
```

---

## Build Order (12 Hours)

| Hour | Task |
|------|------|
| 1 | Setup env, `lib/prompt.ts`, `types/types.ts`, `lib/gemini.ts` skeleton |
| 2-3 | Complete `lib/gemini.ts` — session connect, message parsing, function calling |
| 3-4 | `public/audio-processor.js` + `components/MicButton.tsx` (mic capture pipeline) |
| 5 | `components/PreviewPanel.tsx` (iframe sandbox) |
| 6 | `components/CodePanel.tsx` + `components/TranscriptionBox.tsx` |
| 7 | `components/BuilderShell.tsx` layout |
| 8 | `app/page.tsx` — wire everything together |
| 9 | Audio playback for Gemini's voice |
| 10 | Test + debug the full loop (talk → code update → preview) |
| 11 | UI polish, error states, connection status |
| 12 | Buffer / edge cases |

---

## Key Gotchas

1. **AudioContext must be created on user gesture** — create it inside the mic button click handler
2. **Gemini Live requires function response** — always send `sendToolResponse` after receiving a function call or the session stalls
3. **iframe srcdoc re-renders fully** — this is fine for component updates, just set `srcdoc` to the new HTML string
4. **React in iframe** — use React 18 UMD builds (CDN), not 19, for Babel standalone compatibility
5. **Audio chunks arrive out of order** sometimes — use a queue, not fire-and-forget play
6. **`'use client'`** required on any component using hooks, audio APIs, or browser APIs
7. **Next.js 16 app router** — all pages in `app/` are server components by default. Add `'use client'` at top of any file using browser APIs

---

## Verification

End-to-end test:
1. `bun dev` starts without errors
2. Click mic button → browser asks for mic permission
3. Say "build me a red button" → Gemini responds with voice + `render_component` fires
4. Preview panel shows updated component
5. Code panel shows the JSX
6. Transcript shows the conversation
