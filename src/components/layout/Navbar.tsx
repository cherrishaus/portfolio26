"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto rounded-full px-16 pt-2 pb-4"
        style={{
          backgroundColor: "#FAFBFF",
          // Elevated — tray sits above the grid surface
          boxShadow: `
            0 2px 4px rgba(0, 12, 39, 0.06),
            0 6px 16px rgba(0, 12, 39, 0.10),
            0 16px 40px rgba(0, 12, 39, 0.08),
            0 1px 0px rgba(255,255,255,0.9) inset
          `,
        }}
      >
        {/* Nav links */}
        <ul className="flex items-center gap-24">
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
        <div className="relative mt-3" ref={trackRef}>
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
