"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/tracking";
import { asset } from "@/lib/assets";

const Q = ["(min-width: 900px)", "(prefers-reduced-motion: reduce)"];
const sub = (cb: () => void) => { const m = Q.map((q) => matchMedia(q)); m.forEach((x) => x.addEventListener("change", cb)); return () => m.forEach((x) => x.removeEventListener("change", cb)); };
const nav = () => navigator as Navigator & { connection?: { saveData?: boolean } };
const mode = () => matchMedia(Q[1]).matches || nav().connection?.saveData ? "poster" : matchMedia(Q[0]).matches ? "auto" : "tap";

export function Video({ name, caption, start = 0, className }: { name: string; caption: string; start?: number; className: string }) {
  const m = useSyncExternalStore(sub, mode, () => "tap");
  const [tapped, setTapped] = useState(false);
  const [sound, setSound] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const poster = asset(`video/${name}_poster.webp`);
  const playing = m === "auto" || tapped;

  // The films carry their soundtrack, but autoplay must start muted (browser
  // rule); the speaker button is the user gesture that lets the audio out.
  // React does not reliably write `muted` back to the DOM, hence the ref.
  useEffect(() => { const v = vid.current; if (v) v.muted = !sound; }, [sound, playing]);

  useEffect(() => {
    if (m !== "auto" || !box.current) return;
    const io = new IntersectionObserver(([e]) => { const v = vid.current; if (!v) return; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.35 });
    io.observe(box.current);
    return () => io.disconnect();
  }, [m]);

  return (
    <div ref={box} className={className} data-video={name}>
      {playing ? (
        <>
          <video ref={vid} poster={poster} muted loop playsInline preload="none" autoPlay={tapped} aria-label={caption}
            onLoadedMetadata={(e) => { if (start) e.currentTarget.currentTime = start; }}
            onClick={(e) => { if (tapped) { const v = e.currentTarget; if (v.paused) v.play(); else v.pause(); } }}>
            {/* ?v=2 — the films gained a soundtrack on 10 Sep 2026 and ship with a
                one-year cache header; the query busts every older, silent copy. */}
            <source src={`${asset(`video/${name}.webm`)}?v=2`} type="video/webm" />
            <source src={`${asset(`video/${name}.mp4`)}?v=2`} type="video/mp4" />
          </video>
          <button className="sound" type="button" aria-pressed={sound} aria-label={sound ? "Mute the film" : "Play the film with sound"}
            onClick={() => { const v = vid.current; if (v) { v.muted = sound; if (v.paused) v.play().catch(() => {}); } setSound(!sound); track("film_sound", { film: name, on: !sound }); }}>
            {sound ? (
              <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5v4h2.5L8 12V2L4.5 5H2z" fill="currentColor" /><path d="M9.8 4.6a3.2 3.2 0 0 1 0 4.8M11.4 3a5.6 5.6 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5v4h2.5L8 12V2L4.5 5H2z" fill="currentColor" /><path d="m9.6 5.4 3.2 3.2m0-3.2-3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
            )}
          </button>
        </>
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
