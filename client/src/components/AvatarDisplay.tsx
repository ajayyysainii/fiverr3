import { motion } from "framer-motion";
// Importing image as requested in specs - ensure this path exists in attached_assets
import avatarImage from "@assets/Gemini_Generated_Image_uxp343uxp343uxp3_1768059918218.png";

interface AvatarDisplayProps {
  state: "idle" | "listening" | "thinking" | "speaking";
}

export function AvatarDisplay({ state }: AvatarDisplayProps) {
  // Animation variants for the glow/pulse effect
  const glowVariants = {
    idle: { scale: 1, opacity: 0.5, filter: "brightness(1)" },
    listening: { scale: [1, 1.05, 1], opacity: 0.8, filter: "brightness(1.2)", transition: { repeat: Infinity, duration: 2 } },
    thinking: { scale: [1, 1.1, 1], opacity: 1, filter: "hue-rotate(0deg) brightness(1.5)", transition: { repeat: Infinity, duration: 0.5 } },
    speaking: { scale: [1, 1.02, 1], opacity: 0.9, filter: "brightness(1.3)", transition: { repeat: Infinity, duration: 0.2 } },
  };

  return (
    <div className="relative w-full max-w-md aspect-square mx-auto flex items-center justify-center">
      {/* Background tech circle rings */}
      <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
      <div className="absolute inset-4 border border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      <div className="absolute inset-12 border-2 border-primary/5 rounded-full" />
      
      {/* Central Avatar */}
      <motion.div
        variants={glowVariants}
        animate={state}
        className="relative z-10 w-3/4 h-3/4 rounded-full overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.3)] border-4 border-primary/20"
      >
        <img 
          src={avatarImage} 
          alt="Alkulous Avatar" 
          className="w-full h-full object-cover"
        />
        
        {/* Overlay scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan" />
      </motion.div>

      {/* State label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
        <motion.span 
            key={state}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-display tracking-[0.5em] text-sm uppercase"
        >
          {state}
        </motion.span>
      </div>
    </div>
  );
}
