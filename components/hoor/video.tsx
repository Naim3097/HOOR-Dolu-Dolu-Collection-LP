"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/tracking";

const Q = ["(min-width: 900px)", "(prefers-reduced-motion: reduce)"];
const sub = (cb: () => void) => { const m = Q.map((q) => matchMedia(q)); m.forEach((x) => x.addEventListener("change", cb)); return () => m.forEach((x) => x.removeEventListener("change", cb)); };
const nav = () => navigator as Navigator & { connection?: { saveData?: boolean } };
const mode = () => matchMedia(Q[1]).matches || nav().connection?.saveData ? "poster" : matchMedia(Q[0]).matches ? "auto" : "tap";

export function Video({ name, caption, start = 0, className }: { name: string; caption: string; start?: number; className: string }) {
  const m = useSyncExternalStore(sub, mode, () => "tap");
  const [tapped, setTapped] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const poster = `/assets/video/${name}_poster.webp`;
  const playing = m === "auto" || tapped;

  useEffect(() => {
    if (m !== "auto" || !box.current) return;
    const io = new IntersectionObserver(([e]) => { const v = vid.current; if (!v) return; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.35 });
    io.observe(box.current);
    return () => io.disconnect();
  }, [m]);

  return (
    <div ref={box} className={className} data-video={name}>
      {playing ? (
        <video ref={vid} src={`/assets/video/${name}.webm`} poster={poster} muted loop playsInline preload="none" autoPlay={tapped} aria-label={caption}
          onLoadedMetadata={(e) => { if (start) e.currentTarget.currentTime = start; }}
          onClick={(e) => { if (tapped) { const v = e.currentTarget; if (v.paused) v.play(); else v.pause(); } }} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt={caption} loading="lazy" />
          {m === "tap" && (
            <button className="play" type="button" aria-label={`Play the film: ${caption}`} onClick={() => { setTapped(true); track("play_video", { film: name }); }}>
              <svg viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1v12l10-6z" fill="currentColor" /></svg><span>Play film</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
