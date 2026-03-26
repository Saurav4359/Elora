 

import { useState } from "react";
import { Sidebar } from "./prompt-input";
import type { GalleryState, GenerationState } from "./types";

export const App = () => {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("Open_API_KEY") ?? "",
  );
  const [generationState] = useState<GenerationState>({ status: "idle" });
  const [galleryState] = useState<GalleryState>({ status: "idle" });
  const handleGenerate = (prompt: string) => {
    // generate .....
     
  };
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
        <p className="text-gray-500">Preview panel - coming in Class 4</p>
      </div>

      {/* right sidebar - variants (placeholder) */}
      <aside className="w-48 bg-gray-900 border-l border-gray-800 flex items-center justify-center">
        <p className="text-xs text-gray-500">Gallery - coming in Class 5</p>
      </aside>
    </div>
  );
};
