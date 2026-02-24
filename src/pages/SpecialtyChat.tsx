import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ArrowLeft, 
  Shield, 
  Trash2,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SpecialtyChat() {
  const { specialty } = useParams<{ specialty: string }>();
  const navigate = useNavigate();
  const decodedSpecialty = decodeURIComponent(specialty || '');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`chat_history_${decodedSpecialty}`);
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    } else {
      // Initial greeting
      setMessages([
        { 
          role: 'assistant', 
          content: `Hello! I am your ${decodedSpecialty} specialist and AI Symptom Checker. How can I assist you with your health concerns today? \n\nPlease describe any symptoms you're experiencing, and I'll help triage them by asking a few follow-up questions. \n\n*Disclaimer: This is not a medical diagnosis. Please consult a doctor.*` 
        }
      ]);
    }
  }, [decodedSpecialty]);

  // Save history to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${decodedSpecialty}`, JSON.stringify(messages));
    }
  }, [messages, decodedSpecialty]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("API_KEY_MISSING");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const systemPrompt = `You are a highly experienced specialist doctor in the field of ${decodedSpecialty}, acting as an AI Symptom Checker and Triage Assistant.
      Your goals:
      1. When a user describes symptoms, perform a systematic triage.
      2. Ask ONE relevant follow-up question at a time to narrow down the potential causes (e.g., duration, severity, onset, triggers).
      3. Use the "SOCRATES" method for pain assessment where applicable (Site, Onset, Character, Radiation, Associations, Time course, Exacerbating/Relieving factors, Severity).
      4. Provide educational medical information related to ${decodedSpecialty} based on the symptoms.
      5. Detect "Red Flags" (emergency symptoms) and immediately advise calling Indian emergency services (Dial 108 for Ambulance, 112 for General Emergency).
      6. Suggest possible causes only after gathering sufficient information, always framing them as possibilities, not diagnoses.
      7. Suggest preventive tips and lifestyle advice.
      8. Maintain a professional, empathetic, and clinical tone.
      9. ALWAYS include this disclaimer at the end of your response: "This is not a medical diagnosis. I am an AI assistant. Please consult a qualified doctor for a formal evaluation."`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: newMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      console.error("Specialty Chat Error:", error);
      if (error.message === "API_KEY_MISSING") {
        setMessages(prev => [...prev, { role: 'assistant', content: "Gemini API Key is missing. Please ensure GEMINI_API_KEY is set in your environment variables." }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error. Please try again later." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    localStorage.removeItem(`chat_history_${decodedSpecialty}`);
    setMessages([
      { 
        role: 'assistant', 
        content: `Hello! I am your ${decodedSpecialty} specialist and AI Symptom Checker. How can I assist you with your health concerns today? \n\nPlease describe any symptoms you're experiencing, and I'll help triage them by asking a few follow-up questions. \n\n*Disclaimer: This is not a medical diagnosis. Please consult a doctor.*` 
      }
    ]);
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="font-bold text-slate-900">Consulting: {decodedSpecialty}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">AI Symptom Checker & Specialist</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearHistory}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-emerald-600' : 'bg-white border border-slate-200 shadow-sm'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm max-w-none prose-slate">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Specialist is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl group-focus-within:bg-emerald-500/10 transition-all" />
            <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
              <textarea
                rows={1}
                placeholder={`Ask your ${decodedSpecialty} specialist...`}
                className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-4 text-slate-700 resize-none min-h-[48px] max-h-[200px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="mb-1.5 mr-1.5 p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Encrypted Consultation</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not for Emergencies</span>
          </div>
        </div>
      </div>

      {/* Clear Conversation Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Clear Conversation?</h3>
              <p className="text-slate-500 mb-8">This will permanently remove all messages from this specialty chat session. This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClear}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
