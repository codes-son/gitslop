import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MemeCard } from "@/components/MemeCard";
import { GifCard } from "@/components/GifCard";
import { ImageCard } from "@/components/ImageCard";
import { GalleryEmptyState } from "@/components/GalleryEmptyState";
import { GallerySkeleton } from "@/components/GallerySkeleton";
import { useMemesGallery } from "@/hooks/use-memes";
import { AlertCircle, Film, ImageIcon, ChevronLeft, ChevronRight, Zap } from "lucide-react";

type Tab = "gifs" | "videos" | "images";

const DESKTOP_PER_PAGE = 18;
const MOBILE_PER_PAGE = 6;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; accent: string }[] = [
  {
    id: "gifs",
    label: "GIFs",
    icon: <Zap className="w-4 h-4" />,
    color: "text-yellow-400 border-yellow-400",
    accent: "text-yellow-400 border-yellow-400/40",
  },
  {
    id: "videos",
    label: "Videos",
    icon: <Film className="w-4 h-4" />,
    color: "text-primary border-primary",
    accent: "text-primary border-primary/40",
  },
  {
    id: "images",
    label: "Images",
    icon: <ImageIcon className="w-4 h-4" />,
    color: "text-emerald-400 border-emerald-400",
    accent: "text-emerald-400 border-emerald-400/40",
  },
];

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  accentColor = "text-primary border-primary/40",
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  accentColor?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-zinc-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <span className={`px-3 py-1.5 rounded-lg border text-sm font-mono font-bold ${accentColor}`}>
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-zinc-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const map = {
    gifs: { icon: <Zap className="w-8 h-8 text-zinc-600" />, title: "No GIFs yet", desc: "Animated GIFs will appear here as new memes are generated." },
    videos: { icon: <Film className="w-8 h-8 text-zinc-600" />, title: "No videos yet", desc: "Videos will appear here as new memes are generated." },
    images: { icon: <ImageIcon className="w-8 h-8 text-zinc-600" />, title: "No images yet", desc: "Static frames will appear here as new memes are generated." },
  };
  const { icon, title, desc } = map[tab];
  return (
    <div className="py-24 px-6 flex flex-col items-center justify-center text-center glass-panel rounded-3xl">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-5 shadow-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("gifs");
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  const { data, isLoading, error } = useMemesGallery(1000, 0);

  const memes = data?.memes ?? [];
  const gifMemes = memes.filter((m) => !!m.gifUrl);
  const videoMemes = memes;
  const imageMemes = memes.filter((m) => !!m.imageUrl);

  const items =
    activeTab === "gifs" ? gifMemes : activeTab === "videos" ? videoMemes : imageMemes;

  const isDesktop = useIsDesktop();
  const perPage = isDesktop ? DESKTOP_PER_PAGE : MOBILE_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const paged = items.slice((page - 1) * perPage, page * perPage);

  const scrollToGallery = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    scrollToGallery();
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />

        {/* ── Tab Bar ── */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 flex">
            {TABS.map((tab) => {
              const count =
                tab.id === "gifs"
                  ? gifMemes.length
                  : tab.id === "videos"
                  ? videoMemes.length
                  : imageMemes.length;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors border-b-2",
                    active
                      ? tab.color
                      : "text-zinc-500 border-transparent hover:text-zinc-300",
                  ].join(" ")}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-4">
              <div className="p-3 bg-destructive/20 rounded-full text-destructive">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Failed to load memes</h3>
                <p className="text-zinc-400 text-sm">
                  Our servers are probably just looking for a meme to describe this error. Please try again later.
                </p>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <section ref={sectionRef} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-8">
            {isLoading ? (
              <GallerySkeleton />
            ) : items.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {paged.map((meme, idx) =>
                    activeTab === "gifs" ? (
                      <GifCard key={meme.id} meme={meme} index={idx} />
                    ) : activeTab === "videos" ? (
                      <MemeCard key={meme.id} meme={meme} index={idx} />
                    ) : (
                      <ImageCard key={meme.id} meme={meme} index={idx} />
                    )
                  )}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPrev={() => { setPage((p) => Math.max(1, p - 1)); scrollToGallery(); }}
                  onNext={() => { setPage((p) => Math.min(totalPages, p + 1)); scrollToGallery(); }}
                  accentColor={currentTab.accent}
                />
              </>
            )}
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
