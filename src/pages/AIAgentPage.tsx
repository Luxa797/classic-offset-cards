// src/pages/AIAgentPage.tsx
import React from 'react';
import GeminiChat from '@/components/chat/GeminiChat';

const AIAgentPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">AI Agent (Gemini 2.5 Pro)</h1>
      <p className="text-center text-gray-600 mb-6">
        Leverage the power of Gemini 2.5 Pro for advanced assistance.
      </p>
      <div className="max-w-4xl mx-auto">
        <GeminiChat />
      </div>
    </div>
  );
};

export default AIAgentPage;
