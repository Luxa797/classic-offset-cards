// src/pages/AIAgentPage.tsx
import React, { useState } from 'react';
import GeminiChat from '@/components/chat/GeminiChat';
import { Bot, LineChart, Users, PenSquare, Edit, MessageSquare, ShoppingCart, RefreshCw, ChevronDown, BrainCircuit, Globe, Image as ImageIcon } from 'lucide-react';
import Select from '@/components/ui/Select'; // Assuming you have a Select component

const AIAgentPage: React.FC = () => {
  const [starterPrompt, setStarterPrompt] = useState<string>('');
  const [chatKey, setChatKey] = useState(0);
  // NEW: State to track the selected AI agent
  const [selectedAgent, setSelectedAgent] = useState<'classic' | 'web' | 'image'>('classic');

  const agentOptions = [
    { value: 'classic', label: 'Classic Offset Agent', icon: <BrainCircuit className="w-5 h-5 mr-2" /> },
    { value: 'web', label: 'Gemini Web Search', icon: <Globe className="w-5 h-5 mr-2" /> },
    { value: 'image', label: 'Image Creator', icon: <ImageIcon className="w-5 h-5 mr-2" /> },
  ];

  const abilities = {
    classic: [
        { icon: <Users />, text: "Get customer, order, and payment details" },
        { icon: <LineChart />, text: "Generate financial and stock reports" },
        { icon: <PenSquare />, text: "Create new customers via chat" },
        { icon: <Edit />, text: "Log new business expenses" },
        { icon: <ShoppingCart />, text: "Analyze top customers and products" },
    ],
    web: [
        { icon: <Globe />, text: "Answer general knowledge questions" },
        { icon: <Globe />, text: "Provide real-time information" },
        { icon: <Globe />, text: "Summarize articles and web pages" },
    ],
    image: [
        { icon: <ImageIcon />, text: "Create logos and brand assets" },
        { icon: <ImageIcon />, text: "Design prototype wedding cards" },
        { icon: <ImageIcon />, text: "Generate social media post images" },
    ]
  };

  const conversationStarters = {
      classic: [
        "Who are my top 3 customers?",
        "Show me payments for customer Lukman",
        "Create a new customer: Ravi, 9876543210, Salem",
        "Log an expense of 250 for staff lunch to Arun",
      ],
      web: [
        "What are the latest trends in wedding card designs for 2024?",
        "Who are the main paper suppliers in the Sivakasi region?",
        "Translate 'Your order is ready for pickup' to Hindi.",
      ],
      image: [
        "Create a minimalist logo for 'Classic Offset Printing'",
        "Generate a prototype for a modern wedding card with a floral theme",
        "Create an Instagram post image for a new printing offer",
      ]
  };
  
  const handleStarterClick = (prompt: string) => {
    setStarterPrompt(prompt);
  };
  
  const handleResetClick = () => {
    setStarterPrompt('');
    setChatKey(prevKey => prevKey + 1);
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgent(e.target.value as 'classic' | 'web' | 'image');
    handleResetClick(); // Reset chat when agent changes
  }

  const currentAbilities = abilities[selectedAgent];
  const currentStarters = conversationStarters[selectedAgent];

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        <div className="text-center mb-6">
          <Bot className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            AI Assistant Suite
          </h1>
          {/* Agent Selector Dropdown */}
          <div className="max-w-xs mx-auto">
            <Select
                id="agent-selector"
                value={selectedAgent}
                onChange={handleAgentChange}
                options={agentOptions}
                aria-label="Select AI Agent"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Abilities of {agentOptions.find(a => a.value === selectedAgent)?.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentAbilities.map((ability, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-indigo-500">{ability.icon}</div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ability.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Conversation Starters:</h3>
              <button onClick={handleResetClick} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold">
                <RefreshCw className="w-4 h-4" /> New Chat
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {currentStarters.map((starter, index) => (
                <button key={index} onClick={() => handleStarterClick(starter)} className="p-3 text-sm text-center bg-white dark:bg-gray-800 shadow-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  {starter}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[500px]">
            <GeminiChat 
                key={chatKey} 
                starterPrompt={starterPrompt} 
                agentType={selectedAgent} // Pass the selected agent type
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
