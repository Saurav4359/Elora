import { useState, useCallback, type FormEvent } from "react";
import type { PromptInputProps } from "./types";

const EXAMPLE_PROMPTS = [
  "A dark pricing card with monthly/annual toggle",
  "A user profile card with avatar and social links",
  "A notification toast with progress bar",
  "A login form with email and password",
  "A testimonial card with star ratings",
  "A stats dashboard card with charts",
];

interface SidebarProps extends PromptInputProps {
    apiKey : string,
    onApiKeySave : (key : string) => void 
}

export const Sidebar = ({ 
    onGenerate ,
    isLoading , 
    apiKey,
    onApiKeySave,

} :  SidebarProps)=> {
    const [input , setInput] = useState("");
    const [keyValue, setKeyValue] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);
    const handleSubmit = useCallback(
        (e : FormEvent)=> {e.preventDefault()
        if(!input.trim() || isLoading)
            return;
        onGenerate(input.trim());
},[input, onGenerate, isLoading]);

const handleChipClick = useCallback (
    (prompt: string) => {
        setInput(prompt);
        if(!isLoading) onGenerate(prompt);
    },[isLoading, onGenerate],
);

  return (
       <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
         {/* logo */}
         <div className="px-4 py-4 border-b border-gray-800"> 
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-indigo-600 rounded-lg ">
                    <span className="font-semibold text-white text-sm"> AI Component Builder</span>
                </div>
            </div>
         </div>
       </aside>
  )
}