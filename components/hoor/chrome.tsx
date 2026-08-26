"use client";
import { useEffect } from "react";
import { track, attribution } from "@/lib/tracking";

/** `.rv` reveal-on-scroll, header/sticky/WA show state, page_view + scroll_depth. */
export function Chrome() {
  useEffect(() => {
    track("page_view", attribution());
    const hit = new Set<number>();
    const header = document.getElementById("header"), bar = document.getElementById("stickybar"), wa = document.querySelector("[data-wa]"), shop = document.getElementById("shop");
    const onScroll = () => {
      const y = scrollY, past = y > innerHeight * 0.7;
      header?.classList.toggle("is-shown", past);
      wa?.classList.toggle("is-shown", past);
      if (shop) { const r = shop.getBoundingClientRect(); bar?.classList.toggle("is-shown", past && (r.top > innerHeight * 0.6 || r.bottom < 0)); }
      const pct = Math.round(((y + innerHeight) / document.body.scrollHeight) * 100);
      for (const m of [25, 50, 75, 90]) if (pct >= m && !hit.has(m)) { hit.add(m); track("scroll_depth", { percent: m }); }
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const rv = new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv").forEach((n) => rv.observe(n));
    return () => { removeEventListener("scroll", onScroll); rv.disconnect(); };
  }, []);
  return null;
}
