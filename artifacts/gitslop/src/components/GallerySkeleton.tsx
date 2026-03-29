export function GallerySkeleton() {
  // Generate random heights for masonry effect
  const skeletons = Array.from({ length: 8 }).map((_, i) => {
    const heightClasses = ['h-48', 'h-64', 'h-72', 'h-96'];
    const randomHeight = heightClasses[i % heightClasses.length];
    
    return (
      <div key={i} className="break-inside-avoid mb-6 rounded-2xl overflow-hidden glass-panel border-white/5 animate-pulse">
        <div className={`w-full ${randomHeight} bg-zinc-800/50`} />
        <div className="p-5 flex flex-col gap-4">
          <div className="h-4 w-3/4 bg-zinc-800 rounded-md" />
          <div className="flex justify-between items-center">
            <div className="h-3 w-1/4 bg-zinc-800 rounded-md" />
            <div className="h-3 w-1/4 bg-zinc-800 rounded-md" />
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
      {skeletons}
    </div>
  );
}
