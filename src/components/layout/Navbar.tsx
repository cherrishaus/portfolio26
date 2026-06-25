"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

function Screw() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="screw-metal" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#f0f3f8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#dde3ed" />
          <stop offset="100%" stopColor="#c8cfda" />
        </radialGradient>
        <linearGradient id="screw-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000C27" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      {/* Screw head — flat metallic */}
      <circle cx="5" cy="5" r="4" fill="url(#screw-metal)" />
      {/* Metallic sheen overlay */}
      <circle cx="5" cy="5" r="4" fill="url(#screw-sheen)" />
      {/* Inset rim — dark top, light bottom to fake recess */}
      <circle cx="5" cy="5" r="4" stroke="rgba(0,12,39,0.18)" strokeWidth="0.6" fill="none" />
      <circle cx="5" cy="5" r="3.7" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" fill="none" strokeDasharray="6 20" strokeDashoffset="-3" />
      {/* Slot */}
      <line x1="2.4" y1="5" x2="7.6" y2="5" stroke="rgba(0,12,39,0.18)" strokeWidth="1" strokeLinecap="round" />
      {/* Slot highlight */}
      <line x1="2.4" y1="4.6" x2="7.6" y2="4.6" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  const getLinkCenters = () => {
    const track = trackRef.current;
    if (!track) return [];
    const trackRect = track.getBoundingClientRect();
    return linkRefs.current.map((link) => {
      if (!link) return 0;
      const rect = link.getBoundingClientRect();
      return rect.left - trackRect.left + rect.width / 2 - (knobRef.current?.offsetWidth ?? 0) / 2;
    });
  };

  const moveKnob = (index: number) => {
    const link = linkRefs.current[index];
    const track = trackRef.current;
    const knob = knobRef.current;
    if (!link || !track || !knob) return;

    const trackRect = track.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const targetX = linkRect.left - trackRect.left + linkRect.width / 2 - knob.offsetWidth / 2;

    gsap.to(knob, {
      x: targetX,
      duration: 0.55,
      ease: "power3.out",
    });
  };

  // useLayoutEffect ensures DOM is measured after paint — accurate link widths
  useLayoutEffect(() => {
    moveKnob(activeIndex);
  }, [activeIndex]);

  // Re-centre after fonts finish loading (Space Grotesk affects text width)
  useEffect(() => {
    document.fonts.ready.then(() => {
      const link = linkRefs.current[activeIndex];
      const track = trackRef.current;
      const knob = knobRef.current;
      if (!link || !track || !knob) return;
      const trackRect = track.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const targetX = linkRect.left - trackRect.left + linkRect.width / 2 - knob.offsetWidth / 2;
      gsap.set(knob, { x: targetX });
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const link = linkRefs.current[activeIndex];
      const track = trackRef.current;
      const knob = knobRef.current;
      if (!link || !track || !knob) return;

      const trackRect = track.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const targetX = linkRect.left - trackRect.left + linkRect.width / 2 - knob.offsetWidth / 2;
      gsap.set(knob, { x: targetX });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  // Draggable — constrained to track width, snaps to closest link on release
  useEffect(() => {
    const knob = knobRef.current;
    const track = trackRef.current;
    if (!knob || !track) return;

    const minX = 0;
    const maxX = track.offsetWidth - knob.offsetWidth;

    const draggable = Draggable.create(knob, {
      type: "x",
      minX,
      maxX,
      cursor: "grab",
      activeCursor: "grabbing",
      onDragEnd() {
        const centers = getLinkCenters();
        const currentX = gsap.getProperty(knob, "x") as number;
        const knobCenter = currentX + knob.offsetWidth / 2;

        let closestIndex = 0;
        let closestDist = Infinity;
        centers.forEach((cx, i) => {
          const dist = Math.abs(cx + knob.offsetWidth / 2 - knobCenter);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
          }
        });

        setActiveIndex(closestIndex);
        gsap.to(knob, { x: centers[closestIndex], duration: 0.4, ease: "power3.out" });
      },
    });

    return () => { draggable[0].kill(); };
  }, []);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto relative rounded-full px-12 pt-2 pb-4"
        style={{
          backgroundColor: "#ffffff",
          // Elevated — tray sits above the grid surface
          boxShadow: `
            0 2px 4px rgba(0, 12, 39, 0.06),
            0 6px 16px rgba(0, 12, 39, 0.10),
            0 16px 40px rgba(0, 12, 39, 0.08),
            0 1px 0px rgba(255,255,255,0.9) inset
          `,
        }}
      >
        {/* Screws */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50"><Screw /></div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50"><Screw /></div>

        {/* Nav links */}
        <ul className="flex items-center gap-32">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href}>
              <Link
                ref={(el) => { linkRefs.current[i] = el; }}
                href={link.href}
                onClick={() => setActiveIndex(i)}
                className={`
                  text-sm font-medium tracking-wide transition-all duration-300 select-none
                  ${activeIndex === i
                    ? "text-[#124BD0]"
                    : "text-[#000C27]/60 hover:text-[#000C27]"}
                `}
                style={activeIndex === i ? {
                  textShadow: "0 0 8px rgba(18, 75, 208, 0.3), 0 0 16px rgba(18, 75, 208, 0.12)",
                } : { textShadow: "none" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Track + knob */}
        <div
          className="relative mt-3 cursor-pointer"
          ref={trackRef}
          onClick={(e) => {
            const track = trackRef.current;
            const knob = knobRef.current;
            if (!track || !knob) return;
            const trackRect = track.getBoundingClientRect();
            const clickX = e.clientX - trackRect.left;
            const centers = getLinkCenters();
            let closestIndex = 0;
            let closestDist = Infinity;
            centers.forEach((cx, i) => {
              const dist = Math.abs(cx + knob.offsetWidth / 2 - clickX);
              if (dist < closestDist) { closestDist = dist; closestIndex = i; }
            });
            setActiveIndex(closestIndex);
            gsap.to(knob, { x: centers[closestIndex], duration: 0.4, ease: "power3.out" });
          }}
        >
          {/* Inset track groove */}
          <div
            className="h-[4px] w-full rounded-full"
            style={{
              background: "rgba(0, 12, 39, 0.15)",
              boxShadow: "inset 0 1px 3px rgba(0,12,39,0.18), inset 0 -1px 1px rgba(255,255,255,0.6)",
            }}
          />

          {/* DJ fader knob */}
          <div
            ref={knobRef}
            className="absolute flex flex-col items-center justify-center gap-[3px]"
            style={{
              width: "12px",
              height: "20px",
              top: "-8px",
              borderRadius: "4px",
              background: "linear-gradient(180deg, #ffffff 0%, #e8eef8 40%, #d4deee 100%)",
              boxShadow: `
                0 4px 10px rgba(0, 12, 39, 0.22),
                0 1px 3px rgba(0, 12, 39, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.95),
                inset 0 -1px 0 rgba(0, 12, 39, 0.08),
                inset 1px 0 0 rgba(255, 255, 255, 0.6),
                inset -1px 0 0 rgba(0, 12, 39, 0.06)
              `,
            }}
          >
            {/* Grip ridges */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "7px",
                  height: "1px",
                  borderRadius: "1px",
                  background: "rgba(0, 12, 39, 0.12)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.7)",
                }}
              />
            ))}
            {/* Center indicator line */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "2px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "linear-gradient(90deg, transparent, #002E9A, transparent)",
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
