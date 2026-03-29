import { motion } from "framer-motion";
import { TerminalSquare } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Abstract cyberpunk background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium mb-8">
            <TerminalSquare className="w-3.5 h-3.5" />
            <span>v1.0.0 is live on GitHub</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Every bug deserves a <br className="hidden sm:block" />
            <span className="text-gradient">GIF response.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            GitSlop is a GitHub App that replies to issue and PR comments with context-aware memes. Because debugging is too depressing without them.
          </p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex flex-col items-center"
          >
            <div className="glass-panel px-5 py-4 sm:px-8 sm:py-5 rounded-2xl font-mono text-sm sm:text-base text-left flex items-start gap-4">
              <span className="text-zinc-600 select-none hidden sm:block">1</span>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center text-zinc-300">
                <span className="text-[#a855f7] font-semibold">@gitslop</span>
                <span className="text-[#22d3ee]">this code is absolute garbage</span>
              </div>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-zinc-500 font-medium tracking-wide">
              Mention the bot in any installed repository to generate a meme.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
