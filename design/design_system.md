# C.K. Classes — Design System Specification
**Version 1.0** • *Minimal & Premium Coaching Management Platform*

This design system defines the visual language, layout standards, and component specifications for **C.K. Classes**. Inspired by Apple, Linear, Stripe, and Notion, it focuses on extreme clarity, high information density with ample breathing room, subtle micro-interactions, and a cohesive, premium feel.

---

## 1. Color Palette

Our color palette uses a refined Royal Blue as the primary brand identifier, representing trust, intelligence, and academic excellence. A vibrant Orange accent is used sparingly to draw attention to high-value actions, status alerts, or promotional features.

### Neutral Colors (Notion & Apple Inspired)
Used for backgrounds, text, borders, and structural components.

| Token | Hex Value | HSL | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#FFFFFF` | `0, 0%, 100%` | Page background, primary card surfaces, active state inputs |
| `--bg-secondary` | `#F8F9FA` | `210, 16%, 98%` | Global canvas background, sidebar backdrops, table headers |
| `--bg-tertiary` | `#F1F3F5` | `210, 14%, 96%` | Inactive states, code blocks, hover states for secondary buttons |
| `--border-light` | `#E4E7EC` | `220, 14%, 91%` | Default borders for cards, inputs, tables (subtle, clean) |
| `--border-strong` | `#D0D5DD` | `218, 11%, 83%` | Focused borders, dividers, secondary structural divisions |
| `--text-primary` | `#0F172A` | `222, 47%, 11%` | Headers, primary titles, body text demanding max readability |
| `--text-secondary` | `#475569` | `215, 16%, 34%` | Subtitles, labels, secondary information |
| `--text-tertiary` | `#94A3B8` | `215, 20%, 65%` | Captions, placeholders, disabled states, help text |

### Primary Color: Royal Blue (Stripe Inspired)
Conveys trust, stability, and professionalism.

| Token | Hex Value | HSL | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--blue-50` | `#EFF6FF` | `219, 100%, 97%` | Soft badge backgrounds, hover highlight states |
| `--blue-100` | `#DBEAFE` | `219, 100%, 93%` | Active toggle fills, select highlights |
| `--blue-500` | `#2563EB` | `221, 83%, 53%` | Primary buttons, brand accents, active menu links, focus rings |
| `--blue-600` | `#1D4ED8` | `221, 72%, 48%` | Primary buttons (Hover state) |
| `--blue-700` | `#1E40AF` | `224, 76%, 40%` | Primary buttons (Active/Pressed state) |

### Accent Color: Amber Orange (Linear Inspired)
Used for call-to-actions, warnings, or interactive highlights.

| Token | Hex Value | HSL | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--orange-50` | `#FFF7ED` | `33, 100%, 98%` | Light alert backgrounds, notification badges |
| `--orange-100` | `#FFEDD5` | `34, 100%, 91%` | Highlight tags |
| `--orange-500` | `#EA580C` | `20, 86%, 53%` | Action triggers, accent tags, warning borders |
| `--orange-600` | `#C2410C` | `20, 84%, 40%` | Accent actions (Hover state) |

### Semantic Utility Colors (Apple Inspired)
For instant recognition of status and states.

- **Success (Emerald Green):**
  - `--success-bg`: `#ECFDF5` (HSL: `156, 84%, 97%`)
  - `--success-text`: `#047857` (HSL: `162, 76%, 25%`)
  - `--success-solid`: `#10B981` (HSL: `160, 84%, 39%`)
- **Warning (Warm Yellow):**
  - `--warning-bg`: `#FFFBEB` (HSL: `48, 100%, 96%`)
  - `--warning-text`: `#B45309` (HSL: `37, 88%, 37%`)
  - `--warning-solid`: `#F59E0B` (HSL: `38, 92%, 50%`)
- **Danger/Error (Ruby Red):**
  - `--danger-bg`: `#FEF2F2` (HSL: `0, 100%, 97%`)
  - `--danger-text`: `#B91C1C` (HSL: `0, 72%, 41%`)
  - `--danger-solid`: `#EF4444` (HSL: `0, 84%, 60%`)

---

## 2. Typography

We use **Inter** as the primary font family. Typography is laid out with deliberate letter-spacing and strict line-heights to maintain maximum clarity and rhythm.

### Font Family Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Type Scale

| Size Label | Size (px) | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `48px` | `56px` | `700` (Bold) | `-0.02em` | Hero titles, large marketing headers |
| **Display Medium** | `36px` | `44px` | `700` (Bold) | `-0.02em` | Main dashboard titles |
| **Heading 1** | `30px` | `38px` | `600` (SemiBold)| `-0.015em` | Page header titles |
| **Heading 2** | `24px` | `32px` | `600` (SemiBold)| `-0.015em` | Major section headers, card groupings |
| **Heading 3** | `20px` | `28px` | `600` (SemiBold)| `-0.01em` | Standard card titles, modal headers |
| **Body Large** | `16px` | `24px` | `400` / `500` | `0` | Premium text blocks, intro summaries |
| **Body Default** | `14px` | `20px` | `400` (Regular) | `0` | Secondary body, metadata, form text |
| **Body Medium** | `14px` | `20px` | `500` (Medium) | `0` | Primary buttons, table headers, menu items |
| **Caption** | `12px` | `16px` | `400` / `500` | `+0.01em` | Table footers, timestamps, input helper text |
| **Badge / Mini** | `10px` | `12px` | `600` (SemiBold)| `+0.04em` | Uppercase headers, compact badges |

---

## 3. Spacing, Borders & Shadows

Our structural system is built on an **8px grid**, maintaining mathematical consistency across layouts.

### Spacing Scale
- `4px` (0.5rem) — Micro elements, inline spacing, badge vertical margins.
- `8px` (1rem) — Inner spacing of lists, spacing between labels and input fields.
- `12px` (1.5rem) — Layout spacing for subcomponents, dense forms padding.
- `16px` (2rem) — Default button paddings, default container inner padding, grid gaps.
- `24px` (3rem) — Large card padding, dashboard container grid padding.
- `32px` (4rem) — Major section header paddings, empty state padding.
- `48px` (6rem) — Hero sections, outer desktop layout margins.
- `64px` (8rem) — Max-width spacer sections.

### Border Radius (Apple-inspired roundness)
- `12px` to `16px` — Global standard for Cards, Modals, Sidebars, and main dashboard panels.
- `8px` — Standard for Buttons, Inputs, Select fields, and smaller elements.
- `6px` — For compact badges, small tags, tooltips.
- `9999px` — Pill badge formats, profile avatar frames, radio button shapes.

### Shadows & Elevation (Linear-style depth)
We use multi-layered shadows to give an ultra-premium, tactile feel without introducing heavy, dirty-looking gray blobs.

- **Elevation 1 (Buttons, Small Cards):**
  `box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);`
- **Elevation 2 (Standard Cards, Hover States):**
  `box-shadow: 0px 4px 8px -2px rgba(0, 0, 0, 0.04), 0px 2px 4px -2px rgba(0, 0, 0, 0.06);`
- **Elevation 3 (Dropdowns, Floating Popovers):**
  `box-shadow: 0px 12px 16px -4px rgba(0, 0, 0, 0.08), 0px 4px 6px -2px rgba(0, 0, 0, 0.03);`
- **Elevation 4 (Modals, Slide-overs):**
  `box-shadow: 0px 24px 48px -12px rgba(0, 0, 0, 0.16), 0px 0px 1px 0px rgba(0, 0, 0, 0.08);`

---

## 4. Components Specification

### 1. Buttons
Buttons represent core action points and are crafted with subtle gradients and crisp focus rings.

*   **Primary Button (Royal Blue):**
    *   *Normal:* Solid background `--blue-500`, white text, Elevation 1 shadow.
    *   *Hover:* `--blue-600` background. Scale down slightly on press (`transform: scale(0.98)`).
    *   *Active/Focus:* Focus ring with `3px` solid border using `--blue-100` separated by a white border.
    *   *Disabled:* Gray background `#F1F3F5`, gray text `#94A3B8`, shadow removed.
*   **Accent Button (Amber Orange):**
    *   *Normal:* Solid `--orange-500` background, white text.
    *   *Hover:* `--orange-600` background.
    *   *Active/Focus:* Focus ring in `--orange-100` color.
*   **Secondary Button (Outline / Minimalist):**
    *   *Normal:* Outline border using `--border-light`, white background, text `--text-primary`.
    *   *Hover:* Light gray background `--bg-tertiary`, text `--text-primary`.
    *   *Focus:* Subtle focus outline matching `--blue-500`.
*   **Tertiary Button (Ghost):**
    *   *Normal:* Transparent background, text `--text-secondary`, no borders.
    *   *Hover:* Transparent gray background `--bg-secondary`, text `--text-primary`.
    *   *Active:* Background `--bg-tertiary`.

### 2. Input Fields
Inputs require clean sizing, generous hitboxes, and obvious interactive states.

*   **Text / Number Inputs:**
    *   *Container:* Height `40px`, horizontal padding `12px`, border radius `8px`.
    *   *Default:* Border `1px solid --border-light`, background `--bg-primary`, text color `--text-primary`.
    *   *Placeholder Text:* Light gray `--text-tertiary`.
    *   *Hover:* Border updates to `--border-strong`.
    *   *Focus:* Border color transitions to `--blue-500`. Focus glow: `box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12)`.
    *   *Error State:* Border color `--danger-solid`, text `--danger-text`. Glow: `0 0 0 4px rgba(239, 68, 68, 0.12)`.
    *   *Disabled State:* Background `--bg-secondary`, border `--border-light`, text `--text-tertiary`, cursor `not-allowed`.
*   **Select / Dropdown Fields:**
    *   Same visual states as standard inputs. Include a custom chevron icon (width `16px`, height `16px`) aligned `12px` from the right edge.
*   **Checkbox & Radio Buttons:**
    *   Checkbox has `8px` rounded corners; Radio is fully circular (`9999px`).
    *   Size: `16px` x `16px`.
    *   *Unchecked:* Border `1px solid --border-strong`, white background.
    *   *Checked:* Background `--blue-500`, border color `--blue-500`. A crisp white checkmark or inner dot is centered inside.
*   **Toggle Switch (Apple Style):**
    *   Size: `36px` width, `20px` height.
    *   *Off State:* Background color `--border-strong`, white circular handle (`16px` x `16px`) shifted `2px` from left.
    *   *On State:* Background transitions to `--blue-500`. Handle moves `16px` to the right. Smooth spring-like animation (`cubic-bezier(0.4, 0, 0.2, 1)`).

### 3. Cards
Cards are container elements used to bundle info cleanly on backgrounds.

*   **Standard Card:**
    *   Background `--bg-primary`, border `1px solid --border-light`, border-radius `12px` or `16px`, padding `24px` (Space 5).
    *   Subtle bottom shadow (Elevation 1) to float gently above the canvas.
*   **Dashboard Metric Card (Stats Card):**
    *   Same outline and background.
    *   *Structure:*
      *   Top row: Label (e.g., "Active Students") in `--text-secondary`, font size `12px` (Medium), right-aligned icon in soft accent background.
      *   Middle row: Large bold number (e.g., "1,248") in `--text-primary`, font size `30px` (Bold).
      *   Bottom row: Growth indicator (e.g., "+12.4% this month") in `--success-text` or progress bar.
*   **Interactive / Hover Card:**
    *   Transitions to an Elevation 2 shadow on hover.
    *   Translates upward by `-2px` using CSS transitions (`transform 0.2s ease`).

### 4. Sidebar
Designed for low visual noise and maximum functional organization.

*   **Structure:**
    *   Width: `260px`. Background: `--bg-secondary` or `--bg-primary` with a right border `1px solid --border-light`.
    *   Top: Logo ("C.K. Classes" wordmark) in `--text-primary` with an orange-dot accent, alongside workspace switcher dropdown.
    *   Middle: Vertically stacked navigation links with Space 2 gaps.
    *   Bottom: User profile widget displaying name, role (e.g., "Admin", "Teacher"), and an avatar.
*   **Navigation Links (Apple/Linear Style):**
    *   Padding: `8px` vertical, `12px` horizontal. Rounded corners: `8px`.
    *   *Default State:* Text `--text-secondary`, font size `14px` (Medium). Left-aligned icon (color `--text-tertiary`).
    *   *Hover State:* Background `--bg-tertiary`, text `--text-primary`, icon `--text-secondary`.
    *   *Active State:* Background `--blue-50`, text `--blue-500`, icon `--blue-500`. A thin, blue accent pill (2px wide) highlights the left boundary of the item.

### 5. Navbar
Kept minimal to allow the workspace screen to breathe.

*   **Structure:**
    *   Height: `64px`. Background `--bg-primary` with backdrop-filter blur (`blur(8px)`) and opacity (`0.95`).
    *   Bottom border `1px solid --border-light`.
    *   *Left section:* Page title or contextual breadcrumbs (e.g., *Classes > Grade 12 Math*).
    *   *Middle section:* Search bar (Compact, width `240px`, hotkey label `⌘K` printed in text-tertiary).
    *   *Right section:* Notification icon (with a tiny orange counter badge), Help trigger, and Quick Action button ("Create Class" or "Add Student").

### 6. Tables
For administrative ease and dense lists.

*   **Header Row:**
    *   Background `--bg-secondary`. Bottom border `1px solid --border-light`.
    *   Typography: `--text-secondary`, size `12px` (Medium), uppercase with a letter spacing of `0.04em`.
*   **Rows:**
    *   Padding: `12px` vertical, `16px` horizontal.
    *   Dividers: Fine `1px solid --border-light` line between rows.
    *   *Hover State:* Background color highlights to `--bg-secondary` to track current focus easily.
*   **Status Badges & Actions:**
    *   Status badges are aligned left.
    *   Action triggers (edit, delete, view) are aligned right, grouped in tertiary/ghost buttons to minimize clutter.

### 7. Badges / Tags
Highly stylized indicators.

*   **Format:** Pill-style (fully rounded). Padding: `4px` vertical, `10px` horizontal. Typography: Size `12px`, Font Weight `500`.
*   **Color Theme Mapping:**
    *   *Success (Active/Paid):* Soft green background (`--success-bg`), green text (`--success-text`).
    *   *Warning (Pending/Late):* Soft orange background (`--orange-50`), orange text (`--orange-500`).
    *   *Danger (Overdue/Inactive):* Soft red background (`--danger-bg`), red text (`--danger-text`).
    *   *Neutral (Archived/Draft):* Soft gray background (`--bg-tertiary`), text `--text-secondary`.
    *   *Primary (Featured/Coaching Special):* Light blue background (`--blue-50`), text `--blue-500`.

### 8. Charts
Modern look with clean data presentation.

*   **Visual Style:**
    *   *Lines:* Thick vector paths (Stroke width `2.5px` to `3px`) in `--blue-500` or `--orange-500`.
    *   *Area Fill:* Gradient beneath line transitioning from brand color with opacity `0.15` down to `0.00` (Stripe style).
    *   *Gridlines:* Very faint border lines in `--border-light`.
    *   *Tooltips:* Clean, dark popover background (`#0F172A`), rounded borders (`8px`), displaying the exact scalar value in white text.

### 9. Forms
Structure for inputs.

*   **Grid Layout:**
    *   Use a 2-column grid layout for desktop forms (gap `24px` horizontal, `16px` vertical). Collapse to a single column on mobile.
*   **Labels & Helper Text:**
    *   Labels: Positioned above inputs, text color `--text-primary`, weight `500` (Medium), size `14px`.
    *   Helper/Error Text: Positioned below inputs, spacing `4px` top, size `12px`. Light gray for helpers, dark red (`--danger-text`) for validation errors.

### 10. Empty States
Clean, inviting placeholders when data is missing.

*   **Structure:**
    *   Centered container, padded by `48px` or `64px`.
    *   *Illustration/Icon:* Soft gray/blue-gray container (`--bg-secondary`) holding a simple icon (e.g., book, magnifying glass, or calendar).
    *   *Heading:* Size `18px` or `20px` (SemiBold), `--text-primary`.
    *   *Paragraph Description:* Clear microcopy detailing what content belongs here and how to start (size `14px`, `--text-secondary`).
    *   *Action CTA:* Single primary button centered below to encourage immediate onboarding (e.g., "Add First Course").

---

## 5. Micro-Interactions & Motion

All transitions must feel natural and snappy (Linear/Apple speed, not sluggish).
*   **Standard Interactive Transitions:** `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);` for buttons, links, inputs, and cards.
*   **Focus Animations:** Standard focus ring transitions use a subtle outward expand effect (transition from `0px` spread to `4px` spread).
*   **Sidebar Navigation Selection:** Active highlight slide transition is smooth (using CSS transition on background position or opacity).
*   **Page Transitions:** Subpage navigations should use a subtle vertical fade-in (`opacity` from `0` to `1` combined with `translateY(4px)` to `translateY(0)`).
