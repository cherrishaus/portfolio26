"use client";

import { useEffect, useRef, useState } from "react";

const MAT_W = 800;
const MAT_H = 560;
const TICK_SMALL = 6;
const TICK_MED = 10;
const TICK_LARGE = 14;
const TICK_INTERVAL = 10; // px per unit
const RULER_INSET = 28; // ruler band width

function RulerTicks({ length, axis }: { length: number; axis: "x" | "y" }) {
  const ticks: React.ReactNode[] = [];
  const count = Math.floor((length - RULER_INSET * 2) / TICK_INTERVAL);

  for (let i = 0; i <= count; i++) {
    const pos = RULER_INSET + i * TICK_INTERVAL;
    const isMajor = i % 5 === 0;
    const isMid = i % 5 === 0 && i % 10 !== 0;
    const tickH = isMajor ? TICK_LARGE : isMid ? TICK_MED : TICK_SMALL;
    const opacity = isMajor ? 0.55 : 0.3;

    if (axis === "x") {
      ticks.push(
        <line
          key={i}
          x1={pos} y1={RULER_INSET} x2={pos} y2={RULER_INSET - tickH}
          stroke="white" strokeWidth={isMajor ? 1 : 0.75} opacity={opacity}
        />
      );
      ticks.push(
        <line
          key={`b${i}`}
          x1={pos} y1={MAT_H - RULER_INSET} x2={pos} y2={MAT_H - RULER_INSET + tickH}
          stroke="white" strokeWidth={isMajor ? 1 : 0.75} opacity={opacity}
        />
      );
      if (isMajor && i > 0) {
        ticks.push(
          <text key={`t${i}`} x={pos} y={RULER_INSET - tickH - 3}
            fill="white" fontSize={7} opacity={0.4} textAnchor="middle"
            fontFamily="Space Grotesk, sans-serif"
          >{i}</text>
        );
      }
    } else {
      ticks.push(
        <line
          key={i}
          x1={RULER_INSET} y1={pos} x2={RULER_INSET - tickH} y2={pos}
          stroke="white" strokeWidth={isMajor ? 1 : 0.75} opacity={opacity}
        />
      );
      ticks.push(
        <line
          key={`r${i}`}
          x1={MAT_W - RULER_INSET} y1={pos} x2={MAT_W - RULER_INSET + tickH} y2={pos}
          stroke="white" strokeWidth={isMajor ? 1 : 0.75} opacity={opacity}
        />
      );
      if (isMajor && i > 0) {
        ticks.push(
          <text key={`t${i}`} x={RULER_INSET - tickH - 4} y={pos + 3}
            fill="white" fontSize={7} opacity={0.4} textAnchor="end"
            fontFamily="Space Grotesk, sans-serif"
          >{i}</text>
        );
      }
    }
  }
  return <>{ticks}</>;
}

function CornerArc({ cx, cy, r, startAngle, endAngle }: { cx: number; cy: number; r: number; startAngle: number; endAngle: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  return <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke="white" strokeWidth={0.75} fill="none" opacity={0.3} />;
}

export function CuttingMat() {
  const gridCols = Math.floor((MAT_W - RULER_INSET * 2) / TICK_INTERVAL);
  const gridRows = Math.floor((MAT_H - RULER_INSET * 2) / TICK_INTERVAL);

  return (
    <div style={{
      width: MAT_W,
      height: MAT_H,
      borderRadius: 6,
      backgroundColor: "#000C27",
      boxShadow: `
        4px 8px 24px rgba(0,12,39,0.22),
        8px 16px 48px rgba(0,12,39,0.18),
        16px 32px 80px rgba(0,12,39,0.12),
        0 1px 0 rgba(255,255,255,0.06) inset
      `,
      position: "relative",
      overflow: "hidden",
    }}>
      <svg width={MAT_W} height={MAT_H} style={{ position: "absolute", inset: 0 }}>
        {/* Ruler band borders */}
        <rect x={0} y={0} width={MAT_W} height={MAT_H} rx={6} ry={6} fill="none" stroke="rgba(195,213,255,0.12)" strokeWidth={1} />
        <line x1={RULER_INSET} y1={0} x2={RULER_INSET} y2={MAT_H} stroke="rgba(195,213,255,0.10)" strokeWidth={0.75} />
        <line x1={MAT_W - RULER_INSET} y1={0} x2={MAT_W - RULER_INSET} y2={MAT_H} stroke="rgba(195,213,255,0.10)" strokeWidth={0.75} />
        <line x1={0} y1={RULER_INSET} x2={MAT_W} y2={RULER_INSET} stroke="rgba(195,213,255,0.10)" strokeWidth={0.75} />
        <line x1={0} y1={MAT_H - RULER_INSET} x2={MAT_W} y2={MAT_H - RULER_INSET} stroke="rgba(195,213,255,0.10)" strokeWidth={0.75} />

        {/* Grid lines */}
        {Array.from({ length: gridCols + 1 }).map((_, i) => {
          const x = RULER_INSET + i * TICK_INTERVAL;
          const isMajor = i % 5 === 0;
          return (
            <line key={`gc${i}`}
              x1={x} y1={RULER_INSET} x2={x} y2={MAT_H - RULER_INSET}
              stroke="rgba(195,213,255,1)"
              strokeWidth={isMajor ? 0.6 : 0.35}
              opacity={isMajor ? 0.18 : 0.09}
            />
          );
        })}
        {Array.from({ length: gridRows + 1 }).map((_, i) => {
          const y = RULER_INSET + i * TICK_INTERVAL;
          const isMajor = i % 5 === 0;
          return (
            <line key={`gr${i}`}
              x1={RULER_INSET} y1={y} x2={MAT_W - RULER_INSET} y2={y}
              stroke="rgba(195,213,255,1)"
              strokeWidth={isMajor ? 0.6 : 0.35}
              opacity={isMajor ? 0.18 : 0.09}
            />
          );
        })}

        {/* Ruler ticks */}
        <RulerTicks length={MAT_W} axis="x" />
        <RulerTicks length={MAT_H} axis="y" />

        {/* Corner angle arcs */}
        <CornerArc cx={RULER_INSET} cy={RULER_INSET} r={20} startAngle={0} endAngle={90} />
        <CornerArc cx={MAT_W - RULER_INSET} cy={RULER_INSET} r={20} startAngle={90} endAngle={180} />
        <CornerArc cx={MAT_W - RULER_INSET} cy={MAT_H - RULER_INSET} r={20} startAngle={180} endAngle={270} />
        <CornerArc cx={RULER_INSET} cy={MAT_H - RULER_INSET} r={20} startAngle={270} endAngle={360} />

        {/* Second corner arcs — larger radius */}
        <CornerArc cx={RULER_INSET} cy={RULER_INSET} r={36} startAngle={0} endAngle={90} />
        <CornerArc cx={MAT_W - RULER_INSET} cy={RULER_INSET} r={36} startAngle={90} endAngle={180} />
        <CornerArc cx={MAT_W - RULER_INSET} cy={MAT_H - RULER_INSET} r={36} startAngle={180} endAngle={270} />
        <CornerArc cx={RULER_INSET} cy={MAT_H - RULER_INSET} r={36} startAngle={270} endAngle={360} />

        {/* Diagonal crosshair lines at centre */}
        <line x1={MAT_W / 2 - 16} y1={MAT_H / 2} x2={MAT_W / 2 + 16} y2={MAT_H / 2} stroke="rgba(195,213,255,0.25)" strokeWidth={0.75} />
        <line x1={MAT_W / 2} y1={MAT_H / 2 - 16} x2={MAT_W / 2} y2={MAT_H / 2 + 16} stroke="rgba(195,213,255,0.25)" strokeWidth={0.75} />
        <circle cx={MAT_W / 2} cy={MAT_H / 2} r={3} fill="none" stroke="rgba(195,213,255,0.2)" strokeWidth={0.75} />
      </svg>
    </div>
  );
}

export function WorkSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setEntered(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-24 py-32"
    >
      <div style={{
        transform: entered ? "translateX(0) rotate(-4deg)" : "translateX(120%) rotate(-4deg)",
        opacity: entered ? 1 : 0,
        transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease",
      }}>
        <CuttingMat />
      </div>
    </section>
  );
}
