import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Loader2, ShoppingBag } from 'lucide-react';
import { APP_CATEGORIES } from '../src/constants';
import { useCart } from '../src/CartContext';
import { AppView, ServiceItem } from '../src/types';

interface Message {
  role: 'user' | 'model';
  text: string;
  suggestedService?: ServiceItem;
}

interface ChatbotProps {
  userName: string;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ userName, onNavigate, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  const allServices: ServiceItem[] = APP_CATEGORIES.flatMap(cat => 
    cat.subCategories.flatMap(sub => sub.items)
  );

  const systemPrompt = `You are the OrGo Assistant. You help users find the right home service. 
Our services include: ${allServices.map(s => `${s.title} (Price: ₹${s.price})`).join(', ')}. 
If a user describes a problem, suggest the correct service and tell them the price. 
Be polite and concise. 
Greet the user by their name: ${userName}.
When you suggest a service, make sure to mention the EXACT service title from the list above so I can identify it.`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // @ts-ignore
const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(key);
      
      
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
      });

      const aiText = response.text || "I'm sorry, I couldn't process that.";
      
      // Try to find a suggested service in the text
      const suggestedService = allServices.find(s => 
        aiText.toLowerCase().includes(s.title.toLowerCase())
      );

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: aiText,
        suggestedService 
      }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = (service: ServiceItem) => {
    addToCart(service);
    onNavigate(AppView.CHECKOUT);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md h-[600px] bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-gradient-to-br from-red-600 to-red-700 text-white flex justify-between items-center rounded-t-[40px]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">OrGo AI</h3>
                  <p className="text-[11px] opacity-90 uppercase tracking-[0.25em] font-black">Smart Assistant</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-95">
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-red-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-red-100 shadow-inner">
                    <Sparkles className="text-red-600" size={48} />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-3">Hello {userName}!</h4>
                  <p className="text-sm text-gray-500 font-bold px-8 leading-relaxed">I'm your OrGo AI assistant. Tell me what's wrong and I'll find the perfect service for you.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-6 rounded-3xl ${
                    m.role === 'user' 
                      ? 'bg-red-600 text-white rounded-tr-none shadow-xl shadow-red-600/20' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
                  }`}>
                    <p className="text-[15px] font-medium leading-relaxed">{m.text}</p>
                    {m.suggestedService && (
                      <button
                        onClick={() => handleBookNow(m.suggestedService!)}
                        className="mt-5 w-full py-4 bg-white text-red-600 rounded-2xl text-sm font-black flex items-center justify-center gap-3 hover:bg-red-50 transition-all shadow-sm border border-red-100"
                      >
                        <ShoppingBag size={18} />
                        Book {m.suggestedService.title}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-6 rounded-3xl rounded-tl-none shadow-sm border border-gray-200">
                    <Loader2 className="animate-spin text-red-600" size={24} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-100 rounded-b-[40px]">
              <div className="flex gap-3 bg-gray-50 p-2 rounded-3xl border border-gray-100 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent px-4 py-3 text-sm font-bold focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={22} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
