/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import Markdown from 'react-markdown';
import { 
  BookOpen, 
  Calculator, 
  FlaskConical, 
  BrainCircuit, 
  User, 
  Settings, 
  LogOut, 
  Sparkles,
  ChevronRight,
  Loader2,
  GraduationCap,
  Send,
  Mic,
  MicOff,
  X,
  ArrowLeft
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Subject = 'English' | 'Math' | 'Science' | 'Quiz' | null;
type Grade = '1' | '2' | '3' | '4' | '5';

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}

export default function App() {
  // User State
  const [name, setName] = useState<string>('');
  const [grade, setGrade] = useState<Grade>('1');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Settings State
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // Chat State
  const [currentSubject, setCurrentSubject] = useState<Subject>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load from storage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('tutor_name');
    const savedGrade = localStorage.getItem('tutor_grade') as Grade;
    const savedKey = localStorage.getItem('tutor_key');
    
    if (savedName) setName(savedName);
    if (savedGrade) setGrade(savedGrade);
    if (savedKey) setApiKey(savedKey);
    
    if (savedName && savedGrade) {
      setIsLoggedIn(true);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name!');
      return;
    }
    
    localStorage.setItem('tutor_name', name);
    localStorage.setItem('tutor_grade', grade);
    setIsLoggedIn(true);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('tutor_name');
    localStorage.removeItem('tutor_grade');
    setIsLoggedIn(false);
    setName('');
    setGrade('1');
    setCurrentSubject(null);
    setMessages([]);
  };

  const saveApiKey = () => {
    localStorage.setItem('tutor_key', apiKey);
    setIsSettingsOpen(false);
  };

  const startChat = async (subject: Subject) => {
    if (!subject) return;
    
    setCurrentSubject(subject);
    setIsLoading(true);
    setError(null);
    
    const initialMessages: Message[] = [];
    setMessages(initialMessages);

    try {
      const activeKey = apiKey.trim() || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        setIsSettingsOpen(true);
        throw new Error('Please set your Gemini API Key in Settings first!');
      }

      const genAI = new GoogleGenAI({ apiKey: activeKey });
      
      const systemInstruction = `You are a friendly, patient elementary school teacher for Grade ${grade} students. 
      Use simple words, emojis, and stay strictly on the topic of ${subject}.
      Your goal is to be a tutor. 
      1. Start by introducing yourself as the Grade ${grade} ${subject} tutor.
      2. Ask exactly ONE fun question to start.
      3. When the student answers, validate it (praise if correct, gentle correction if wrong).
      4. Explain the 'Why' in very simple terms for a child.
      5. Ask the NEXT follow-up question to keep the loop going once student answert correctly to the question which you asked.
      Keep your responses relatively short and very engaging.`;

      const prompt = `Hi! I'm ${name}, a Grade ${grade} student. I'm ready to learn ${subject}!`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "Hi! I'm your tutor. Ready for a question?";
      setMessages([{ role: 'model', text: aiText }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userText = userInput.trim();
    setUserInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const activeKey = apiKey.trim() || process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenAI({ apiKey: activeKey! });
      
      const systemInstruction = `You are a friendly, patient elementary school teacher for Grade ${grade} students. 
      Use simple words, emojis, and stay strictly on the topic of ${currentSubject}.
      Validate the student's answer, explain why, and ask the next question.`;

      // Format history for the API
      const history = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseStream = await genAI.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: history,
        config: {
          systemInstruction,
          temperature: 0.7,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      let fullText = "";
      // Add an empty model message that we will populate
      setMessages([...newMessages, { role: 'model', text: "" }]);

      for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if (chunkText) {
          if (fullText === "") {
            setIsLoading(false);
          }
          fullText += chunkText;
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0 && updated[updated.length - 1].role === 'model') {
              updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullText };
            }
            return updated;
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Voice Recognition
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };

    recognition.start();
  };

  // --- UI Components ---

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-6 border-4 border-[#FDE68A] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FEF3C7] rounded-full opacity-50" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FEF3C7] rounded-full opacity-50" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10" /> {/* Spacer */}
              <div className="bg-[#FCD34D] p-3 rounded-2xl">
                <GraduationCap size={40} className="text-[#92400E]" />
              </div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 bg-[#FEF3C7] rounded-full text-[#92400E] hover:bg-[#FDE68A] transition-colors shadow-sm"
              >
                <Settings size={20} />
              </button>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-[#92400E] mb-1">Kids Tutor</h1>
            <p className="text-center text-[#B45309] mb-6 text-sm">Ready for a fun learning adventure?</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#92400E] mb-1.5 flex items-center gap-2">
                  <User size={14} /> What's your name?
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#FDE68A] focus:border-[#FCD34D] focus:ring-0 outline-none transition-all text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#92400E] mb-1.5 flex items-center gap-2">
                  <GraduationCap size={14} /> Which grade are you in?
                </label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#FDE68A] focus:border-[#FCD34D] focus:ring-0 outline-none transition-all text-base bg-white"
                >
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                </select>
              </div>

              {error && (
                <div className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-[#FCD34D] hover:bg-[#FBBF24] text-[#92400E] font-bold py-3 rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
              >
                Start Learning! <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border-4 border-[#FDE68A]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#92400E]">Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-[#92400E] hover:bg-[#FEF3C7] p-1 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#92400E] mb-2">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full px-4 py-2 rounded-xl border-2 border-[#FDE68A] outline-none"
                  />
                </div>
                <button 
                  onClick={saveApiKey}
                  className="w-full bg-[#FCD34D] text-[#92400E] font-bold py-3 rounded-xl shadow-md hover:bg-[#FBBF24]"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#CCFBF1] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => currentSubject ? setCurrentSubject(null) : handleLogout()}
            className="p-2 hover:bg-[#F0FDFA] rounded-full text-[#134E4A]"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="bg-[#5EEAD4] p-2 rounded-lg hidden sm:block">
            <Sparkles size={24} className="text-[#134E4A]" />
          </div>
          <h2 className="text-xl font-bold text-[#134E4A]">
            {currentSubject ? `${currentSubject} Tutor` : 'Kids Tutor'}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#F0FDFA] px-4 py-2 rounded-full border border-[#99F6E4]">
            <div className="w-8 h-8 bg-[#2DD4BF] rounded-full flex items-center justify-center text-white font-bold">
              {name[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-[#134E4A] hidden sm:inline">Grade {grade}</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-[#F0FDFA] text-[#134E4A] rounded-full"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col overflow-hidden">
        {!currentSubject ? (
          <>
            {/* Welcome Section */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-5xl font-black text-[#134E4A] mb-4">
                Hi {name}! 👋
              </h1>
              <p className="text-xl text-[#0F766E]">What do you want to learn today?</p>
            </div>

            {/* Subject Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <SubjectButton 
                title="English" 
                icon={<BookOpen size={32} />} 
                color="bg-[#DBEAFE]" 
                hoverColor="hover:bg-[#BFDBFE]"
                textColor="text-[#1E40AF]"
                borderColor="border-[#BFDBFE]"
                onClick={() => startChat('English')}
                isActive={false}
              />
              <SubjectButton 
                title="Math" 
                icon={<Calculator size={32} />} 
                color="bg-[#FEF3C7]" 
                hoverColor="hover:bg-[#FDE68A]"
                textColor="text-[#92400E]"
                borderColor="border-[#FDE68A]"
                onClick={() => startChat('Math')}
                isActive={false}
              />
              <SubjectButton 
                title="Science" 
                icon={<FlaskConical size={32} />} 
                color="bg-[#DCFCE7]" 
                hoverColor="hover:bg-[#BBF7D0]"
                textColor="text-[#166534]"
                borderColor="border-[#BBF7D0]"
                onClick={() => startChat('Science')}
                isActive={false}
              />
              <SubjectButton 
                title="Quiz" 
                icon={<BrainCircuit size={32} />} 
                color="bg-[#F3E8FF]" 
                hoverColor="hover:bg-[#E9D5FF]"
                textColor="text-[#6B21A8]"
                borderColor="border-[#E9D5FF]"
                onClick={() => startChat('Quiz')}
                isActive={false}
              />
            </div>
          </>
        ) : (
          /* Chat Interface */
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-xl border-4 border-[#CCFBF1] overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-5 py-3 rounded-2xl shadow-sm",
                    msg.role === 'user' 
                      ? "bg-[#2DD4BF] text-white rounded-tr-none" 
                      : "bg-[#F0FDFA] text-[#134E4A] rounded-tl-none border border-[#CCFBF1]"
                  )}>
                    <div className="markdown-body prose prose-sm max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#99F6E4] mt-1 font-bold uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'Tutor'}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-[#2DD4BF] font-bold animate-pulse">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Tutor is thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[#F0FDFA] border-t-4 border-[#CCFBF1]">
              <form onSubmit={sendMessage} className="flex gap-2">
                <button 
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "p-3 rounded-xl transition-all shadow-md",
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-white text-[#134E4A] hover:bg-[#CCFBF1]"
                  )}
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <input 
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your answer here..."
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-[#CCFBF1] focus:border-[#2DD4BF] outline-none shadow-inner"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !userInput.trim()}
                  className="p-3 bg-[#2DD4BF] text-white rounded-xl shadow-md hover:bg-[#14B8A6] disabled:opacity-50 disabled:hover:bg-[#2DD4BF] transition-all"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal (Same as login) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border-4 border-[#FDE68A]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#92400E]">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[#92400E] hover:bg-[#FEF3C7] p-1 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#92400E] mb-2">Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#FDE68A] outline-none"
                />
              </div>
              <button 
                onClick={saveApiKey}
                className="w-full bg-[#FCD34D] text-[#92400E] font-bold py-3 rounded-xl shadow-md hover:bg-[#FBBF24]"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SubjectButtonProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  textColor: string;
  borderColor: string;
  onClick: () => void;
  isActive: boolean;
}

function SubjectButton({ title, icon, color, hoverColor, textColor, borderColor, onClick, isActive }: SubjectButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-[2rem] border-4 transition-all transform active:scale-95 shadow-lg",
        color,
        hoverColor,
        textColor,
        isActive ? "ring-4 ring-[#2DD4BF] scale-105" : borderColor,
        "group"
      )}
    >
      <div className="mb-4 transform group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-2xl font-black">{title}</span>
    </button>
  );
}
