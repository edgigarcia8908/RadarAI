---

name: RadarAI

colors:

  surface: '#f9f9f9'

  surface-dim: '#dadada'

  surface-bright: '#f9f9f9'

  surface-container-lowest: '#ffffff'

  surface-container-low: '#f3f3f3'

  surface-container: '#eeeeee'

  surface-container-high: '#e8e8e8'

  surface-container-highest: '#e2e2e2'

  on-surface: '#1a1c1c'

  on-surface-variant: '#444937'

  inverse-surface: '#2f3131'

  inverse-on-surface: '#f1f1f1'

  outline: '#747965'

  outline-variant: '#c4c9b2'

  surface-tint: '#4d6700'

  primary: '#4d6700'

  on-primary: '#ffffff'

  primary-container: '#d4ff70'

  on-primary-container: '#587600'

  inverse-primary: '#acd54b'

  secondary: '#5f5e5e'

  on-secondary: '#ffffff'

  secondary-container: '#e2dfde'

  on-secondary-container: '#636262'

  tertiary: '#695969'

  on-tertiary: '#ffffff'

  tertiary-container: '#ffe9fc'

  on-tertiary-container: '#786777'

  error: '#ba1a1a'

  on-error: '#ffffff'

  error-container: '#ffdad6'

  on-error-container: '#93000a'

  primary-fixed: '#c7f264'

  primary-fixed-dim: '#acd54b'

  on-primary-fixed: '#151f00'

  on-primary-fixed-variant: '#394d00'

  secondary-fixed: '#e5e2e1'

  secondary-fixed-dim: '#c8c6c5'

  on-secondary-fixed: '#1c1b1b'

  on-secondary-fixed-variant: '#474746'

  tertiary-fixed: '#f2dcef'

  tertiary-fixed-dim: '#d5c0d3'

  on-tertiary-fixed: '#241724'

  on-tertiary-fixed-variant: '#514251'

  background: '#f9f9f9'

  on-background: '#1a1c1c'

  surface-variant: '#e2e2e2'

  accent-lime: '#D4FF70'

  surface-base: '#FFFFFF'

  text-main: '#1A1A1A'

  text-muted: '#666666'

  border-subtle: '#E5E5E5'

typography:

  headline-xl:

    fontFamily: Hanken Grotesk

    fontSize: 48px

    fontWeight: '700'

    lineHeight: 56px

    letterSpacing: -0.02em

  headline-lg:

    fontFamily: Hanken Grotesk

    fontSize: 32px

    fontWeight: '700'

    lineHeight: 40px

    letterSpacing: -0.01em

  headline-lg-mobile:

    fontFamily: Hanken Grotesk

    fontSize: 24px

    fontWeight: '700'

    lineHeight: 32px

  headline-md:

    fontFamily: Hanken Grotesk

    fontSize: 24px

    fontWeight: '600'

    lineHeight: 32px

  body-lg:

    fontFamily: Hanken Grotesk

    fontSize: 18px

    fontWeight: '400'

    lineHeight: 28px

  body-md:

    fontFamily: Hanken Grotesk

    fontSize: 16px

    fontWeight: '400'

    lineHeight: 24px

  body-sm:

    fontFamily: Hanken Grotesk

    fontSize: 14px

    fontWeight: '400'

    lineHeight: 20px

  label-md:

    fontFamily: Hanken Grotesk

    fontSize: 14px

    fontWeight: '600'

    lineHeight: 16px

    letterSpacing: 0.05em

  label-sm:

    fontFamily: Hanken Grotesk

    fontSize: 12px

    fontWeight: '500'

    lineHeight: 16px

rounded:

  sm: 0.125rem

  DEFAULT: 0.25rem

  md: 0.375rem

  lg: 0.5rem

  xl: 0.75rem

  full: 9999px

spacing:

  base: 8px

  container-max: 1280px

  gutter: 24px

  margin-mobile: 16px

  margin-desktop: 48px

  stack-sm: 12px

  stack-md: 24px

  stack-lg: 48px

---

## Brand & Style

The design system is engineered for a public transparency portal, prioritizing clarity, institutional trust, and high information density. The brand personality is objective, meticulous, and modern.

**RadarAI brand essence — "signal over noise":** the brand acts as a citizen radar over public contracting data. It scans the noise of thousands of records and raises a clear signal where citizens should look: territorial risk, veeduría opportunities, market concentration. The radar metaphor drives the visual identity — an orbiting sweep that detects a single lime echo against institutional olive. 

The aesthetic follows a **High-Contrast / Modern** approach. It leverages a crisp, white foundation to ensure legibility, using a vibrant lime-green accent to draw attention to interactive elements and critical data points. This creates a distinctive "Neo-Institutional" feel that departs from traditional, stodgy government portals in favor of a fast, accessible, and data-driven experience. Surfaces are flat and structural, relying on precise typography and color blocking rather than decorative effects.

## Logotype, Imagotype & Favicon

The mark is built on the **radar sweep + signal echo** concept. Design agents must generate three deliverables from this spec:

- **Isotipo (icon):** a flat radar device — two concentric arcs (or a complete ring plus a partial sweep arc) with a lime echo dot (`#D4FF70`) at the sweep's leading edge, drawn over olive (`#4D6700`) or on transparent with the arcs in olive. Geometric, no perspective, no gradients: flat color blocking only, consistent with the Neo-Institutional look.
- **Imagotipo (lockup):** isotopic mark to the left of the **RadarAI** wordmark in Hanken Grotesk Bold (700), charcoal `#1A1A1A`; the echo dot may be reused as the accent over the "AI" (same lime, never recolored).
- **Favicon:** the echo dot inside a simplified ring only — no sweep arc, no text. Must stay legible at 16px. Deliver 16×16, 32×32, and 180×180 (apple-touch) PNGs plus an SVG source.

Rules the agents must honor:

- Use only palette colors: olive `#4D6700`, lime `#D4FF70`, charcoal `#1A1A1A`, white `#FFFFFF`. Never introduce new hues.
- Monochrome variants (solid charcoal or solid white) are allowed for disabled states and footer marks.
- Minimum clear space is the height of the echo dot around the mark; minimum reproduction height is 24px for the imagotipo and 12px for the isotipo.
- Do not use the mark on noisy backgrounds; prefer white, `#F9F9F9`, or olive surfaces.
- The mark must NOT mimic or reference official Colombian state seals (Presidencia, SECOP, DIVIPOLA, Agencia Nacional de Contratación Pública) or imply official or endorsed identity — the brand is a citizen tool sharing data names, never an official body.

## Colors

The palette is dominated by a high-contrast relationship between white surfaces and deep charcoal text. 

- **Primary (Lime Green):** Used exclusively for high-priority calls to action, active states, and data highlights. It represents transparency and "green-lit" data.
- **Secondary (Charcoal):** Used for navigation bars, headers, and primary body text to provide a grounded, authoritative feel.
- **Neutral (Soft Gray):** Utilized for structural layout elements like table headers, card backgrounds, and input borders to maintain a clean hierarchy without overwhelming the user with pure black lines.
- **System States:** Error states should utilize a clear red (#E11D48), while success states should leverage the primary lime green when appropriate, or a more standard success green for semantic clarity.

## Typography

This design system uses **Hanken Grotesk** across all levels. Its sharp, contemporary geometry provides the professional "sans-serif" look requested while maintaining excellent legibility at small sizes for data-heavy tables.

- **Headlines:** Use Bold (700) weights with slight negative letter-spacing for a modern, editorial impact on landing pages.
- **Data Display:** Numerical data in tables should use the Regular (400) weight but can be set in `label-md` if high density is required.
- **Captions:** Use `label-sm` for legal disclaimers and metadata. 
- **Accessibility:** Ensure a minimum contrast ratio of 4.5:1 for all body text against its background.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to ensure data visualizations remain readable and don't stretch excessively.

- **Grid:** A 12-column system with 24px gutters.
- **Responsive Behavior:** 
  - **Desktop (1024px+):** 12 columns, 48px outer margins.
  - **Tablet (768px - 1023px):** 6 columns, 24px outer margins.
  - **Mobile (Up to 767px):** 2 columns, 16px outer margins.
- **Rhythm:** Use an 8px base unit. Vertical spacing between sections should be generous `stack-lg`) to prevent the portal from feeling cluttered, while data within cards should use tighter spacing `stack-sm`) to maximize visible information.

## Elevation & Depth

Depth is created through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Layers:** The base background is white `#FFFFFF`). Secondary containers or sidebars use the neutral gray `#F2F2F2`) to create separation.
- **Borders:** Use 1px solid borders `#E5E5E5`) to define cards and table rows.
- **Elevation:** When an element must appear "raised" (e.g., a modal or a dropdown), use a very soft, centered shadow: `0px 4px 20px rgba(0, 0, 0, 0.05)`. 
- **Interactivity:** Hover states for cards should transition from a subtle border to a slightly thicker, primary-colored border or a very faint lime tint background.

## Shapes

The shape language is **Soft**, utilizing small border radii to bridge the gap between "technical/precise" and "approachable/modern."

- **Standard Elements:** Buttons, inputs, and cards use a `0.25rem` (4px) radius.
- **Data Tags/Chips:** Use `rounded-xl` (12px) or a full pill-shape to distinguish them from functional buttons.
- **Visual Rhythm:** Avoid large, aggressive curves to maintain the institutional, structured look of the portal.

## Components

- **Buttons:** Primary buttons use the Lime Green background with Charcoal text. Secondary buttons use a Charcoal outline with no fill.
- **Input Fields:** Use a 1px border `#E5E5E5`). On focus, the border changes to Charcoal with a 2px Lime Green outer "glow" (non-blurred) to indicate activity.
- **Data Tables:** These are the core of the portal. Use zebra-striping with `#F2F2F2` for readability. Headers must be `label-md` with a subtle bottom border.
- **Cards:** White backgrounds with a 1px `#E5E5E5` border. No shadow in the default state.
- **Status Badges:** Use the Lime Green for "Active/Verified" statuses. For fiscal alerts, use a pale amber or red, but keep the text dark for legibility.
- **Search Bar:** A prominent component at the top of the portal. Use a large height (48px-56px) and a bold search icon to encourage user exploration of data.

