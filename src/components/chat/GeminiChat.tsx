/// <reference types="vite/client" />

// src/components/chat/GeminiChat.tsx
import React, { useState, FormEvent, useEffect, useRef } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { Mic, Languages, Send, MicOff } from 'lucide-react';

// --- TYPE DEFINITIONS for Speech Recognition ---
// Extend the Window interface to include browser-specific speech recognition properties
interface CustomWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
declare const window: CustomWindow;

// Define the structure for the Speech Recognition Error Event
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// --- Component Starts ---
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

// Define the structure of a single part of a conversation
interface ContentPart {
  text: string;
}
interface ConversationEntry {
  role: 'user' | 'model';
  parts: ContentPart[];
}

const FUNCTION_URL = "https://ytnsjmbhgwcuwmnflncl.supabase.co/functions/v1/custom-ai-agent";

const askCustomAgent = async (
  history: ConversationEntry[],
  accessToken: string,
  anonKey: string,
  agentType: 'classic' | 'web' | 'image' | 'translate'
): Promise<string> => {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ history, agentType }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error invoking Supabase function:", error);
    throw error;
  }
};

interface GeminiChatProps {
  starterPrompt?: string;
  agentType: 'classic' | 'web' | 'image';
}

const GeminiChat: React.FC<GeminiChatProps> = ({ starterPrompt = '', agentType }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useUser();
  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const agentPlaceholders = {
    classic: 'வாடிக்கையாளர், ஆர்டர்களைப் பற்றி கேட்கவும்...',
    web: 'இணையத்தில் தேட எதையும் கேட்கவும்...',
    image: 'உருவாக்க வேண்டிய படத்தின் விவரம்...',
  };

  useEffect(() => {
    if (starterPrompt) setPrompt(starterPrompt);
  }, [starterPrompt]);

  useEffect(() => {
    chatDisplayRef.current?.scrollTo(0, chatDisplayRef.current.scrollHeight);
  }, [conversationHistory, isLoading]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ta-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // Add explicit types to event handlers
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => console.error("Speech recognition error", e.error);
    recognition.onresult = (e: SpeechRecognitionEvent) => setPrompt(e.results[0][0].transcript);
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const handleNewPrompt = async (currentPrompt: string) => {
    if (!currentPrompt.trim() || !session) return;
    setIsLoading(true);
    setError(null);
    const updatedHistory: ConversationEntry[] = [...conversationHistory, { role: 'user', parts: [{ text: currentPrompt }] }];
    setConversationHistory(updatedHistory);
    setPrompt('');
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY is not set.");
      const result = await askCustomAgent(updatedHistory, session.access_token, anonKey, agentType);
      setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: result }] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setConversationHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleNewPrompt(prompt);
  };
  
  const handleVoiceInputToggle = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const handleTranslate = async () => {
      // ... (Translation logic remains the same)
  };

  const renderContent = (text: string) => {
    const base64ImageRegex = /data:image\/png;base64,([a-zA-Z0-9+/=]+)/;
    const match = text.match(base64ImageRegex);

    if (match) {
        const imageUrl = match[0];
        const caption = text.substring(0, match.index).trim();

        return (
            <div>
                {caption && <p className="mb-2 text-gray-700 dark:text-gray-200">{caption}</p>}
                <a href={imageUrl} target="_blank" rel="noopener noreferrer" title="Click to view full image">
                    <img src={imageUrl} alt="Generated AI Image" className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" />
                </a>
            </div>
        );
    }
    
    return <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-left">{text}</p>;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm dark:bg-gray-800 flex flex-col h-full">
      <div ref={chatDisplayRef} className="flex-grow mb-4 overflow-y-auto p-4 bg-gray-50 rounded-lg border dark:bg-zinc-700 dark:border-zinc-600">
        {conversationHistory.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>கேள்வி கேட்கவும் அல்லது தொடக்கத்தைத் தேர்ந்தெடுக்கவும்.</p>
            </div>
        )}
        {conversationHistory.map((entry, index) => (
          <div key={index} className={`mb-3 p-3 rounded-lg flex flex-col ${ entry.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-900/40 items-end ml-auto' : 'bg-gray-100 dark:bg-gray-700/60 items-start' }`} style={{ maxWidth: '85%' }}>
            <p className="font-bold text-sm capitalize text-gray-800 dark:text-gray-100 mb-1">{entry.role === 'model' ? `AI ${agentType}` : 'நீங்கள்'}</p>
            {renderContent(entry.parts[0].text)}
          </div>
        ))}
        {isLoading && (
             <div className="my-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/60 flex items-center" style={{ maxWidth: '85%' }}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-3"></div>
                <p className="text-gray-600 dark:text-gray-300">யோசிக்கிறேன்...</p>
             </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={isListening ? 'பேசுங்கள்...' : agentPlaceholders[agentType]} className="flex-grow" disabled={isLoading} aria-label="Ask the AI agent" />
        
        <Button type="button" onClick={handleVoiceInputToggle} disabled={isLoading} variant="outline" className={`px-3 ${isListening ? 'text-red-500' : ''}`}>
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Button type="button" onClick={handleTranslate} disabled={isLoading || conversationHistory.filter(e => e.role === 'model').length === 0} variant="outline" className="px-3">
            <Languages className="w-5 h-5" />
        </Button>
        <Button type="submit" disabled={isLoading || !prompt.trim()} className="px-4 py-2">
            <Send className="w-5 h-5" />
        </Button>
      </form>

      {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}
    </div>
  );
};

export default GeminiChat;
