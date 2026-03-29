import { motion } from "framer-motion";
import { Ghost } from "lucide-react";

export function GalleryEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full py-24 px-6 flex flex-col items-center justify-center text-center glass-panel rounded-3xl"
    >
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
        <Ghost className="w-10 h-10 text-zinc-500" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">It's quiet in here...</h3>
      <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
        The GitSlop bot hasn't dropped any memes yet. Mention <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-sm">@gitslopbot</code> in any configured GitHub repository to populate this gallery.
      </p>
    </motion.div>
  );
}
