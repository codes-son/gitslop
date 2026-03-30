import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Github, ExternalLink, GitMerge, MessageSquare, Film } from "lucide-react";
import type { MemePost } from "@workspace/api-client-react";

interface MemeCardProps {
  meme: MemePost;
  index: number;
}

export function MemeCard({ meme, index }: MemeCardProps) {
  const delay = Math.min(index * 0.1, 1.5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="break-inside-avoid mb-6 rounded-2xl overflow-hidden glass-panel group relative flex flex-col"
    >
      {/* Link overlay */}
      <a
        href={meme.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-20"
      >
        <span className="sr-only">View on GitHub</span>
      </a>

      {/* Video Container */}
      <div className="relative bg-zinc-950 overflow-hidden">
        <video
          src={meme.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top-left Video Badge */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
            <Film className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">AI Video</span>
          </div>
        </div>

        {/* Top-right Repo Badge */}
        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
            <Github className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-[11px] font-medium text-zinc-200 truncate max-w-[120px]">
              {meme.owner}/{meme.repo}
            </span>
          </div>
        </div>

        {/* Hover Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Hover Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary/90 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl shadow-primary/30 pointer-events-none z-30">
          <ExternalLink className="w-5 h-5 ml-0.5" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-3 relative z-30 pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-mono text-sm font-bold text-primary truncate">
            &gt; {meme.keyword}
          </h3>
        </div>

        {meme.imagePrompt && (
          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 italic">
            {meme.imagePrompt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-1.5 text-zinc-400">
            {meme.githubUrl.includes('/pull/') ? (
              <GitMerge className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>#{meme.issueNumber}</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
