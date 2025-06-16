// src/components/chat/GeminiChat.tsx
import React, { useState, FormEvent, useEffect } from 'react'; // Import useEffect
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';

// This is the invoke URL for your Supabase Edge Function.
const FUNCTION_URL = "https://ytnsjmbhgwcuwmnflncl.supabase.co/functions/v1/custom-ai-agent";

// Helper function to call our backend
const askCustomAgent = async (prompt: string, accessToken: string, anonKey: string): Promise<string> => {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ prompt }),
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

// Define props for the component
interface GeminiChatProps {
  initialPrompt?: string;
}

const GeminiChat: React.FC<GeminiChatProps> = ({ initialPrompt = '' }) => {
  // Use the initialPrompt to set the initial state
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useUser();

  // Automatically submit the form if an initial prompt is provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() !== '') {
      // Use a dummy event object for the form handler
      const dummyEvent = { preventDefault: () => {} } as FormEvent;
      handleSubmit(dummyEvent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !session) {
      if (!session) setError("You must be logged in to use the AI agent.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
          throw new Error("VITE_SUPABASE_ANON_KEY is not set in your .env file.");
      }
      const result = await askCustomAgent(prompt, session.access_token, anonKey);
      setResponse(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about customers, orders, or anything else..."
          className="flex-grow"
          disabled={isLoading}
          aria-label="Ask the AI agent"
        />
        <Button type="submit" disabled={isLoading || !prompt.trim()} className="sm:w-auto">
          {isLoading ? 'Thinking...' : 'Ask AI Agent'}
        </Button>
      </form>

      {error && <p className="text-red-500 my-4 text-center">{error}</p>}
      
      {/* Show a loading state specifically for the initial prompt */}
      {isLoading && !response && <p className="text-center my-4 text-gray-500">Consulting with the AI agent...</p>}

      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border dark:bg-zinc-700 dark:border-zinc-600">
          <h3 className="font-semibold mb-2 text-lg text-gray-800 dark:text-gray-100">Response:</h3>
          <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiChat;
