# Design System — Focus Detector

## Product Context
- **What this is:** AI-powered desktop focus timer that detects distraction via active window monitoring and AI vision
- **Who it's for:** Developers and knowledge workers who need enforced focus sessions
- **Space/industry:** Productivity / focus tools (Forest, Session, Pomofocus, Flocus)
- **Project type:** Tauri 2 desktop app (Windows)

## Aesthetic Direction
- **Direction:** Dark Precision Glass — visionOS-inspired depth with layered translucent surfaces
- **Decoration level:** Intentional — specular highlights, blur layering, subtle glow. No additions needed.
- **Mood:** Elegant restraint. A control surface viewed through frosted glass. Every element has depth and purpose.

## Typography
- **Display/Hero:** Satoshi (Variable, 300–900) — geometric sans with optical warmth. Distinctive without being decorative.
- **Body:** Geist (Variable, 100–900) — purpose-built for dark interfaces. Excellent x-height, clear at small sizes.
- **UI/Labels:** Geist (same as body)
- **Data/Tables:** Geist Mono (Variable) — tabular figures for aligned numeric columns
- **Timer:** Geist Mono — digits don't shift width during countdown. Timer feels like an instrument.
- **Code:** Geist Mono
- **Loading:** Self-hosted in Tauri binary (no CDN dependency). During dev, load from:
  - Satoshi: `https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,900&display=swap`
  - Geist + Geist Mono: `https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap`
- **Scale:** 10px (muted labels) · 11px (mono timestamps) · 12px (form labels) · 13px (body/buttons) · 14px (default) · 16px (subheadings) · 20px (page titles) · 28px+ (hero display)
- **CSS variables:**
  ```css
  --font-display: 'Satoshi', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-body: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  ```

## Color
- **Approach:** Restrained (1 accent + neutrals)
- **Accent:** `#6366f1` (indigo) — primary actions, active states, timer ring
- **Accent light:** `#818cf8` — text highlights, hover states
- **Accent glow:** `rgba(99, 102, 241, 0.15)` — ambient glow on active elements
- **Success:** `#34d399` — on_task status, positive deltas
- **Warning:** `#fbbf24` — ambiguous status
- **Danger:** `#f87171` — off_task status, stop actions
- **Background:** `#0a0a12`
- **Surface:** `rgba(255, 255, 255, 0.045)` (glass), `#111119` (solid)
- **Text primary:** `#f0f0f5`
- **Text secondary:** `#8b8ca0`
- **Text muted:** `#55566a`
- **Borders:** `rgba(255, 255, 255, 0.08)` default, `rgba(255, 255, 255, 0.14)` hover
- **Dark mode:** This is a dark-only app. No light mode.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined — sidebar + content area
- **Sidebar:** 56px collapsed, 220px expanded (hover)
- **Max content width:** 1200px (main window)
- **Border radius:** sm:4px, md:8px, lg:12px, xl:16px, full:9999px

## Motion
- **Approach:** Intentional — Framer Motion with gentle easing
- **Easing:** enter(ease-out) exit(ease-in) move(cubic-bezier(0.4, 0, 0.2, 1))
- **Duration:** micro(100ms) short(150ms) medium(200ms) long(400ms)
- **Library:** framer-motion — whileTap, AnimatePresence, layout animations

## Glass Surface Specification (Liquid Glass)
Inspired by Apple's iOS 26 Liquid Glass — translated to CSS/React for Tauri.

### Base Glass
- Background: gradient from `white/9%` to `white/5%` to `white/7%`
- Backdrop: `blur(40px) saturate(1.8) brightness(1.08)`
- Border: `1px solid white/12%`
- Shadow: `inset 0 1px white/10%, 0 1px 3px black/30%, 0 8px 24px black/20%`
- Specular highlight: static diagonal gradient (default)

### Liquid Glass Features (GlassCard props)
- **`interactive`** — Pointer-tracking specular highlight. A radial gradient follows the cursor across the glass surface, simulating light refraction. Cards also compress slightly on press (`scale: 0.985`). Use on cards the user interacts with.
- **`tint`** — Accent color wash over the glass. 6% opacity overlay. Use to give contextual meaning (e.g., success tint on on-task cards, danger tint on alarm cards).
- **`glow`** — Accent-colored border glow for active/focused elements.
- **`hoverable`** — Subtle background shift on hover for clickable cards.

### When to Use Each
| Prop | Use Case |
|------|----------|
| Default (no props) | Static display cards, stat panels |
| `hoverable` | Clickable cards (profiles, settings) |
| `interactive` | Primary interaction surfaces (timer card, detection panel) |
| `glow` | Active/focused state (selected profile, running timer) |
| `tint` | Contextual color (status indicators, alarm states) |

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system created | Codified existing aesthetic + upgraded typography from Inter to Satoshi/Geist/Geist Mono |
| 2026-03-23 | Keep indigo accent (#6366f1) | User preference — existing palette works with the glass aesthetic |
| 2026-03-23 | Self-host fonts in Tauri binary | Desktop app should not depend on CDN for font loading |