import { useEffect, useState } from "react";
import { useParams } from "wouter";

export default function Slop() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [status, setStatus] = useState<"loading" | "notfound" | "error">("loading");

  useEffect(() => {
    if (!id) { setStatus("notfound"); return; }

    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
    fetch(`${base}/api/memes/${id}`)
      .then((r) => {
        if (r.status === 404) { setStatus("notfound"); return null; }
        if (!r.ok) { setStatus("error"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.videoUrl) {
          window.location.href = data.videoUrl;
        } else {
          setStatus("notfound");
        }
      })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-mono">loading slop#{id}...</p>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-5xl">💀</p>
        <p className="text-white font-bold text-xl">slop#{id} not found</p>
        <a href={import.meta.env.BASE_URL} className="text-primary text-sm underline">← back to gallery</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <p className="text-5xl">😵</p>
      <p className="text-white font-bold text-xl">failed to load</p>
      <a href={import.meta.env.BASE_URL} className="text-primary text-sm underline">← back to gallery</a>
    </div>
  );
}
