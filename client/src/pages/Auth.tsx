import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Radio } from "lucide-react";

export default function Auth() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Check for error in URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-primary animate-pulse font-mono">INITIALIZING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground overflow-hidden font-body relative bg-black">
      {/* Background */}
      <div className="static-background" />
      <div className="video-overlay" />
      
      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10 scanline" />
      
      {/* Background ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-40 border-b border-primary/50 bg-white/10 backdrop-blur-xl shadow-[0_4px_30px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-3">
          <Radio className="text-primary animate-pulse" />
          <h1 className="text-2xl tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">
            ALKULOUS <span className="text-primary text-xs align-top">SYS.AI.01</span>
          </h1>
        </div>
        <div className="text-xs font-mono text-white/80">
          STATUS: <span className="text-primary">AUTHENTICATION_REQUIRED</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Auth Card */}
          <div className="relative bg-black/60 border border-primary/30 backdrop-blur-md p-8 overflow-hidden">
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 border border-primary/40 rounded-full mb-4 bg-primary/5">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-display text-white tracking-wider mb-2">
                OPERATOR <span className="text-primary">ACCESS</span>
              </h2>
              <p className="text-white/50 font-mono text-xs uppercase tracking-widest">
                Authentication Protocol v2.0
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono text-center"
              >
                AUTHENTICATION_FAILED: {error.replace(/_/g, " ")}
              </motion.div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white hover:bg-gray-100 text-gray-800 font-medium transition-all duration-300 shadow-lg hover:shadow-xl group relative overflow-hidden"
            >
              {/* Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <span className="text-primary/50 text-xs font-mono">SECURE_AUTHENTICATION</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            {/* Info */}
            <div className="text-center space-y-3">
              <p className="text-white/40 text-xs font-mono">
                ACCESS_LEVEL: OPERATOR
              </p>
              <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider">
                By signing in, you agree to the ALKULOUS SYS.AI.01<br />
                security and usage protocols
              </p>
            </div>
          </div>

          {/* Return Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <a
              href="/"
              className="text-primary/60 hover:text-primary text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-2"
            >
              <span>←</span>
              <span>Return to Console</span>
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="fixed bottom-4 left-4 text-[10px] text-primary/30 font-mono">
        SYSTEM_ID: ALK_9000<br/>
        AUTH_PROVIDER: GOOGLE_OAUTH_2.0
      </div>
    </div>
  );
}
