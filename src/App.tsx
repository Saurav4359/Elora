import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./prompt-input";
import type { GalleryState, GenerationState } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PreviewPanel } from "./preview-panel";

const cleanGeneratedCode = (raw: string): string => {
  let code = raw.trim();
  code = code.replace(/^```(?:jsx|tsx|javascript|typescript)?\s*\n?/i, "");
  code = code.replace(/\n?```\s*$/i, "");
  code = code.replace(/^import\s+.*;\s*\n?/gm, "");
  code = code.replace(/^export\s+(default\s+)?/gm, "");
  const fnMatch = code.match(
    /(?:function|const)\s+\w+\s*(?:=\s*)?(?:\([^)]*\)\s*(?:=>)?\s*)?[({]\s*\n?\s*return\s*\(\s*\n?([\s\S]*?)\n?\s*\)\s*;?\s*\n?\s*[})]\s*;?\s*$/,
  );
  if (fnMatch?.[1]) {
    code = fnMatch[1].trim();
  }
  return code.trim();
};

const extractTitle = (prompt: string): string => {
  const words = prompt.split(/\s+/).slice(0, 6).join(" ");
  return words.length > 50 ? words.slice(0, 50) + "..." : words;
};

 

export const App = () => {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("Open_API_KEY") ?? "",
  );
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
  });
  const [galleryState, setGalleryState] = useState<GalleryState>({
    status: "idle",
  });
  const [isSaving, setIsSaving] = useState(false);


  // const fetchGallery= useCallback(async ()=> {

  // })

  // useEffect(()=> {
  //   fetchGallery();
  // },[fetchGallery]);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      if (!apiKey) return;
      setGenerationState({ status: "loading" });
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const systemPrompt =
          "Return only raw JSX for a single React component. No imports, no exports, no function wrapper, no explanations, no markdown code fences. Use only Tailwind CSS classes for styling. The JSX should be a single root element. Use realistic placeholder content.";

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        });
        const raw = result.response.text();
        const code = cleanGeneratedCode(raw);
        if(!code) {
          setGenerationState({status :'error', message:'No code was generated. Try a different prompt.' });
          return;
        }
        setGenerationState({status : 'success',code , prompt});
      } catch (e) {}
    },
    [apiKey],
  );
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar
        onGenerate={handleGenerate}
        isLoading={generationState.status === "loading"}
        apiKey={apiKey}
        onApiKeySave={setApiKey}
      />
      {/* center - preview (placeholder) */}
      <div className="flex-1 flex items-center justify-center">
        {/* <p className="text-gray-500"> */}
        <PreviewPanel
          state={generationState}
          onSave={() => console.log("Save - coming in Class 5")}
          isSaving={false}
        />
        {/* </p> */}
      </div>

      {/* right sidebar - variants (placeholder) */}
      <aside className="w-48 bg-gray-900 border-l border-gray-800 flex items-center justify-center">
        <p className="text-xs text-gray-500">Gallery - coming in Class 5</p>
      </aside>
    </div>
  );
};
