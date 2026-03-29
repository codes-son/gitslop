import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MemeCard } from "@/components/MemeCard";
import { GalleryEmptyState } from "@/components/GalleryEmptyState";
import { GallerySkeleton } from "@/components/GallerySkeleton";
import { useMemesGallery } from "@/hooks/use-memes";
import { AlertCircle } from "lucide-react";

export function Home() {
  const { data, isLoading, error } = useMemesGallery(100, 0);

  const memes = data?.memes || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <Hero />
        
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Meme Feed
              {total > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-sm font-medium text-zinc-300 font-mono">
                  {total}
                </span>
              )}
            </h2>
          </div>

          {error ? (
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-destructive/20 rounded-full text-destructive">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Failed to load memes</h3>
                <p className="text-zinc-400 text-sm">Our servers are probably just looking for a meme to describe this error. Please try again later.</p>
              </div>
            </div>
          ) : isLoading ? (
            <GallerySkeleton />
          ) : memes.length === 0 ? (
            <GalleryEmptyState />
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {memes.map((meme, idx) => (
                <MemeCard key={meme.id} meme={meme} index={idx} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center bg-zinc-950">
        <p className="text-zinc-500 text-sm font-medium">
          Built with <span className="text-accent">♥</span> for developers who break things.
        </p>
      </footer>
    </div>
  );
}

export default Home;
