import { Terminal, Github } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group outline-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            <Terminal className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
            Git<span className="text-zinc-400">Slop</span>
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <a 
            href="https://github.com/codes-son/gitslop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">View Source</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
