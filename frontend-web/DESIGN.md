KoalaSwap UI Design — Warm Lifestyle (Option D)

Summary
- Tone: warm, friendly, trustworthy, community-oriented.
- Style: large radius, soft shadows, cardified content, gentle colors, consistent spacing and typography.
- Goal: improve conversion and comfort while keeping the product practical and performant.

Color Palettes (choose one; D1 recommended)
- D1 Terracotta + Sage (recommended; warmest, most approachable)
  - Primary (CTA): #D97757 (Terracotta)
  - Secondary: #84A98C (Sage)
  - Accent: #F59E0B (Honey), #FFF7ED (Koala Cream background)
  - Neutrals (warm grays):
    - Text Strong: #292524
    - Text Default: #44403C
    - Border: #E7E5E4
    - Surface: #FFFFFF
    - Background Base: #FAFAF9
  - Status
    - Success: #22C55E  | Success-bg: #ECFDF5
    - Warning: #D97706  | Warning-bg: #FFFBEB
    - Error:   #DC2626  | Error-bg:   #FEF2F2
    - Info:    #2563EB  | Info-bg:    #EFF6FF

- D2 Coral + Teal (more lively/young)
  - Primary: #FF6B6B (Coral)
  - Secondary: #2CB1BC (Teal)
  - Accent: #F8E1C2 (Sand), #D2F2EA (Mint)
  - Neutrals: 900 #1F2937, 700 #374151, 500 #9CA3AF, 200 #E5E7EB, 50 #FAFAF9

- D3 Rosewood + Olive (warmer premium)
  - Primary: #A44F4A (Rosewood)
  - Secondary: #6B8E23 (Olive)
  - Accent: #FFF9F0 (Ivory), #EADCCF (Latte)
  - Neutrals: 900 #1C1917, 700 #44403C, 500 #A8A29E, 200 #E7E5E4, 50 #FAFAF9

Design Tokens
- Radii
  - --radius-md: 10px
  - --radius-lg: 12px
  - --radius-xl: 16px
- Shadows
  - --shadow-1: 0 1px 2px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.06)
  - --shadow-2: 0 2px 8px rgba(0,0,0,.06), 0 8px 20px rgba(0,0,0,.08)
- Spacing scale (px): 4, 8, 12, 16, 20, 24, 32
- Typography
  - Titles: 28/32 (H1), 20/24 (H2)
  - Body: 14–16; Small: 12; Line-height 1.4–1.6
  - Suggested fonts: Titles Nunito/Rubik/Poppins; Body Inter/System UI

CSS Variables (D1 example)
```css
:root {
  /* Brand */
  --color-primary: #D97757;
  --color-primary-50: #FBEDE8;
  --color-primary-100: #F6E1DA;
  --color-primary-300: #E8B2A1;
  --color-primary-600: #C26245;
  --color-primary-700: #A3523A;

  --color-secondary: #84A98C;
  --color-secondary-50: #E9F3ED;
  --color-secondary-100: #DAECE2;
  --color-secondary-300: #B3D0BD;
  --color-secondary-700: #5C8366;

  /* Surfaces & text */
  --color-bg: #FAFAF9;
  --color-surface: #FFFFFF;
  --color-muted: #F5F5F4;
  --color-border: #E7E5E4;
  --color-text-strong: #292524;
  --color-text: #44403C;

  /* Status */
  --success: #22C55E; --success-bg: #ECFDF5;
  --warning: #D97706; --warning-bg: #FFFBEB;
  --error:   #DC2626; --error-bg:   #FEF2F2;
  --info:    #2563EB; --info-bg:    #EFF6FF;

  /* Focus ring */
  --ring: rgba(217, 119, 87, .35);

  /* Radii & shadows */
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --shadow-1: 0 1px 2px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.06);
  --shadow-2: 0 2px 8px rgba(0,0,0,.06), 0 8px 20px rgba(0,0,0,.08);
}
```

Tailwind Mapping (suggested)
```ts
// tailwind.config.ts (excerpt)
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          300: 'var(--color-primary-300)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)'
        },
        sage: {
          DEFAULT: 'var(--color-secondary)',
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          300: 'var(--color-secondary-300)',
          700: 'var(--color-secondary-700)'
        },
        surface: 'var(--color-surface)',
        bg: 'var(--color-bg)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        text: {
          DEFAULT: 'var(--color-text)',
          strong: 'var(--color-text-strong)'
        },
        success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)' },
        warning: { DEFAULT: 'var(--warning)', bg: 'var(--warning-bg)' },
        error:   { DEFAULT: 'var(--error)',   bg: 'var(--error-bg)' },
        info:    { DEFAULT: 'var(--info)',    bg: 'var(--info-bg)' }
      },
      borderRadius: {
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)'
      },
      boxShadow: {
        soft: 'var(--shadow-1)',
        float: 'var(--shadow-2)'
      }
    }
  }
}
```

Component Guidelines
- Buttons
  - Primary: brand-600 bg, text-white, hover: brighten, active: darken, shadow: soft
  - Secondary: sage-50 bg + sage-300 border, text sage-700, hover: sage-100
  - Ghost: transparent bg, brand-700 text for inline actions
- Inputs / Search
  - Rounded (lg), 12–14px padding, border border, focus-visible:ring [--ring] + soft shadow
  - Search: pill card; button uses primary color
- Cards
  - White surface, soft shadow, radius xl; hover: raise slightly + image scale 1.02
  - Product card: image 65–70%, info three lines, price prominent, chips for condition/status
- Chips / Tags
  - Capsule with subtle background (e.g., sage-50) and deep text (sage-700)
- Toast / Inline feedback
  - Status bg (success/warning/error/info) + dark text; avoid intrusive modals

Page Blueprints
- Auth (Login / Register)
  - Hidden global nav; simple page header (Logo + Continue browsing)
  - Two columns: emotion + copy (left), form card (right)
- Home
  - Hero with warm visual + one-sentence value + capsule search
  - Category chips (icons/illustra) as horizontal scroll
  - Product grid (2/3/4 columns responsive)
- Product Detail
  - Large gallery (rounded 16px), sticky price/CTA block
  - Seller trust block (avatar, rating, sales), warm copy for chat CTA
- Publish
  - Stepper (Info → Media → Price → Preview); right rail “Publishing tips” card
- Chat
  - Two columns (list + detail); bubble radius 16; product card pinned at top of thread
- Orders / Me
  - Timeline for order states; section cards for listings/favorites/orders/reviews

Motion & Accessibility
- Motion: 200–250ms, ease-out cubic-bezier(0.2, 0.8, 0.2, 1); keep subtle
- Focus: visible focus ring using --ring; keyboard reachable; semantic HTML
- Contrast: ensure ≥ 4.5:1 for text

Asset Direction
- Prefer warm photography or light illustrations (Koala IP) with neutral backgrounds
- Keep consistent style (lighting, color grading)

Implementation Checklist (suggested)
1) Add CSS variables to a global stylesheet (root level)
2) Map Tailwind theme to variables (as above)
3) Create primitives: Button, Input, Chip, Card, Tag, Toast
4) Apply to: Login/Register → Product Card → Product Detail → Header/Search → Home hero
5) Add skeletons and empty states (illustrations)
6) Verify a11y (focus, contrast) and responsive breakpoints (2/3/4 columns)

Notes
- Start with D1 palette; we can swap to D2/D3 by changing variables only.
- Dark mode is optional; if needed, define a .dark root with adjusted tokens.
