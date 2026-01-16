import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface CyberButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline";
  glowing?: boolean;
}

export function CyberButton({ 
  children, 
  className, 
  variant = "primary", 
  glowing = false,
  ...props 
}: CyberButtonProps) {
  
  const variants = {
    primary: "bg-primary/10 border-primary text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_20px_theme('colors.primary.DEFAULT')]",
    secondary: "bg-secondary border-secondary-foreground/20 text-secondary-foreground hover:border-secondary-foreground hover:bg-secondary/80",
    outline: "bg-transparent border-primary/50 text-primary hover:border-primary hover:bg-primary/5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative px-6 py-3 border-2 uppercase font-display font-bold tracking-widest text-sm transition-all duration-300",
        "clip-path-polygon-[0_0,100%_0,100%_70%,85%_100%,0_100%]", // Tech shape
        variants[variant],
        glowing && "shadow-[0_0_15px_theme('colors.primary.DEFAULT')]",
        className
      )}
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%)"
      }}
      {...props}
    >
      {/* Decorative tech lines */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
      
      {children}
    </motion.button>
  );
}
