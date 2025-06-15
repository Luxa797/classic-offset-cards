// src/components/chat/GeminiChat.tsx
import React, { useState, FormEvent } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not set in the .env file");
}
const genAI = new GoogleGenerativeAI(apiKey);
// Corrected Model Name: Using a stable, available model like "gemini-1.5-pro-latest"
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

const GeminiChat: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      // Call the real Gemini API
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setResponse(text);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError('Failed to get a response from the AI. Please check the API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-zinc-800">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Gemini anything..."
          className="flex-grow"
          disabled={isLoading}
          aria-label="Ask Gemini anything"
        />
        <Button type="submit" disabled={isLoading || !prompt.trim()} className="sm:w-auto">
          {isLoading ? 'Thinking...' : 'Ask Gemini'}
        </Button>
      </form>

      {error && <p className="text-red-500 my-4 text-center">{error}</p>}
      
      {isLoading && (
          <div className="text-center my-4">
              <p>Fetching response from Gemini...</p>
              {/* You can add a spinner here */}
          </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border dark:bg-zinc-700 dark:border-zinc-600">
          <h3 className="font-semibold mb-2 text-lg text-gray-800 dark:text-gray-100">Response:</h3>
          {/* Using whitespace-pre-wrap to respect formatting like paragraphs and lists */}
          <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiChat;
