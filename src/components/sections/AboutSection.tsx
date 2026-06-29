"use client";

import { useEffect, useRef, useState } from "react";
import { CuttingMat } from "@/components/sections/WorkSection";
import Image from "next/image";

interface StippleScreenProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// Portrait frame dimensions within the landscape screen
const PORTRAIT_W = 210;
const PORTRAIT_H = 310;

function StippleScreen({ src, alt, width, height }: StippleScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const portraitX = Math.round((width - PORTRAIT_W) / 2);
  const portraitY = Math.round((height - PORTRAIT_H) / 2);

  // Draw stipple progressively on load
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
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

      ctx.fillStyle = "#000C27";
      ctx.fillRect(0, 0, width, height);

      const grid = 4;
      const maxR = 1.2;
      const fadeSize = 60;

      // Pre-compute all dots and shuffle for organic reveal
      const dots: { x: number; y: number; r: number; style: string }[] = [];
      for (let py = 0; py < PORTRAIT_H; py += grid) {
        for (let px = 0; px < PORTRAIT_W; px += grid) {
          const i = (py * PORTRAIT_W + px) * 4;
          const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          const r = (1 - brightness) * maxR;
          if (r > 0.15) {
            const edgeX = Math.min(px, PORTRAIT_W - px) / fadeSize;
            const edgeY = Math.min(py, PORTRAIT_H - py) / fadeSize;
            const fade = Math.min(1, edgeX) * Math.min(1, edgeY);
            dots.push({
              x: portraitX + px,
              y: portraitY + py,
              r,
              style: `rgba(237,244,255,${(0.4 + (1 - brightness) * 0.6) * fade})`,
            });
          }
        }
      }

      // Fisher-Yates shuffle
      for (let i = dots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dots[i], dots[j]] = [dots[j], dots[i]];
      }

      const DURATION = 1800;
      const start = performance.now();
      let drawn = 0;

      const drawFrame = (now: number) => {
        const progress = Math.min((now - start) / DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const target = Math.floor(eased * dots.length);
        while (drawn < target) {
          const d = dots[drawn++];
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = d.style;
          ctx.fill();
        }
        if (drawn < dots.length) requestAnimationFrame(drawFrame);
      };
      requestAnimationFrame(drawFrame);
    };
  }, [src, width, height, portraitX, portraitY]);

  // Cursor peephole — native listeners, CSS variable drives clip-path
  useEffect(() => {
    const container = containerRef.current;
    const reveal = revealRef.current;
    if (!container || !reveal) return;

    reveal.style.clipPath = "circle(0px at 50% 50%)";

    let curX = 0, curY = 0;

    const isOverPortrait = (x: number, y: number) =>
      x >= portraitX && x <= portraitX + PORTRAIT_W &&
      y >= portraitY && y <= portraitY + PORTRAIT_H;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      curX = e.clientX - rect.left;
      curY = e.clientY - rect.top;

      if (isOverPortrait(curX, curY)) {
        container.style.cursor = "none";
        reveal.style.transition = "clip-path 0.08s linear";
        reveal.style.clipPath = `circle(60px at ${curX - portraitX}px ${curY - portraitY}px)`;
      } else {
        container.style.cursor = "default";
        reveal.style.transition = "clip-path 0.25s ease";
        reveal.style.clipPath = `circle(0px at ${curX - portraitX}px ${curY - portraitY}px)`;
      }
    };

    const onEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      curX = e.clientX - rect.left;
      curY = e.clientY - rect.top;
      if (isOverPortrait(curX, curY)) {
        container.style.cursor = "none";
        reveal.style.transition = "none";
        reveal.style.clipPath = `circle(0px at ${curX - portraitX}px ${curY - portraitY}px)`;
        requestAnimationFrame(() => {
          reveal.style.transition = "clip-path 0.25s ease";
          reveal.style.clipPath = `circle(60px at ${curX - portraitX}px ${curY - portraitY}px)`;
        });
      }
    };

    const onLeave = () => {
      container.style.cursor = "default";
      reveal.style.transition = "clip-path 0.25s ease";
      reveal.style.clipPath = `circle(0px at ${curX - portraitX}px ${curY - portraitY}px)`;
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

  // Label entrance animation — dot pop, line draw, text fade
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const groups = Array.from(svg.querySelectorAll<SVGGElement>("g[data-label]"))
      .sort((a, b) => Number(a.getAttribute("data-label")) - Number(b.getAttribute("data-label")));

    // Prime polylines with full dashoffset so they're invisible
    groups.forEach(g => {
      const polyline = g.querySelector("polyline");
      if (!polyline) return;
      const len = polyline.getTotalLength();
      polyline.style.strokeDasharray = `${len}`;
      polyline.style.strokeDashoffset = `${len}`;
    });

    const STIPPLE_DELAY = 600;
    const STAGGER = 280;
    const LINE_DURATION = 650;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    groups.forEach((g, i) => {
      const circle = g.querySelector<SVGCircleElement>("circle");
      const polyline = g.querySelector<SVGPolylineElement>("polyline");
      const text = g.querySelector<SVGTextElement>("text");
      const delay = STIPPLE_DELAY + i * STAGGER;

      timeouts.push(setTimeout(() => {
        if (circle) {
          circle.style.transition = "opacity 0.2s ease";
          circle.style.opacity = "1";
        }
        if (polyline) {
          polyline.style.transition = `stroke-dashoffset ${LINE_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
          polyline.style.strokeDashoffset = "0";
        }
        timeouts.push(setTimeout(() => {
          if (text) {
            text.style.transition = "opacity 0.4s ease";
            text.style.opacity = "0.95";
          }
        }, LINE_DURATION - 80));
      }, delay));
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Label parallax — SVG layer floats on cursor movement
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const MAX = 18;
    const LERP = 0.04;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetX = nx * MAX;
      targetY = ny * MAX;
    };

    const tick = () => {
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;
      svg.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        width,
        height,
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
          clipPath: "circle(0px at 50% 50%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 40%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 40%, transparent 100%)",
        }}
      >
        <Image src={src} alt={alt} fill className="object-cover" priority />
      </div>

      {/* Engineering annotations */}
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
        style={{ fontFamily: "var(--font-bitcount-prop-single), monospace" }}
      >
        {/* Left labels */}
        {[
          { label: "Systems Thinker",    ax: portraitX + 60,  ay: portraitY + 90,  bx: portraitX + 52,  by: portraitY + 60,  cx: portraitX - 60 },
          { label: "Empathy Led Design", ax: portraitX + 60,  ay: portraitY + 260, bx: portraitX + 52,  by: portraitY + 280, cx: portraitX - 60 },
        ].map(({ label, ax, ay, bx, by, cx }, idx) => {
          const words = label.split(" ");
          const lineH = 20;
          const startY = by - (words.length * lineH) / 2 + lineH / 2;
          return (
            <g key={label} data-label={idx}>
              <circle cx={ax} cy={ay} r={3} fill="#124BD0" style={{ opacity: 0 }} />
              <polyline points={`${ax},${ay} ${bx},${by} ${cx + 16},${by}`} fill="none" stroke="#124BD0" strokeWidth={1.5} opacity={0.9} />
              <text textAnchor="middle" fontSize={18} fontWeight={700} letterSpacing={1} fill="#124BD0" style={{ opacity: 0 }}>
                {words.map((word, i) => (
                  <tspan key={i} x={cx - 28} y={startY + i * lineH}>{word}</tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Right labels */}
        {[
          { label: "UI/UX Designer", ax: portraitX + PORTRAIT_W - 60, ay: portraitY + 80,  bx: portraitX + PORTRAIT_W - 52, by: portraitY + 55,  cx: portraitX + PORTRAIT_W + 60, textX: 36 },
          { label: "Cross Functional",  ax: portraitX + PORTRAIT_W - 60, ay: portraitY + 210, bx: portraitX + PORTRAIT_W - 52, by: portraitY + 210, cx: portraitX + PORTRAIT_W + 60, textX: 48 },
          { label: "Design to Code",    ax: portraitX + PORTRAIT_W - 60, ay: portraitY + 340, bx: portraitX + PORTRAIT_W - 52, by: portraitY + 360, cx: portraitX + PORTRAIT_W + 60, textX: 28 },
        ].map(({ label, ax, ay, bx, by, cx, textX }, idx) => {
          const words = label.split(" ");
          const lineH = 20;
          const startY = by - (words.length * lineH) / 2 + lineH / 2;
          return (
            <g key={label} data-label={2 + idx}>
              <circle cx={ax} cy={ay} r={3} fill="#124BD0" style={{ opacity: 0 }} />
              <polyline points={`${ax},${ay} ${bx},${by} ${cx - 16},${by}`} fill="none" stroke="#124BD0" strokeWidth={1.5} opacity={0.9} />
              <text textAnchor="middle" fontSize={18} fontWeight={700} letterSpacing={1} fill="#124BD0" style={{ opacity: 0 }}>
                {words.map((word, i) => (
                  <tspan key={i} x={cx + textX} y={startY + i * lineH}>{word}</tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

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

const SCREEN_W = 540;
const SCREEN_H = 340;

interface BoxColors {
  top: string; bottom: string;
  front: string; back: string;
  left: string; right: string;
}

function Face({ w, h, color, transform, origin, top, bottom, left, radius, shadow }: {
  w: number; h: number; color: string; transform: string;
  origin?: string; top?: number; bottom?: number; left?: number;
  radius?: number | string; shadow?: string;
}) {
  return (
    <div style={{
      position: "absolute",
      width: w,
      height: h,
      background: color,
      transform,
      transformOrigin: origin,
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      borderRadius: radius ?? 0,
      boxShadow: shadow,
      ...(top    !== undefined && { top }),
      ...(bottom !== undefined && { bottom }),
      ...(left   !== undefined && { left }),
    }} />
  );
}

// Light from camera (+Z). After rotateX(θ), each face's lit fraction:
//   top    normal (0,0,+1) → dot L = cos(θ)
//   bottom normal (0,0,−1) → dot L = −cos(θ)
//   front  normal (0,+1,0) → dot L = sin(θ)
//   back   normal (0,−1,0) → dot L = −sin(θ)
//   sides: constant ambient (normals ±X, always ⊥ to L)
function faceShadow(light: number, isTopOrBottom = false): string {
  const lit  = Math.max(0, Math.min(1, light));
  const dark = 1 - lit;
  const parts: string[] = [];

  if (isTopOrBottom && lit > 0.04) {
    // Three-layer drop shadow — crisp close, medium, soft far (navbar knob approach)
    parts.push(`0 1px ${(lit * 3).toFixed(1)}px rgba(0,12,39,${(lit * 0.16).toFixed(3)})`);
    parts.push(`0 ${(lit * 4).toFixed(1)}px ${(lit * 10).toFixed(1)}px rgba(0,12,39,${(lit * 0.13).toFixed(3)})`);
    parts.push(`0 ${(lit * 8).toFixed(1)}px ${(lit * 22).toFixed(1)}px rgba(0,12,39,${(lit * 0.07).toFixed(3)})`);
    // Bottom grounding shadow
    parts.push(`inset 0 -1px 0 rgba(0,12,39,${(0.06 + dark * 0.04).toFixed(3)})`);
  }

  // Bright top-edge highlight — strong when lit, absent when dark
  if (lit > 0.15) {
    const op = ((lit - 0.15) / 0.85 * 0.92).toFixed(2);
    parts.push(`inset 0 1px 0 rgba(255,255,255,${op})`);
  }

  // Inset shadow fills the face when it turns away from light
  if (dark > 0.06) {
    parts.push(`inset 0 0 ${(dark * 16).toFixed(1)}px rgba(0,12,39,${(dark * 0.24).toFixed(3)})`);
    if (dark > 0.5) {
      parts.push(`inset 0 2px ${(dark * 8).toFixed(1)}px rgba(0,12,39,${(dark * 0.10).toFixed(3)})`);
    }
  }

  return parts.join(", ") || "none";
}

function Box3D({ w, h, d, colors, angle = 0, roundTop = true, roundBottom = true }: {
  w: number; h: number; d: number; colors: BoxColors; angle?: number;
  roundTop?: boolean; roundBottom?: boolean;
}) {
  const θ = (angle * Math.PI) / 180;
  const cosθ = Math.cos(θ);
  const sinθ = Math.sin(θ);

  const topLight    = Math.max(0,  cosθ);
  const bottomLight = Math.max(0, -cosθ);
  const frontLight  = Math.max(0,  sinθ);
  const backLight   = Math.max(0, -sinθ);
  const sideAmbient = 0.28; // sides never face the light directly

  // Per-corner radius strings: CSS order is TL TR BR BL
  const rt = roundTop    ? 4 : 0;
  const rb = roundBottom ? 4 : 0;
  const rs = roundTop    ? 2 : 0; // side-face top corners
  const re = roundBottom ? 2 : 0; // side-face bottom corners
  // top face: top edge = back (axis) side, bottom edge = front (handle) side
  const topR    = `${rt}px ${rt}px ${rb}px ${rb}px`;
  // bottom face is rotateX(180deg) so its visual top/bottom flip
  const bottomR = `${rb}px ${rb}px ${rt}px ${rt}px`;
  // side faces: same corner mapping along their height
  const sideR   = `${rs}px ${rs}px ${re}px ${re}px`;

  // Side bevels — left edge highlight, right edge shadow (matches navbar knob sides)
  const leftShadow  = [faceShadow(sideAmbient), "inset 1px 0 0 rgba(255,255,255,0.6)"].filter(Boolean).join(", ");
  const rightShadow = [faceShadow(sideAmbient), "inset -1px 0 0 rgba(0,12,39,0.07)"].filter(Boolean).join(", ");

  return (
    <div style={{ position: "relative", width: w, height: h, transformStyle: "preserve-3d", flexShrink: 0, transform: `translateZ(${-d / 2}px)` }}>
      <Face w={w} h={h} color={colors.top}    transform={`translateZ(${d}px)`}                             radius={topR}    shadow={faceShadow(topLight,    true)} />
      <Face w={w} h={h} color={colors.bottom} transform="rotateX(180deg)"                                  radius={bottomR} shadow={faceShadow(bottomLight, true)} />
      <Face w={w} h={d} color={colors.front}  transform="rotateX(-90deg)" origin="bottom center" bottom={0} radius={rb}     shadow={faceShadow(frontLight)} />
      <Face w={w} h={d} color={colors.back}   transform="rotateX(90deg)"  origin="top center"    top={0}    radius={rt}     shadow={faceShadow(backLight)} />
      <Face w={d} h={h} color={colors.left}   transform="rotateY(-90deg)" origin="left center"   left={0}   radius={sideR}  shadow={leftShadow} />
      <Face w={d} h={h} color={colors.right}  transform={`translateX(${w}px) rotateY(-90deg)`}   origin="left center" left={0} radius={sideR} shadow={rightShadow} />
    </div>
  );
}

function Lever({ angle }: { angle: number }) {
  const AXIS_W = 48, AXIS_H = 22, AXIS_D = 12;
  // Shift axis block right so its right edge stays flush against the device (X=80)
  const AXIS_OFFSET = 40 - AXIS_W / 2; // = 16px
  const ARM_W  = 13, ARM_H  = 130, ARM_D  = 12;
  const HDL_W  = 56, HDL_H  = 11, HDL_D  = 12;

  // Match device tray color exactly so lever and device read as one material
  const topGrad   = "linear-gradient(180deg, #ffffff 0%, #f2f6fc 100%)";
  const sideGrad  = "linear-gradient(180deg, #ffffff 0%, #eef3fa 100%)";
  const edgeColor = "#f2f6fc";
  // Handle grip texture — repeating ridges over gradient (navbar-style)
  const gripTop   = `repeating-linear-gradient(to bottom, rgba(0,12,39,0.045) 0px, rgba(0,12,39,0.045) 1px, transparent 1px, transparent 4px), ${topGrad}`;
  const gripFront = `repeating-linear-gradient(to right, rgba(0,12,39,0.018) 0px, rgba(0,12,39,0.018) 1px, transparent 1px, transparent 4px), ${topGrad}`;

  const axisColors:  BoxColors = { top: "#ffffff", bottom: "#ffffff", front: "#ffffff", back: "#ffffff", left: "#ffffff", right: "#ffffff" };
  const armColors:   BoxColors = { top: topGrad,  bottom: topGrad,  front: edgeColor,  back: edgeColor, left: sideGrad, right: sideGrad };
  const handleColors: BoxColors = { top: gripTop, bottom: topGrad,  front: gripFront,  back: edgeColor, left: sideGrad, right: sideGrad };

  // How many px the arm embeds up into the axis block — hides the arm base at all angles
  const OVERLAP = 10;

  return (
    <div style={{
      width: 80,
      height: SCREEN_H,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 40,
      filter: "drop-shadow(0 4px 8px rgba(0,12,39,0.13)) drop-shadow(0 1px 2px rgba(0,12,39,0.10))",
    }}>
      {/*
        Pivot is OVERLAP px above the axis block's bottom edge.
        perspectiveOrigin Y = AXIS_H - OVERLAP keeps the vanishing point at the pivot.
      */}
      <div style={{ perspective: "240px", perspectiveOrigin: `50% ${AXIS_H - OVERLAP}px` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transformStyle: "preserve-3d" }}>
          {/* Axis block — right-shifted so right edge is flush against the device */}
          <div style={{ transform: `translateX(${AXIS_OFFSET}px)`, transformStyle: "preserve-3d" }}>
            <Box3D w={AXIS_W} h={AXIS_H} d={AXIS_D} colors={axisColors} />
          </div>

          {/* Arm embedded OVERLAP px into the axis block — pivot at top of this div */}
          <div style={{
            marginTop: -OVERLAP,
            transformOrigin: "50% 0%",
            transform: `rotateX(${angle}deg)`,
            transformStyle: "preserve-3d",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <Box3D w={ARM_W} h={ARM_H} d={ARM_D} colors={armColors} angle={angle} roundBottom={false} />
            {/* Handle — right end aligns with arm's right edge */}
            <div style={{
              transform: `translateX(${-(HDL_W - ARM_W) / 2}px)`,
              transformStyle: "preserve-3d",
            }}>
              <Box3D w={HDL_W} h={HDL_H} d={HDL_D} colors={handleColors} angle={angle} roundTop={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutSection() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const accumRef    = useRef(0);
  const [progress, setProgress] = useState(0);
  const [exited, setExited]     = useState(false);

  const VIRTUAL_SCROLL = 900;

  // Sync navbar slider with section state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("nav:setActive", { detail: { index: exited ? 1 : 0 } }));
  }, [exited]);

  // Navbar clicks drive the section
  useEffect(() => {
    const handler = (e: Event) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      if (index === 1) {
        accumRef.current = VIRTUAL_SCROLL;
        setProgress(1);
        setExited(true);
      } else if (index === 0) {
        accumRef.current = VIRTUAL_SCROLL;
        setProgress(1);
        setExited(false);
      }
    };
    window.addEventListener("nav:clicked", handler);
    return () => window.removeEventListener("nav:clicked", handler);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        if (exited) return;
        accumRef.current = Math.min(VIRTUAL_SCROLL, accumRef.current + e.deltaY);
        const p = accumRef.current / VIRTUAL_SCROLL;
        setProgress(p);
        if (p >= 1) setExited(true);
      } else {
        if (exited) {
          accumRef.current = VIRTUAL_SCROLL;
          setProgress(1);
          setExited(false);
        } else {
          accumRef.current = Math.max(0, accumRef.current + e.deltaY);
          setProgress(accumRef.current / VIRTUAL_SCROLL);
        }
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [exited]);

  const remap = (v: number, a: number, b: number) =>
    Math.max(0, Math.min(1, (v - a) / (b - a)));

  const s1 = 1 - remap(progress, 0.15, 0.35);
  const s2 = Math.min(remap(progress, 0.15, 0.35), 1 - remap(progress, 0.55, 0.75));
  const s3 = remap(progress, 0.55, 0.75);
  const leverAngle = progress * 360;

  return (
    <section
      id="about"
      ref={sectionRef}
      className="flex flex-col justify-center h-screen px-24 overflow-hidden"
      style={{ position: "relative" }}
    >
        {/* Mat — slides up when exited */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: exited
            ? "translate(-50%, -50%) rotate(-4deg)"
            : "translate(-50%, calc(-50% + 110vh)) rotate(-4deg)",
          opacity: exited ? 1 : 0,
          transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease",
          pointerEvents: exited ? "auto" : "none",
          zIndex: 10,
        }}>
          <CuttingMat />
        </div>

        {/* Device + text row */}
        <div className="flex items-center w-full gap-16">

          {/* Text — left, slides out left on exit */}
          <div style={{
            flex: 1,
            transform: exited ? "translateX(-120vw)" : "translateX(0)",
            transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div className="flex flex-col">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-8">
                <div style={{ width: 20, height: 1, background: "#C3D5FF" }} />
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", color: "#124BD0", textTransform: "uppercase" as const }}>
                  UI/UX Designer · Phronetic AI
                </span>
              </div>

              {/* Name */}
              <h1 style={{ fontSize: 84, fontWeight: 700, color: "#000C27", letterSpacing: "-0.03em", lineHeight: 1.0, marginBottom: 32 }}>
                Cherrisha<br />Shetty
              </h1>

              {/* Rule */}
              <div style={{ width: 64, height: 1, background: "#C3D5FF", marginBottom: 28 }} />

              {/* Body */}
              <p style={{ fontSize: 17, fontWeight: 400, color: "#000C27", opacity: 0.65, letterSpacing: "-0.01em", lineHeight: 1.65, maxWidth: 400 }}>
                I speak fluent ambiguity. Complex systems, technical constraints, no brief —{" "}
                I turn them into <span style={{ color: "#124BD0", fontWeight: 500, opacity: 1 }}>products that work.</span>
              </p>
            </div>
          </div>

          {/* Lever + device — right, slides out right on exit */}
          <div style={{
            display: "flex", alignItems: "center", flexShrink: 0,
            transform: exited ? "translateX(120vw)" : "translateX(0)",
            transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}>
            {/* Lever — left of device */}
            <Lever angle={leverAngle} />

          {/* Device tray */}
          <div
            className="relative rounded-2xl p-5"
            style={{
              background: "#ffffff",
              boxShadow: `
                0 1px 2px rgba(0,12,39,0.08),
                0 4px 10px rgba(0,12,39,0.10),
                0 12px 28px rgba(0,12,39,0.10),
                0 28px 60px rgba(0,12,39,0.08),
                inset 0 1px 0 rgba(255,255,255,1),
                inset 0 -1px 0 rgba(0,12,39,0.06),
                inset 1px 0 0 rgba(255,255,255,0.7),
                inset -1px 0 0 rgba(0,12,39,0.04)
              `,
            }}
          >
            {/* Top-edge buttons — side view, protruding above device rim */}
            <div className="absolute left-8 flex items-end gap-5" style={{ bottom: "100%" }}>
              {([110, 68] as number[]).map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: w,
                    height: 4,
                    borderRadius: "3px 3px 0 0",
                    background: "linear-gradient(180deg, #ffffff 0%, #edf1f8 100%)",
                    boxShadow: `
                      0 -1px 2px rgba(0,12,39,0.10),
                      0 -4px 8px rgba(0,12,39,0.08),
                      inset 0 1px 0 rgba(255,255,255,0.95),
                      inset 0 -1px 0 rgba(0,12,39,0.06),
                      1px 0 0 rgba(0,12,39,0.06),
                      -1px 0 0 rgba(0,12,39,0.06)
                    `,
                  }}
                />
              ))}
            </div>

            {/* Screen — three panels, morphing on scroll */}
            <div
              className="relative overflow-hidden"
              style={{
                width: SCREEN_W,
                height: SCREEN_H,
                boxShadow: `
                  0 0 0 1px rgba(0,12,39,0.16),
                  inset 0 2px 18px rgba(0,0,0,0.28),
                  inset 0 0 0 1px rgba(255,255,255,0.08)
                `,
              }}
            >
              {/* Screen 1 — stipple portrait */}
              <div className="absolute inset-0" style={{ opacity: s1, transition: "opacity 0.05s linear" }}>
                <StippleScreen
                  src="/about-photo-2.jpg"
                  alt="Cherrisha Shetty"
                  width={SCREEN_W}
                  height={SCREEN_H}
                />
              </div>

              {/* Screen 2 — journey */}
              <div
                className="absolute inset-0 flex flex-col items-start justify-end"
                style={{ opacity: s2, transition: "opacity 0.05s linear", backgroundColor: "#000C27", pointerEvents: s2 > 0.05 ? "auto" : "none", padding: 28 }}
              >
                <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>02 — Journey</span>
                <p style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.3, letterSpacing: "-0.02em" }}>From arts to engineering<br />to product design.</p>
              </div>

              {/* Screen 3 — beyond work */}
              <div
                className="absolute inset-0 flex flex-col items-start justify-end"
                style={{ opacity: s3, transition: "opacity 0.05s linear", backgroundColor: "#000C27", pointerEvents: s3 > 0.05 ? "auto" : "none", padding: 28 }}
              >
                <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>03 — Beyond work</span>
                <p style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.3, letterSpacing: "-0.02em" }}>Workshops, designathons,<br />and teaching what I know.</p>
              </div>

              {/* Screen glare — top-left reflection */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 25%, transparent 50%)`,
                  zIndex: 10,
                }}
              />
            </div>
          </div>
          </div>{/* end lever+device */}

        </div>
    </section>
  );
}
