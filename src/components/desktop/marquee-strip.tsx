"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";

/**
 * Marquee strip — full viewport width, seamless infinite scroll.
 * Uses JS-measured width for pixel-perfect looping (no -50% guess).
 * Colors from Paper node 4PO-0:
 * Icons: #D7B4D5 (lavender)
 * Text: #FFFFFFB3 (white 70%)
 * Dots: #D7B4D5
 */

const LAVENDER = "#D7B4D5";
const GAP = 32; // px between items, matches Paper

const items = [
  { icon: "star", label: "Handmade from scratch" },
  { icon: "clock", label: "One flavor per drop" },
  { icon: "home", label: "Baked fresh every Saturday" },
  { icon: "pin", label: "San Salvador, El Salvador" },
  { icon: "person", label: "Food engineer & pastry chef" },
  { icon: "hugeicon:cookie-solid", label: "Made with real ingredients" },
  { icon: "hugeicon:oven-solid", label: "Fresh out of the oven" },
  { icon: "hugeicon:sparkles-solid", label: "Small-batch, no shortcuts" },
  { icon: "hugeicon:leaf-01-solid", label: "No preservatives" },
  { icon: "hugeicon:heart-check-solid", label: "Made with love" },
];

function InlineSvgIcon({ type }: { type: string }) {
  switch (type) {
    case "star":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1l1.73 3.51L12.5 5l-3 2.93.71 4.14L7 10.27 3.79 12.07l.71-4.14-3-2.93 3.77-.49L7 1z" fill={LAVENDER} />
        </svg>
      );
    case "clock":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill={LAVENDER} />
          <path d="M12 7v5l3 2" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "home":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M3 8.5L12 2l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V8.5z" fill={LAVENDER} />
        </svg>
      );
    case "pin":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={LAVENDER} />
          <circle cx="12" cy="9" r="2.5" fill="#1B3D2F" />
        </svg>
      );
    case "person":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill={LAVENDER} />
          <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" fill={LAVENDER} />
        </svg>
      );
    default:
      return null;
  }
}

function MarqueeIcon({ type }: { type: string }) {
  if (type.startsWith("hugeicon:")) {
    const name = type.replace("hugeicon:", "");
    return (
      <Image
        src={`/icons/${name}.svg`}
        alt=""
        width={14}
        height={14}
        className="shrink-0"
        style={{ filter: "brightness(0) saturate(100%) invert(76%) sepia(12%) saturate(686%) hue-rotate(264deg) brightness(98%) contrast(87%)" }}
      />
    );
  }
  return <InlineSvgIcon type={type} />;
}

function MarqueeContent() {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 shrink-0">
          <MarqueeIcon type={item.icon} />
          <span className="text-[15px] font-medium italic text-white/70 whitespace-nowrap">
            {item.label}
          </span>
          {i < items.length - 1 && (
            <span className="text-[15px] shrink-0 ml-4" style={{ color: LAVENDER }}>·</span>
          )}
        </div>
      ))}
    </>
  );
}

export function MarqueeStrip() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, []);

  // Speed: ~50px/sec for smooth, relaxed feel
  const duration = contentWidth > 0 ? contentWidth / 50 : 30;

  return (
    <div className="w-full bg-forest overflow-hidden">
      <div
        className="flex py-5"
        style={{
          animation: contentWidth > 0 ? `marquee-scroll ${duration}s linear infinite` : "none",
          willChange: "transform",
        }}
      >
        {/* First copy — measured for width */}
        <div ref={contentRef} className="flex shrink-0" style={{ gap: `${GAP}px`, paddingRight: `${GAP}px` }}>
          <MarqueeContent />
        </div>
        {/* Clones — enough to always fill the viewport */}
        <div className="flex shrink-0" style={{ gap: `${GAP}px`, paddingRight: `${GAP}px` }}>
          <MarqueeContent />
        </div>
        <div className="flex shrink-0" style={{ gap: `${GAP}px`, paddingRight: `${GAP}px` }}>
          <MarqueeContent />
        </div>
      </div>

      {contentWidth > 0 && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${contentWidth}px); }
          }
        `}} />
      )}
    </div>
  );
}
