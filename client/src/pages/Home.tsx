import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useChatHistory, useSendMessage, useClearChat } from "@/hooks/use-chat";
import { CyberButton } from "@/components/CyberButton";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Trash2, Volume2, VolumeX, Radio, LogOut, User as UserIcon, Layout } from "lucide-react";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAuth } from "@/hooks/use-auth";
import { useOllamaStatus } from "@/hooks/use-ollama";

// Helper to clean text for TTS
const cleanTextForSpeech = (text: string) => {
  return text.replace(/[*_#`]/g, ''); // Remove markdown characters
};

import alkulousVideo from "@assets/Video_Generation_of_Alkulous_Greeting_1768059883566.mp4";
import cyberpunkBg from "@assets/generated_images/cyberpunk_lab_background_without_people.png";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: ollamaStatus } = useOllamaStatus();
  const [inputValue, setInputValue] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [useOllama, setUseOllama] = useState(false);
  const [useLocalBrain, setUseLocalBrain] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: history, isLoading: historyLoading } = useChatHistory();
  const sendMessageMutation = useSendMessage();
  const clearChatMutation = useClearChat();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Avatar state logic
  const getAvatarState = () => {
    if (sendMessageMutation.isPending) return "thinking";
    if (listening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  };

  // Sync speech recognition input
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Handle voice input stop
  useEffect(() => {
    if (!listening && transcript.length > 0) {
      handleSend(transcript);
      resetTranscript();
    }
  }, [listening]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Voice Output (TTS)
  const speak = (text: string) => {
    if (!ttsEnabled) return;
    
    // Extract visible text (remove tags)
    const visibleText = text.replace(/\[ANIMATION_START\]|\[ANIMATION_STOP\]/g, '');
    
    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(visibleText));
    
    // Attempt to find a "technological" or "deep" voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0];
    
    utterance.voice = preferredVoice;
    utterance.pitch = 0.8; // Slightly deeper
    utterance.rate = 1.1;  // Slightly faster
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    sendMessageMutation.mutate({ message: text, useOllama, useLocalBrain }, {
      onSuccess: (data) => {
        setInputValue("");
        // Text is already added to history and will be rendered by the list
        speak(data.response);
      }
    });
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  return (
    <div className="min-h-screen text-foreground overflow-hidden font-body relative">
      <div className="static-background" />
      <div className="video-overlay" />
      
      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10 scanline" />
      
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HUD Header */}
      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-40 border-b border-primary/50 bg-white/10 backdrop-blur-xl shadow-[0_4px_30px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Radio className="text-primary animate-pulse" />
            <h1 className="text-2xl tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">ALKULOUS <span className="text-primary text-xs align-top">SYS.AI.01</span></h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-4 ml-8">
            <button className="text-xs font-mono text-white hover:text-primary transition-colors border-b-2 border-primary pb-1">CONSOLE</button>
            <Link href="/admin" asChild>
              <a className="text-xs font-mono text-white/80 hover:text-primary transition-colors">ADMIN</a>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2 text-white">
                  <UserIcon className="w-3 h-3" />
                  <span className="text-[10px] font-mono uppercase tracking-tighter">{user?.email?.split('@')[0] || 'USER'}</span>
                </div>
                <button 
                  onClick={() => logout()}
                  className="text-xs font-mono text-white/80 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  LOGOUT
                </button>
              </div>
            ) : (
              <button 
                className="text-xs font-mono text-white/80 hover:text-primary transition-colors pb-1" 
                onClick={() => window.location.href = '/auth'}
              >
                LOGIN / REGISTER
              </button>
            )}
          </nav>
        </div>
        <div className="flex gap-4 items-center">
            <button 
                onClick={() => setUseLocalBrain(!useLocalBrain)}
                className={cn(
                    "px-2 py-1 border text-[10px] font-mono transition-all",
                    useLocalBrain ? "border-primary bg-primary/20 text-white shadow-[0_0_10px_rgba(255,0,0,0.3)]" : "border-white/20 text-white/40"
                )}
                title="Toggle Local AI Brain"
            >
                BRAIN: {useLocalBrain ? 'ACTIVE' : 'OFF'}
            </button>
            <button 
                onClick={() => setUseOllama(!useOllama)}
                disabled={!ollamaStatus?.available}
                className={cn(
                    "px-2 py-1 border text-[10px] font-mono transition-all flex items-center gap-1",
                    !ollamaStatus?.available ? "border-white/10 text-white/20 cursor-not-allowed" :
                    useOllama ? "border-primary bg-primary/20 text-white shadow-[0_0_10px_rgba(255,0,0,0.3)]" : "border-white/20 text-white/40 hover:border-white/40"
                )}
                title={ollamaStatus?.available 
                    ? `Ollama (${ollamaStatus?.currentModel || 'gemma3:4b'})` 
                    : ollamaStatus?.message || "Ollama not available"
                }
            >
                <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    ollamaStatus?.available ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                OLLAMA: {!ollamaStatus?.available ? 'OFFLINE' : useOllama ? 'ACTIVE' : 'READY'}
            </button>
            <button 
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className="text-white hover:text-primary transition-colors"
            >
                {ttsEnabled ? <Volume2 /> : <VolumeX />}
            </button>
            <div className="text-xs font-mono text-white/80">
                STATUS: <span className="text-primary">ONLINE</span>
            </div>
        </div>
      </header>

      <main className="container mx-auto h-screen pt-24 pb-8 flex flex-col md:flex-row gap-8 items-center justify-center relative z-10">
        
        {/* Left/Top: Avatar & Visualization */}
        <section className="flex-1 w-full flex flex-col items-center justify-center gap-8">
            <AvatarDisplay state={getAvatarState()} />
            
            <div className="w-full max-w-md px-4">
                <AudioVisualizer isActive={listening || isSpeaking} />
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-4xl md:text-5xl text-white font-display">
                    <span className="text-primary">ALKULOUS</span> SYS.AI.01
                </h2>
                <p className="text-primary/60 font-mono text-sm tracking-widest">
                    AWAITING INPUT_
                </p>
            </div>
        </section>

        {/* Right/Bottom: Chat Interface */}
        <section className="w-full md:w-[450px] h-[500px] md:h-[600px] flex flex-col bg-black/40 border border-primary/20 backdrop-blur-md relative overflow-hidden group">
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

            {/* Header */}
            <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-primary/5">
                <span className="font-mono text-xs text-primary/80">COMMUNICATION_LOG</span>
                <button 
                    onClick={() => clearChatMutation.mutate()}
                    className="text-primary/50 hover:text-primary transition-colors"
                    title="Clear Memory"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                {historyLoading ? (
                    <div className="flex items-center justify-center h-full text-primary/30 animate-pulse font-mono">
                        LOADING_MEMORY_BANKS...
                    </div>
                ) : history && history.length > 0 ? (
                    history.map((msg, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={cn(
                                "max-w-[85%] p-3 rounded-sm border font-mono text-sm leading-relaxed",
                                msg.role === 'user' 
                                    ? "bg-primary/30 border-primary/60 text-white shadow-[0_0_10px_rgba(255,0,0,0.2)]" 
                                    : "bg-white/20 border-white/40 text-white backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            )}>
                                <div className="text-[10px] opacity-50 mb-1 uppercase tracking-wider">
                                    {msg.role === 'user' ? 'OPERATOR' : 'ALKULOUS'}
                                </div>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-primary/30 font-mono text-xs text-center p-8">
                        <div className="w-12 h-12 border border-primary/20 rounded-full flex items-center justify-center mb-4">
                            <div className="w-1 h-1 bg-primary rounded-full animate-ping text-white" />
                        </div>
                        NO_DATA_LOGGED
                        <br />
                        INITIATE_PROTOCOL_
                    </div>
                )}
                
                {sendMessageMutation.isPending && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-secondary/50 border border-primary/20 p-3 rounded-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-primary/40 bg-white/5 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(inputValue);
                    }}
                    className="flex gap-2"
                >
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="ENTER COMMAND..."
                            className="w-full bg-[#2a2a2a] border-2 border-primary/80 p-3 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary focus:bg-black focus:shadow-[0_0_20px_rgba(255,0,0,0.5)] font-mono text-sm transition-all"
                            disabled={sendMessageMutation.isPending}
                        />
                        <div className="absolute right-0 bottom-0 w-3 h-3 bg-primary clip-path-polygon-[100%_100%,0_100%,100%_0]" />
                    </div>

                    {browserSupportsSpeechRecognition && (
                         <CyberButton 
                            type="button" 
                            variant={listening ? "primary" : "outline"}
                            onClick={toggleListening}
                            className={listening ? "animate-pulse" : ""}
                            title="Voice Input"
                         >
                            <Mic className={cn("w-5 h-5", listening && "fill-current")} />
                         </CyberButton>
                    )}

                    <CyberButton 
                        type="submit" 
                        variant="primary"
                        disabled={!inputValue.trim() || sendMessageMutation.isPending}
                    >
                        <Send className="w-5 h-5" />
                    </CyberButton>
                </form>
            </div>
        </section>

      </main>
      
      {/* Decorative footer elements */}
      <div className="fixed bottom-4 left-4 text-[10px] text-primary/30 font-mono">
        SYSTEM_ID: ALK_9000<br/>
        LATENCY: 12ms
      </div>
    </div>
  );
}

// Utility for class merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
