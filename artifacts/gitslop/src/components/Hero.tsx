import { motion } from "framer-motion";
import { TerminalSquare, Github, Play } from "lucide-react";

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

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <a
              href="https://github.com/apps/gitslopbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Github className="w-4 h-4" />
              Install App
            </a>
            <a
              href="https://github.com/codes-son/gitslop/issues/1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-semibold text-sm hover:bg-white/10 hover:text-white active:scale-95 transition-all"
            >
              <Play className="w-4 h-4" />
              Bot Playground
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="inline-flex flex-col items-center"
          >
            <div className="glass-panel px-5 py-4 sm:px-8 sm:py-5 rounded-2xl font-mono text-sm sm:text-base text-left flex items-start gap-4">
              <span className="text-zinc-600 select-none hidden sm:block">1</span>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center text-zinc-300">
                <span className="text-[#a855f7] font-semibold">@gitslopbot</span>
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
