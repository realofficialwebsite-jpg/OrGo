import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I am the OrGo Smart Assistant. How can I help you with your home services today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // API Key Setup (CRITICAL FOR VERCEL)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error("API Key is missing.");
      }

      // Using the required @google/genai SDK
      const ai = new GoogleGenAI({ apiKey });
      
      // Map history to ensure strict alternation
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Using the required updated model
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: "You are the OrGo Smart Assistant. Be polite, concise, and suggest home services based on the user's problem.",
        }
      });

      if (response.text) {
        const textResponse = response.text;
        setMessages(prev => [...prev, { role: 'model', text: textResponse }]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 right-5 w-[350px] max-w-[calc(100vw-40px)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100] flex flex-col h-[500px] max-h-[70vh]"
      >
        {/* Header */}
        <div className="bg-red-600 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">OrGo AI</h3>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Smart Assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-red-100' : 'bg-white shadow-sm border border-gray-100'}`}>
                {msg.role === 'user' ? <UserIcon size={14} className="text-red-600" /> : <Bot size={14} className="text-red-600" />}
              </div>
              <div 
                className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-red-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm border border-gray-100">
                <Bot size={14} className="text-red-600" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="text-red-600 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 focus-within:border-red-200 focus-within:bg-white transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none px-3 py-2 text-sm focus:outline-none text-gray-700"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-colors shrink-0"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
