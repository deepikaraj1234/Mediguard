import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  Paperclip, 
  AlertTriangle, 
  Shield, 
  User, 
  Bot,
  Loader2,
  Info,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  MapPin,
  Search as SearchIcon,
  MicOff,
  X,
  PhoneCall,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Modality, LiveServerMessage, ThinkingLevel } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'grounding';
  imageUrl?: string;
  groundingUrls?: { uri: string; title: string }[];
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm MediGuard AI, your virtual health assistant. How can I help you today? \n\n*Disclaimer: I am an AI, not a doctor. In case of emergency, please call your local emergency services immediately.*" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9'>('1:1');
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMicError, setShowMicError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live API Refs
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearConversation = () => {
    setMessages([
      { role: 'assistant', content: "Hello! I'm MediGuard AI, your virtual health assistant. How can I help you today? \n\n*Disclaimer: I am an AI, not a doctor. In case of emergency, please call your local emergency services immediately.*" }
    ]);
    setShowClearConfirm(false);
    stopSpeaking();
  };

  const stopSpeaking = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop();
      currentAudioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const ensureApiKey = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        return true;
      }
      return true;
    }
    return true;
  };

  const speak = async (text: string) => {
    if (!isTtsEnabled) return;
    stopSpeaking();
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this clearly and professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playRawAudio(base64Audio);
      }
    } catch (err) {
      console.error("TTS Error:", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        const isVideo = mimeType.startsWith('video/');
        const isImage = mimeType.startsWith('image/');

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        let prompt = "";
        if (isImage) prompt = "Analyze this medical image. What do you see? Provide a professional assessment and any relevant health advice. Remind the user you are an AI.";
        if (isVideo) prompt = "Analyze this medical video. Describe the key actions or findings. Provide a professional assessment and remind the user you are an AI.";

        if (!isImage && !isVideo) {
          setMessages(prev => [...prev, { role: 'assistant', content: "Please upload an image or video for analysis." }]);
          setIsLoading(false);
          return;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt }
            ]
          }
        });

        const text = response.text;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: text || "I couldn't analyze the file.",
        }]);
        if (text) speak(text.substring(0, 300));
      };
    } catch (err) {
      console.error("File Analysis Error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error analyzing file." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const isImageRequest = /generate|show|create|draw|image|diagram/i.test(userMsg);
      const isVideoRequest = /video|animate|movie/i.test(userMsg);
      const isLocationRequest = /nearby|clinic|hospital|pharmacy|doctor near|location|where is/i.test(userMsg);
      
      if (isImageRequest) {
        await ensureApiKey();
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: `Create a professional medical illustration or diagram for: ${userMsg}. Keep it clean, accurate, and educational.` }] },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize
            }
          }
        });

        let imageUrl = '';
        let responseText = '';
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseText += part.text;
          }
        }

        if (imageUrl) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: responseText || "I've generated a medical illustration for you:", 
            type: 'image',
            imageUrl 
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: responseText || "I couldn't generate the image at this moment." }]);
        }
      } else if (isVideoRequest) {
        await ensureApiKey();
        setMessages(prev => [...prev, { role: 'assistant', content: "Generating your medical animation. This may take a minute..." }]);
        
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: `A professional medical animation showing: ${userMsg}. Educational, clear, and accurate.`,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio.includes('9:16') ? '9:16' : '16:9'
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `I've generated the video for you. [Download Video](${downloadLink})` 
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: "Video generation failed." }]);
        }
      } else {
        // Standard chat
        let modelName = "gemini-3-flash-preview";
        if (isDeepThinking) modelName = "gemini-3.1-pro-preview";
        if (isLocationRequest) modelName = "gemini-2.5-flash";
        
        const tools: any[] = [{ googleSearch: {} }];
        if (isLocationRequest) tools.push({ googleMaps: {} });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: "user", parts: [{ text: `SYSTEM INSTRUCTION: You are MediGuard AI, a highly advanced medical assistant specialized for the Indian healthcare context. 
            Your goals:
            1. Provide safe symptom guidance.
            2. Detect emergencies (red flags) and immediately advise calling Indian emergency services (Dial 108 for Ambulance, 112 for General Emergency).
            3. Always include a medical disclaimer.
            4. Use Google Search for up-to-date medical info if needed.
            5. Use Google Maps if the user asks for nearby clinics, hospitals (like AIIMS, Apollo, Fortis), or pharmacies in India.
            
            User Message: ${userMsg}` }] }
          ],
          config: {
            tools: tools,
            thinkingConfig: isDeepThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined
          },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const urls = groundingChunks?.map((c: any) => c.web || c.maps).filter(Boolean);

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: text || "I'm sorry, I couldn't process that.",
          groundingUrls: urls
        }]);
        
        if (text) speak(text.substring(0, 500));
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      }
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startTranscription = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsLoading(true);
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: {
                parts: [
                  { inlineData: { mimeType: "audio/webm", data: base64Audio } },
                  { text: "Transcribe this medical query accurately." }
                ]
              }
            });
            const transcription = response.text;
            if (transcription) {
              setInput(transcription);
              handleSend(transcription);
            }
          } catch (err) {
            console.error("Transcription Error:", err);
          } finally {
            setIsLoading(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowMicError(false);
    } catch (err: any) {
      console.error("Mic Error:", err);
      setShowMicError(true);
      setIsRecording(false);
    }
  };

  const stopTranscription = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Live Mode Implementation ---
  const toggleLiveMode = async () => {
    if (isLiveMode) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsLiveMode(false);
      return;
    }

    setIsLiveMode(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Use a variable that can be accessed in the closure
      let sessionPromise: Promise<any>;

      sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are MediGuard Live Assistant for India. You provide real-time, empathetic medical guidance. Detect emergencies immediately and advise dialing 108. Always include a disclaimer that you are an AI.",
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            // Use queueMicrotask to ensure sessionPromise is assigned before access
            queueMicrotask(async () => {
              const session = await sessionPromise;
              setupAudioCapture(session);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playRawAudio(base64Audio);
            }
          },
          onclose: () => setIsLiveMode(false),
          onerror: (err) => {
            console.error("Live Error:", err);
            setIsLiveMode(false);
          }
        }
      });
      
      liveSessionRef.current = await sessionPromise;
      setShowMicError(false);
    } catch (err: any) {
      console.error("Live Connect Error:", err);
      setShowMicError(true);
      setIsLiveMode(false);
    }
  };

  const setupAudioCapture = async (session: any) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule('data:text/javascript;base64,' + btoa(`
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0][0];
          if (input) {
            this.port.postMessage(input);
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `));

    const source = audioContext.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(audioContext, 'audio-processor');
    audioWorkletRef.current = worklet;

    worklet.port.onmessage = (event) => {
      const float32Data = event.data;
      const int16Data = new Int16Array(float32Data.length);
      for (let i = 0; i < float32Data.length; i++) {
        int16Data[i] = Math.max(-1, Math.min(1, float32Data[i])) * 0x7FFF;
      }
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
      session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    source.connect(worklet);
    worklet.connect(audioContext.destination);
  };

  const playRawAudio = async (base64Data: string) => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 0x7FFF;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] m-4 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">MediGuard AI Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDeepThinking(!isDeepThinking)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs ${isDeepThinking ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            title="Enable Deep Reasoning Mode"
          >
            <Shield className="w-4 h-4" />
            {isDeepThinking ? 'Deep Thinking ON' : 'Deep Thinking'}
          </button>
          <button 
            onClick={() => setIsTtsEnabled(!isTtsEnabled)}
            className={`p-2 rounded-xl transition-all ${isTtsEnabled ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}
            title={isTtsEnabled ? "Disable Voice Response" : "Enable Voice Response"}
          >
            {isTtsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleLiveMode}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            Live Assistant
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Clear Conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                
                {msg.type === 'image' && msg.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 shadow-lg">
                    <img src={msg.imageUrl} alt="Medical Illustration" className="w-full h-auto" />
                  </div>
                )}

                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <SearchIcon className="w-3 h-3" /> Sources & Locations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingUrls.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg text-xs font-medium border border-slate-100 transition-colors"
                        >
                          {url.uri.includes('maps') ? <MapPin className="w-3 h-3" /> : <SearchIcon className="w-3 h-3" />}
                          {url.title || 'View Source'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
                <span className="text-sm text-slate-500 font-medium">
                  {isDeepThinking ? 'Thinking deeply...' : 'Analyzing symptoms...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          {/* Image Settings Popover */}
          <AnimatePresence>
            {showImageSettings && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Image & Video Generation Settings
                  </h4>
                  <button onClick={() => setShowImageSettings(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolution</label>
                    <div className="flex gap-2">
                      {(['1K', '2K', '4K'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setImageSize(size)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            imageSize === size ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="w-full bg-slate-50 border-none rounded-lg text-xs font-medium py-1.5 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="4:3">4:3 Standard</option>
                      <option value="3:4">3:4 Portrait</option>
                      <option value="16:9">16:9 Widescreen</option>
                      <option value="9:16">9:16 Story</option>
                      <option value="2:3">2:3 Portrait</option>
                      <option value="3:2">3:2 Landscape</option>
                      <option value="21:9">21:9 Ultra-wide</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl group-focus-within:bg-emerald-500/10 transition-all" />
            <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Upload Image/Video for Analysis"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowImageSettings(!showImageSettings)}
                className={`p-2 rounded-xl transition-all ${showImageSettings ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                title="Image/Video Settings"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <textarea
                rows={1}
                placeholder="Describe symptoms, ask for clinics, or say 'Draw a heart'..."
                className="flex-1 bg-transparent border-none focus:ring-0 py-2 px-2 text-slate-700 resize-none min-h-[40px] max-h-[200px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <button 
                  onMouseDown={startTranscription}
                  onMouseUp={stopTranscription}
                  onMouseLeave={stopTranscription}
                  className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-emerald-600'}`}
                  title="Hold to speak"
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> End-to-End Encrypted</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not for Emergencies</span>
          </div>
        </div>
      </div>

      {/* Live Mode Overlay */}
      <AnimatePresence>
        {isLiveMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-900/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-white p-8"
          >
            <button 
              onClick={toggleLiveMode}
              className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative">
              <div className="w-48 h-48 bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-32 h-32 bg-emerald-500/40 rounded-full flex items-center justify-center animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="w-20 h-20 text-white" />
                </div>
              </div>
            </div>

            <div className="mt-12 text-center space-y-4">
              <h3 className="text-3xl font-bold">MediGuard Live</h3>
              <p className="text-emerald-100/80 max-w-md">Speak naturally with your AI health assistant. I'm listening and ready to help.</p>
              
              <div className="flex items-center justify-center gap-2 mt-8">
                <div className="w-1 h-8 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_0ms]" />
                <div className="w-1 h-12 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1 h-16 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_400ms]" />
                <div className="w-1 h-12 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_600ms]" />
                <div className="w-1 h-8 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_800ms]" />
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10 w-full max-w-sm flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-emerald-200/50">
              <Shield className="w-4 h-4" />
              Real-time Medical Guidance
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Clear Conversation?</h3>
              <p className="text-slate-500 mb-8">This will permanently remove all messages from this session. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={clearConversation}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Microphone Permission Error Modal */}
      <AnimatePresence>
        {showMicError && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              <button 
                onClick={() => setShowMicError(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                <MicOff className="w-10 h-10 text-red-600" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-3">Microphone Access Denied</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                MediGuard needs microphone access for voice features. It looks like the permission was blocked or dismissed.
              </p>

              <div className="space-y-4 mb-8">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">How to enable:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">1</div>
                    <p className="text-sm text-slate-600">Click the <span className="font-bold text-slate-900">Lock icon</span> (🔒) in your browser's address bar.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">2</div>
                    <p className="text-sm text-slate-600">Find <span className="font-bold text-slate-900">Microphone</span> and toggle it to <span className="font-bold text-emerald-600">Allow</span>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">3</div>
                    <p className="text-sm text-slate-600">Refresh the page to apply changes.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Refresh Page
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
