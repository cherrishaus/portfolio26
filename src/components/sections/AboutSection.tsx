"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface StippleScreenProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// Portrait frame dimensions within the landscape screen
const PORTRAIT_W = 280;
const PORTRAIT_H = 400;

function StippleScreen({ src, alt, width, height }: StippleScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  const portraitX = Math.round((width - PORTRAIT_W) / 2);
  const portraitY = Math.round((height - PORTRAIT_H) / 2);

  // Draw stipple onto canvas once image loads
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      // object-cover crop into the portrait area
      const scale = Math.max(PORTRAIT_W / img.naturalWidth, PORTRAIT_H / img.naturalHeight);
      const renderedW = img.naturalWidth * scale;
      const renderedH = img.naturalHeight * scale;
      const srcOffX = (PORTRAIT_W - renderedW) / 2;
      const srcOffY = (PORTRAIT_H - renderedH) / 2;

      const off = document.createElement("canvas");
      off.width = PORTRAIT_W;
      off.height = PORTRAIT_H;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, srcOffX, srcOffY, renderedW, renderedH);
      const { data } = offCtx.getImageData(0, 0, PORTRAIT_W, PORTRAIT_H);

      // Navy fills the full screen
      ctx.fillStyle = "#000C27";
      ctx.fillRect(0, 0, width, height);

      const grid = 4;
      const maxR = 1.2;
      const fadeSize = 60; // px fade at each edge

      for (let py = 0; py < PORTRAIT_H; py += grid) {
        for (let px = 0; px < PORTRAIT_W; px += grid) {
          const i = (py * PORTRAIT_W + px) * 4;
          const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          const r = (1 - brightness) * maxR;
          if (r > 0.15) {
            // Edge fade factor — 0 at edges, 1 in center
            const edgeX = Math.min(px, PORTRAIT_W - px) / fadeSize;
            const edgeY = Math.min(py, PORTRAIT_H - py) / fadeSize;
            const fade = Math.min(1, edgeX) * Math.min(1, edgeY);

            ctx.beginPath();
            ctx.arc(portraitX + px, portraitY + py, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(237,244,255,${(0.4 + (1 - brightness) * 0.6) * fade})`;
            ctx.fill();
          }
        }
      }
    };
  }, [src, width, height, portraitX, portraitY]);

  // Cursor peephole — native listeners, CSS variable drives clip-path
  useEffect(() => {
    const container = containerRef.current;
    const reveal = revealRef.current;
    if (!container || !reveal) return;

    reveal.style.clipPath = "circle(0px at 50% 50%)";

    let curX = 0, curY = 0;

    const onEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      curX = e.clientX - rect.left;
      curY = e.clientY - rect.top;
      // Snap position instantly, then grow radius smoothly
      reveal.style.transition = "none";
      reveal.style.clipPath = `circle(0px at ${curX}px ${curY}px)`;
      requestAnimationFrame(() => {
        reveal.style.transition = "clip-path 0.25s ease";
        reveal.style.clipPath = `circle(60px at ${curX}px ${curY}px)`;
      });
    };

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      curX = e.clientX - rect.left;
      curY = e.clientY - rect.top;
      reveal.style.transition = "clip-path 0.08s linear";
      reveal.style.clipPath = `circle(60px at ${curX}px ${curY}px)`;
    };

    const onLeave = () => {
      // Shrink at current position, not at 0,0
      reveal.style.transition = "clip-path 0.25s ease";
      reveal.style.clipPath = `circle(0px at ${curX}px ${curY}px)`;
    };

    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    return () => {
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        width,
        height,
        cursor: "none",
        backgroundColor: "#000C27",
      }}
    >
      {/* Stipple layer */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />

      {/* Real photo — portrait-sized, peephole reveal */}
      <div
        ref={revealRef}
        className="absolute overflow-hidden"
        style={{
          width: PORTRAIT_W,
          height: PORTRAIT_H,
          left: portraitX,
          top: portraitY,
          WebkitMaskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 40%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 40%, transparent 100%)",
        }}
      >
        <Image src={src} alt={alt} fill className="object-cover" priority />
      </div>

      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
        }}
      />
    </div>
  );
}

export function AboutSection() {
  return (
    <section
      id="about"
      className="flex items-center justify-start min-h-screen px-24 pt-32"
    >
      {/* Device tray */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: "#FAFBFF",
          boxShadow: `
            0 2px 4px rgba(0,12,39,0.06),
            0 8px 20px rgba(0,12,39,0.12),
            0 24px 56px rgba(0,12,39,0.10),
            inset 0 1px 0 rgba(255,255,255,0.95),
            inset 0 -1px 0 rgba(0,12,39,0.06)
          `,
        }}
      >
        {/* Screen — flatscreen, no bezel */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            boxShadow: `
              0 0 0 1px rgba(0,12,39,0.12),
              inset 0 2px 10px rgba(0,0,0,0.18),
              inset 0 0 0 1px rgba(255,255,255,0.06)
            `,
          }}
        >
          <StippleScreen
            src="/about-photo-2.jpg"
            alt="Cherrisha Shetty"
            width={720}
            height={440}
          />

          {/* Screen glare — top-left reflection */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 25%, transparent 50%)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
