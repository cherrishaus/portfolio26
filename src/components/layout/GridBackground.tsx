"use client";

export function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-full w-full"
      style={{
        backgroundColor: "#F3F6FF",
        backgroundImage: `
          linear-gradient(rgba(195, 213, 255, 0.18) 2.5px, transparent 2.5px),
          linear-gradient(90deg, rgba(195, 213, 255, 0.18) 2.5px, transparent 2.5px)
        `,
        backgroundSize: "64px 64px",
      }}
    />
  );
}
