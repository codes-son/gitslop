import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MemeCard } from "@/components/MemeCard";
import { ImageCard } from "@/components/ImageCard";
import { GalleryEmptyState } from "@/components/GalleryEmptyState";
import { GallerySkeleton } from "@/components/GallerySkeleton";
import { useMemesGallery } from "@/hooks/use-memes";
import { AlertCircle, Film, ImageIcon } from "lucide-react";

type MobileTab = "videos" | "images";

function ColumnHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-white">{label}</h2>
      {count != null && count > 0 && (
        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-sm font-medium text-zinc-300 font-mono">
          {count}
        </span>
      )}
    </div>
  );
}

function ColumnSkeleton() {
  const skeletons = Array.from({ length: 4 }).map((_, i) => {
    const heights = ["h-48", "h-72", "h-64", "h-96"];
    return (
      <div key={i} className="break-inside-avoid mb-6 rounded-2xl overflow-hidden glass-panel border-white/5 animate-pulse">
        <div className={`w-full ${heights[i % heights.length]} bg-zinc-800/50`} />
        <div className="p-5 flex flex-col gap-4">
          <div className="h-4 w-3/4 bg-zinc-800 rounded-md" />
          <div className="flex justify-between">
            <div className="h-3 w-1/4 bg-zinc-800 rounded-md" />
            <div className="h-3 w-1/4 bg-zinc-800 rounded-md" />
          </div>
        </div>
      </div>
    );
  });
  return <div className="columns-1 sm:columns-2 gap-6">{skeletons}</div>;
}

export function Home() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("videos");
  const { data, isLoading, error } = useMemesGallery(100, 0);

  const memes = data?.memes ?? [];
  const videoMemes = memes;
  const imageMemes = memes.filter((m) => !!m.imageUrl);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <Hero />

        {/* ── Mobile Tab Bar ── */}
        <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 flex">
            <button
              onClick={() => setMobileTab("videos")}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2",
                mobileTab === "videos"
                  ? "text-primary border-primary"
                  : "text-zinc-500 border-transparent hover:text-zinc-300",
              ].join(" ")}
            >
              <Film className="w-4 h-4" />
              Videos
              {videoMemes.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                  {videoMemes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileTab("images")}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2",
                mobileTab === "images"
                  ? "text-emerald-400 border-emerald-400"
                  : "text-zinc-500 border-transparent hover:text-zinc-300",
              ].join(" ")}
            >
              <ImageIcon className="w-4 h-4" />
              Images
              {imageMemes.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                  {imageMemes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-destructive/20 rounded-full text-destructive">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Failed to load memes</h3>
                <p className="text-zinc-400 text-sm">Our servers are probably just looking for a meme to describe this error. Please try again later.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Desktop: Side-by-side Columns ── */}
        {!error && (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="hidden lg:grid lg:grid-cols-2 gap-8 pt-10">
              {/* Videos column */}
              <div>
                <ColumnHeader
                  icon={<Film className="w-4 h-4 text-primary" />}
                  label="Videos"
                  count={videoMemes.length}
                />
                {isLoading ? (
                  <ColumnSkeleton />
                ) : videoMemes.length === 0 ? (
                  <GalleryEmptyState />
                ) : (
                  <div className="columns-1 xl:columns-2 gap-6">
                    {videoMemes.map((meme, idx) => (
                      <MemeCard key={meme.id} meme={meme} index={idx} />
                    ))}
                  </div>
                )}
              </div>

              {/* Images column */}
              <div>
                <ColumnHeader
                  icon={<ImageIcon className="w-4 h-4 text-emerald-400" />}
                  label="Images"
                  count={imageMemes.length}
                />
                {isLoading ? (
                  <ColumnSkeleton />
                ) : imageMemes.length === 0 ? (
                  <div className="py-16 px-6 flex flex-col items-center justify-center text-center glass-panel rounded-3xl">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-5 shadow-xl">
                      <ImageIcon className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No static images yet</h3>
                    <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                      Static frames will appear here as new memes are generated.
                    </p>
                  </div>
                ) : (
                  <div className="columns-1 xl:columns-2 gap-6">
                    {imageMemes.map((meme, idx) => (
                      <ImageCard key={meme.id} meme={meme} index={idx} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile: Tab Content ── */}
            <div className="lg:hidden pt-6">
              {isLoading ? (
                <GallerySkeleton />
              ) : mobileTab === "videos" ? (
                videoMemes.length === 0 ? (
                  <GalleryEmptyState />
                ) : (
                  <div className="columns-1 sm:columns-2 gap-6">
                    {videoMemes.map((meme, idx) => (
                      <MemeCard key={meme.id} meme={meme} index={idx} />
                    ))}
                  </div>
                )
              ) : imageMemes.length === 0 ? (
                <div className="py-16 px-6 flex flex-col items-center justify-center text-center glass-panel rounded-3xl">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-5 shadow-xl">
                    <ImageIcon className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No static images yet</h3>
                  <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                    Static frames will appear here as new memes are generated.
                  </p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 gap-6">
                  {imageMemes.map((meme, idx) => (
                    <ImageCard key={meme.id} meme={meme} index={idx} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
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
