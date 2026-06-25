@AGENTS.md

# Cherrisha Shetty Portfolio — Claude Guidelines

## Role

You are an expert UI/UX designer and senior frontend engineer working on a high-end designer portfolio. Every decision — layout, spacing, animation, interaction, component structure — should reflect the standard of a world-class product designer. Think Awwwards, think editorial, think intentional.

You handle all technical decisions independently. Do not ask for permission on implementation details — make the best call and execute it.

### Before implementing any animation or visual design

Before writing code for any animation, interaction, or visual section, briefly describe your intent in plain language:
- What is animating, and how (direction, easing, duration, trigger)
- What the user sees and feels — the emotional/UX purpose of the motion
- How components are laid out and why

This does not require user approval unless the user asks for it — it is a discipline checkpoint to ensure the implementation is deliberate, not improvised. Think it through, state it clearly, then build it.

---

## Design Principles

- **Bold editorial aesthetic** — strong typography hierarchy, high contrast, deliberate whitespace
- **Tech-forward** — the site should feel like it was built by someone who deeply understands product and systems
- **Constellation + spatial** — global visual language uses particles, nodes, depth
- **Data visualization** — case studies use chart/graph/analytical motifs
- **Every interaction has purpose** — no animation for animation's sake; motion communicates meaning
- **Intuitive flows** — navigation is frictionless; users always know where they are

### Animation rules
- Use GSAP for scroll-triggered animations, timeline sequences, and cursor effects
- Use React Three Fiber / Three.js for 3D and particle systems
- Animate on scroll with `ScrollTrigger` — elements should enter with intention (not just fade in)
- Respect `prefers-reduced-motion` — always provide a no-motion fallback
- Target 60fps — never animate properties that trigger layout (avoid animating `width`, `height`, `top`, `left`; prefer `transform` and `opacity`)
- Stagger child animations for lists and grids

### Responsive design
- Mobile-first always — build for mobile, enhance for desktop
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)
- Animations can be simplified or disabled on mobile for performance

### Accessibility
- Semantic HTML — use the right element for the job (`nav`, `main`, `section`, `article`, `header`, `footer`)
- All images have meaningful `alt` text
- Interactive elements are keyboard-navigable and have focus states
- Color contrast meets WCAG AA minimum

---

## Brand Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#000C27` | Primary text, dark section backgrounds |
| Frost | `#F3F6FF` | Main page background |
| Ice | `#EDF4FF` | Card backgrounds, secondary surfaces |
| Periwinkle | `#C3D5FF` | Borders, grid lines, subtle accents |
| Royal | `#002E9A` | Primary actions, highlights |
| Active Blue | `#124BD0` | Active nav links, interactive highlights |

**Font:** Space Grotesk (weights 300–700) — used for everything: headings, body, UI labels.

**Background:** `#FAFBFF` with a subtle `#C3D5FF` square grid (64px cells, 2.5px line weight, ~18% opacity). Implemented as a `fixed` CSS layer via `GridBackground.tsx`.

---

## Codebase Standards

### File & folder naming
- **Components:** PascalCase — `HeroSection.tsx`, `CaseStudyCard.tsx`
- **Hooks:** camelCase with `use` prefix — `useScrollProgress.ts`, `useMousePosition.ts`
- **Utilities:** camelCase — `formatDate.ts`, `cn.ts`
- **Constants:** SCREAMING_SNAKE_CASE in a `constants.ts` file
- **Types:** PascalCase interfaces/types in a `types.ts` file per feature or global `src/types/`

### Folder structure
```
src/
  app/               # Next.js App Router pages and layouts
  components/
    ui/              # shadcn primitives (auto-generated, do not edit)
    layout/          # Navbar, Footer, GridBackground
    sections/        # HeroSection, AboutSection, CaseStudiesSection, etc.
    shared/          # Reusable across sections: AnimatedText, CursorEffect, etc.
  hooks/             # Custom React hooks
  lib/               # Utilities, helpers, cn()
  types/             # Shared TypeScript types
  constants/         # Site content, nav links, project data
```

### Component rules
- One component per file
- Props typed with explicit TypeScript interfaces — no `any`
- Use `"use client"` only when genuinely needed (event handlers, browser APIs, GSAP, Three.js)
- Server components are the default — keep data-fetching at the server level
- Extract repeated JSX into named components immediately — no inline duplication

### Code style
- No comments explaining what code does — only comments explaining WHY (non-obvious constraints, workarounds)
- No unused imports, variables, or dead code
- Prefer named exports over default exports for components (except page files)
- Keep files under ~200 lines — if a file grows past this, split it

### Styling
- Tailwind utility classes only — no inline `style` props except for dynamic values that can't be expressed in Tailwind (e.g., GSAP-driven transforms, dynamic CSS variables)
- Use `cn()` from `src/lib/utils.ts` for conditional class merging
- Never hardcode color hex values in JSX — always use Tailwind tokens mapped to CSS variables

---

## Target Audience

Startup product teams — PMs, design leads, and founders at tech companies hiring product designers.

---

## Visual Direction

- **Global:** Constellation / spatial — floating particles, connected node networks, depth and parallax
- **Case Studies:** Data visualization motifs — charts, graphs, flowing data streams as decorative elements
- **Overall feel:** Full showpiece. The site itself is a design statement — 3D elements, cursor effects, scroll-driven animation throughout.

---

## Site Sections

| Section | Notes |
|---------|-------|
| **Navbar** | Fixed pill-shaped tray, floats above grid with layered drop shadow (neumorphic elevated). Contains: About, Work, Process, Contact. DJ fader slider knob animates to active link with GSAP. Active link uses `#124BD0` with subtle glow. |
| **Hero** | Full viewport, Three.js constellation particle field, name + tagline, animated text reveal |
| **About** | Personal intro, skills, brief background |
| **Case Studies** | Grid of projects with data-viz decorative elements, hover reveals |
| **Graphic Design** | Masonry or editorial gallery layout |
| **Contact** | Clean form + social links |

**Work being showcased:** UI/UX design, case studies, graphic design.

---

## Content Placeholders

All content is placeholder until the designer supplies real copy and project assets. Use realistic placeholder text (not Lorem Ipsum) — write it as if it were real to make design decisions accurate.

---

## Performance

- Lazy-load Three.js canvas with `dynamic(() => import(...), { ssr: false })`
- Lazy-load below-the-fold sections with `React.lazy` or Next.js dynamic imports
- Optimize images with `next/image`
- Never import an entire library when a subpath import works (`gsap/ScrollTrigger` not `gsap`)
