import { GoogleGenAI, Modality } from "@google/genai";

export async function createSession(onTranscript: (t: string) => void) {
  const ai = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
  });

  const session = await ai.live.connect({
    model: "gemini-2.0-flash-live-001",
    config: {
      responseModalities: [Modality.TEXT],
    },
    callbacks: {
      onmessage: (msg: any) => {
        const t = msg.serverContent?.inputTranscription?.text;
        if (t) {
          console.log("🗣️", t);
          onTranscript(t);
        }
      },
    },
  });

  return session;
}