import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface AudioVisualizerProps {
  isActive: boolean;
}

export function AudioVisualizer({ isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const bars = 30;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isActive) {
        // Flat line when inactive
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      const barWidth = canvas.width / bars;
      
      for (let i = 0; i < bars; i++) {
        // Random height for visualization effect
        const height = Math.random() * (canvas.height / 2);
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;
        
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.5 + 0.5})`;
        ctx.fillRect(x, y, barWidth - 2, height);
      }
      
      animationId = requestAnimationFrame(draw);
    };

    if (isActive) {
      draw();
    } else {
      // Draw static line once
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    return () => cancelAnimationFrame(animationId);
  }, [isActive]);

  return (
    <div className="w-full h-12 bg-black/50 border border-primary/20 rounded relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={50} 
        className="w-full h-full"
      />
    </div>
  );
}
