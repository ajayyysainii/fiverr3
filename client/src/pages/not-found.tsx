import { Link } from "wouter";
import { CyberButton } from "@/components/CyberButton";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-primary font-display p-4">
      <div className="relative mb-8">
        <AlertTriangle className="w-24 h-24 text-primary animate-pulse" />
        <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
      </div>
      
      <h1 className="text-6xl font-bold mb-4 tracking-tighter glitch-text">404 ERROR</h1>
      <p className="text-xl text-primary/60 font-mono mb-8 tracking-widest">
        SECTOR_NOT_FOUND // SIGNAL_LOST
      </p>

      <Link href="/" className="inline-block">
        <CyberButton variant="outline">
          RETURN TO BASE
        </CyberButton>
      </Link>
    </div>
  );
}
