// src/pages/AIAgentPage.tsx
import React, { useState } from 'react';
import GeminiChat from '@/components/chat/GeminiChat';
import { Bot, LineChart, Users, ShoppingCart, Package, DollarSign, MessageSquare } from 'lucide-react';

const AIAgentPage: React.FC = () => {
  const [initialPrompt, setInitialPrompt] = useState<string>('');

  const abilities = [
    { icon: <Users className="w-5 h-5 text-indigo-500" />, text: "Get customer details by name" },
    { icon: <ShoppingCart className="w-5 h-5 text-green-500" />, text: "Fetch order details by number" },
    { icon: <DollarSign className="w-5 h-5 text-amber-500" />, text: "Retrieve payment history for customers" },
    { icon: <LineChart className="w-5 h-5 text-sky-500" />, text: "Generate financial summaries for any month" },
    { icon: <Package className="w-5 h-5 text-rose-500" />, text: "Identify low-stock materials" },
    { icon: <MessageSquare className="w-5 h-5 text-fuchsia-500" />, text: "And much more..." },
  ];

  const conversationStarters = [
    "What was the financial summary for last month?",
    "Show me payments for customer Lukman",
    "Which items are low in stock?",
    "Get details for order number 25",
  ];
  
  const handleStarterClick = (prompt: string) => {
    setInitialPrompt(prompt);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <Bot className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
            Classic Offset AI Agent
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Your intelligent assistant for business insights.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Abilities Section */}
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Abilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {abilities.map((ability, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  {ability.icon}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ability.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Conversation Starters Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-600 dark:text-gray-400">Conversation Starters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {conversationStarters.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => handleStarterClick(starter)}
                  className="p-3 text-sm text-center bg-white dark:bg-gray-800 shadow-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Gemini Chat Component */}
          <GeminiChat key={initialPrompt} initialPrompt={initialPrompt} />
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
