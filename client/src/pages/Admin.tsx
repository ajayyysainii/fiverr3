import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Cpu, Activity, Database, Layout, Mic, Send, Trash2, Volume2, VolumeX, Key, Plus, X } from "lucide-react";
import serverRoomBg from "@assets/generated_images/cyberpunk_server_room_background..png";
import { Link } from "wouter";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { useChatHistory, useSendMessage, useClearChat } from "@/hooks/use-chat";
import { CyberButton } from "@/components/CyberButton";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Helper to clean text for TTS
const cleanTextForSpeech = (text: string) => {
  return text.replace(/[*_#`]/g, ''); // Remove markdown characters
};

// Utility for class merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Admin() {
  const [inputValue, setInputValue] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [useLocalBrain, setUseLocalBrain] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { data: history, isLoading: historyLoading } = useChatHistory();
  const sendMessageMutation = useSendMessage();
  const clearChatMutation = useClearChat();

  const { data: apiKeys, isLoading: keysLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/keys"],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/admin/keys", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
      setNewKeyName("");
      toast({ title: "API Key Created", description: "External access granted." });
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
    }
  });

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const stats = [
    { label: "CORE STATUS", value: "STABLE", icon: Activity, color: "text-emerald-400" },
    { label: "MEMORY LOAD", value: "42.1%", icon: Database, color: "text-blue-400" },
    { label: "AI SYNC", value: "ONLINE", icon: Cpu, color: "text-primary" },
    { label: "SECURITY", value: "LVL 5", icon: Shield, color: "text-orange-400" },
  ];

  const getAvatarState = () => {
    if (sendMessageMutation.isPending) return "thinking";
    if (listening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  };

  useEffect(() => {
    if (transcript) setInputValue(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!listening && transcript.length > 0) {
      handleSend(transcript);
      resetTranscript();
    }
  }, [listening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const speak = (text: string) => {
    if (!ttsEnabled) return;
    const visibleText = text.replace(/\[ANIMATION_START\]|\[ANIMATION_STOP\]/g, '');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(visibleText));
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0];
    utterance.voice = preferredVoice;
    utterance.pitch = 0.8;
    utterance.rate = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendMessageMutation.mutate({ message: text, useLocalBrain }, {
      onSuccess: (data) => {
        setInputValue("");
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
      <div 
        className="fixed inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url(${serverRoomBg})` }}
      />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-1" />
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10 scanline" />

      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-40 border-b border-primary/50 bg-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Settings className="text-primary animate-spin-slow" />
          <h1 className="text-2xl tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">
            ALKULOUS <span className="text-primary text-xs align-top">ADMIN.IF.01</span>
          </h1>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" asChild>
            <a className="text-xs font-mono text-white/80 hover:text-primary transition-colors flex items-center gap-1">
              <Layout className="w-3 h-3" />
              CONSOLES
            </a>
          </Link>
          <button onClick={() => setTtsEnabled(!ttsEnabled)} className="text-white hover:text-primary">
            {ttsEnabled ? <Volume2 /> : <VolumeX />}
          </button>
          <div className="text-xs font-mono text-white/80 border-l border-white/20 pl-6 uppercase">
            ACCESS: <span className="text-primary">REED_GLOBAL_ARCHITECT</span>
          </div>
        </nav>
      </header>

      <main className="container mx-auto h-screen pt-32 pb-8 flex flex-col md:flex-row gap-6 relative z-10 px-4">
        {/* Left: Avatar & Stats */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
            <AvatarDisplay state={getAvatarState()} />
            <div className="w-full max-w-sm">
                <AudioVisualizer isActive={listening || isSpeaking} />
            </div>
            <div className="text-center">
              <h2 className="text-4xl text-white font-display tracking-tighter">
                ALKULOUS <span className="text-primary">CORE</span>
              </h2>
              <p className="text-primary/40 font-mono text-xs tracking-[0.5em] mt-2">SYSTEM_ACTIVE_</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-black/40 border border-primary/20 p-3 rounded-sm">
                <div className="text-[9px] text-white/30 font-mono tracking-widest">{stat.label}</div>
                <div className="text-lg text-white font-mono mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Fine-Tuning & Chat */}
        <section className="w-full md:w-[450px] flex flex-col gap-6">
          {/* API Keys Panel */}
          <div className="h-[200px] bg-black/40 border border-primary/20 backdrop-blur-md flex flex-col relative group">
            <div className="p-3 border-b border-primary/10 flex justify-between items-center bg-primary/5">
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] text-primary/80 uppercase">Access_Keys</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="App Name..."
                  className="flex-1 bg-black/40 border border-primary/20 p-1 text-[10px] text-white/80 font-mono outline-none"
                />
                <button 
                  onClick={() => createKeyMutation.mutate(newKeyName)}
                  disabled={!newKeyName.trim() || createKeyMutation.isPending}
                  className="p-1 border border-primary/40 hover:bg-primary/20 text-primary"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {apiKeys?.map((key) => (
                  <div key={key.id} className="flex items-center justify-between bg-white/5 p-1.5 rounded-sm border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-white/60 font-mono">{key.name}</span>
                      <span className="text-[8px] text-primary font-mono">{key.key}</span>
                    </div>
                    <button 
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      className="text-white/20 hover:text-primary transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fine-Tuning Panel (Smaller) */}
          <div className="h-[200px] bg-black/40 border border-primary/20 backdrop-blur-md flex flex-col relative group">
            <div className="p-3 border-b border-primary/10 flex justify-between items-center bg-primary/5">
              <span className="font-mono text-[10px] text-primary/80 uppercase">Neural_Tuning</span>
              <button 
                onClick={() => setUseLocalBrain(!useLocalBrain)}
                className={cn(
                  "px-2 py-0.5 border text-[8px] font-mono transition-all",
                  useLocalBrain ? "border-primary bg-primary/20 text-white" : "border-white/20 text-white/40"
                )}
              >
                BRAIN: {useLocalBrain ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-white/5 border border-white/10 p-3 rounded-sm space-y-3">
                <textarea 
                  className="w-full bg-black/40 border border-primary/20 p-2 text-xs text-white/80 font-mono focus:border-primary outline-none min-h-[60px]"
                  placeholder="Enter training vector..."
                />
                <div className="flex items-center justify-between">
                   <span className="text-[9px] text-white/40 font-mono">WEIGHT: 0.85</span>
                   <button className="text-[9px] text-primary/60 hover:text-primary uppercase">Sync_</button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface (Same as Home) */}
          <div className="flex-1 bg-black/40 border border-primary/20 backdrop-blur-md flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
            <div className="p-3 border-b border-primary/10 flex justify-between items-center bg-primary/5">
                <span className="font-mono text-[10px] text-primary/80 uppercase">Admin_Comm_Link</span>
                <button onClick={() => clearChatMutation.mutate()} className="text-primary/50 hover:text-primary">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {history?.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={cn(
                            "max-w-[85%] p-3 rounded-sm border font-mono text-xs leading-relaxed",
                            msg.role === 'user' 
                                ? "bg-primary/30 border-primary/60 text-white" 
                                : "bg-white/20 border-white/40 text-white"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                        <div className="bg-primary/10 border border-primary/20 p-2 rounded-sm animate-pulse">
                            <div className="flex gap-1">
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-primary/40 bg-white/5">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="OVERRIDE COMMAND..."
                        className="flex-1 bg-[#1a1a1a] border border-primary/80 p-2 text-white placeholder:text-white/20 focus:outline-none focus:border-primary font-mono text-xs"
                    />
                    {browserSupportsSpeechRecognition && (
                         <CyberButton type="button" variant={listening ? "primary" : "outline"} onClick={toggleListening} size="sm">
                            <Mic className={cn("w-4 h-4", listening && "fill-current")} />
                         </CyberButton>
                    )}
                    <CyberButton type="submit" variant="primary" size="sm" disabled={!inputValue.trim() || sendMessageMutation.isPending}>
                        <Send className="w-4 h-4" />
                    </CyberButton>
                </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
