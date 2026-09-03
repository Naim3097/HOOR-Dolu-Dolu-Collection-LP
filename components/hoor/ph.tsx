"use client";
import { useState, type CSSProperties } from "react";
import { lqip, dims, srcset, imgSrc } from "@/lib/format";

type Props = { name: string; alt?: string; sizes?: string; eager?: boolean; pos?: string; className?: string; style?: CSSProperties; as?: "div" | "span" };

/** `.ph` box: LQIP background immediately, real image fades in on load. */
export function Ph({ name, alt = "", sizes = "(min-width:1240px) 25vw, (min-width:780px) 33vw, 50vw", eager, pos, className = "", style, as = "div" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const d = dims(name);
  const bg = lqip(name);
  const Tag = as;
  return (
    <Tag className={`ph ${className}`} style={{ ...(bg ? { backgroundImage: `url("${bg}")` } : {}), ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered WebP set with explicit srcset/sizes */}
      <img key={name} className={loaded ? "loaded" : undefined} srcSet={srcset(name)} sizes={sizes} src={imgSrc(name)} alt={alt}
        decoding="async" loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined}
        width={d?.[0]} height={d?.[1]} style={pos ? { objectPosition: pos } : undefined}
        onLoad={() => setLoaded(true)} ref={(el) => { if (el?.complete && el.naturalWidth && !loaded) setLoaded(true); }} />
    </Tag>
  );
}
