import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MemeCard } from "@/components/MemeCard";
import { ImageCard } from "@/components/ImageCard";
import { GalleryEmptyState } from "@/components/GalleryEmptyState";
import { GallerySkeleton } from "@/components/GallerySkeleton";
import { useMemesGallery } from "@/hooks/use-memes";
import { AlertCircle, Film, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

type MobileTab = "videos" | "images";

const DESKTOP_PER_PAGE = 4;
const MOBILE_PER_PAGE = 5;

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

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  accentColor = "text-primary border-primary/40 hover:border-primary/70",
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  accentColor?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-zinc-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </button>
      <span className={`px-3 py-1.5 rounded-lg border text-sm font-mono font-bold ${accentColor}`}>
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-zinc-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden glass-panel border-white/5 animate-pulse">
          <div className="w-full h-40 bg-zinc-800/50" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-4 w-3/4 bg-zinc-800 rounded-md" />
            <div className="flex justify-between">
              <div className="h-3 w-1/4 bg-zinc-800 rounded-md" />
              <div className="h-3 w-1/4 bg-zinc-800 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Home() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("videos");
  const [videosPage, setVideosPage] = useState(1);
  const [imagesPage, setImagesPage] = useState(1);
  const [mobilePage, setMobilePage] = useState(1);

  const { data, isLoading, error } = useMemesGallery(200, 0);

  const memes = data?.memes ?? [];
  const videoMemes = memes;
  const imageMemes = memes.filter((m) => !!m.imageUrl);

  const videosTotalPages = Math.max(1, Math.ceil(videoMemes.length / DESKTOP_PER_PAGE));
  const imagesTotalPages = Math.max(1, Math.ceil(imageMemes.length / DESKTOP_PER_PAGE));

  const mobileItems = mobileTab === "videos" ? videoMemes : imageMemes;
  const mobileTotalPages = Math.max(1, Math.ceil(mobileItems.length / MOBILE_PER_PAGE));

  const pagedVideos = videoMemes.slice((videosPage - 1) * DESKTOP_PER_PAGE, videosPage * DESKTOP_PER_PAGE);
  const pagedImages = imageMemes.slice((imagesPage - 1) * DESKTOP_PER_PAGE, imagesPage * DESKTOP_PER_PAGE);
  const pagedMobile = mobileItems.slice((mobilePage - 1) * MOBILE_PER_PAGE, mobilePage * MOBILE_PER_PAGE);

  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileTab(tab);
    setMobilePage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <Hero />

        {/* ── Mobile Tab Bar ── */}
        <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 flex">
            <button
              onClick={() => handleMobileTabChange("videos")}
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
              onClick={() => handleMobileTabChange("images")}
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

        {!error && (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">

            {/* ── Desktop: Side-by-side Columns ── */}
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
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {pagedVideos.map((meme, idx) => (
                        <MemeCard key={meme.id} meme={meme} index={idx} />
                      ))}
                    </div>
                    <Pagination
                      page={videosPage}
                      totalPages={videosTotalPages}
                      onPrev={() => setVideosPage((p) => Math.max(1, p - 1))}
                      onNext={() => setVideosPage((p) => Math.min(videosTotalPages, p + 1))}
                      accentColor="text-primary border-primary/40 hover:border-primary/70"
                    />
                  </>
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
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {pagedImages.map((meme, idx) => (
                        <ImageCard key={meme.id} meme={meme} index={idx} />
                      ))}
                    </div>
                    <Pagination
                      page={imagesPage}
                      totalPages={imagesTotalPages}
                      onPrev={() => setImagesPage((p) => Math.max(1, p - 1))}
                      onNext={() => setImagesPage((p) => Math.min(imagesTotalPages, p + 1))}
                      accentColor="text-emerald-400 border-emerald-400/40 hover:border-emerald-400/70"
                    />
                  </>
                )}
              </div>
            </div>

            {/* ── Mobile: Tab Content ── */}
            <div className="lg:hidden pt-6">
              {isLoading ? (
                <GallerySkeleton />
              ) : mobileItems.length === 0 ? (
                mobileTab === "videos" ? (
                  <GalleryEmptyState />
                ) : (
                  <div className="py-16 px-6 flex flex-col items-center justify-center text-center glass-panel rounded-3xl">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-5 shadow-xl">
                      <ImageIcon className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No static images yet</h3>
                    <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                      Static frames will appear here as new memes are generated.
                    </p>
                  </div>
                )
              ) : (
                <>
                  <div className="flex flex-col gap-5">
                    {pagedMobile.map((meme, idx) =>
                      mobileTab === "videos" ? (
                        <MemeCard key={meme.id} meme={meme} index={idx} />
                      ) : (
                        <ImageCard key={meme.id} meme={meme} index={idx} />
                      )
                    )}
                  </div>
                  <Pagination
                    page={mobilePage}
                    totalPages={mobileTotalPages}
                    onPrev={() => setMobilePage((p) => Math.max(1, p - 1))}
                    onNext={() => setMobilePage((p) => Math.min(mobileTotalPages, p + 1))}
                    accentColor={mobileTab === "videos" ? "text-primary border-primary/40" : "text-emerald-400 border-emerald-400/40"}
                  />
                </>
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
