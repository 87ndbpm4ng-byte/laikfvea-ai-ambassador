# Laikfvea AI Product Specialist Design System

## 1. Purpose

This document is the visual and interaction source of truth for the Laikfvea AI Product Specialist, an iPad-first application used on exhibition kiosks.

The application helps visitors understand Laikfvea products through a guided AI conversation. It must feel calm, premium, credible, and effortless in a busy public environment. Every future screen, state, and component must follow this system unless a documented product requirement overrides it.

This document defines design standards only. It does not authorize application development.

## 2. Design Read

Reading this as: a public exhibition-kiosk product specialist for prospective customers, with an Apple-influenced Scandinavian wellness language, grounded in Laikfvea's clean brand presentation.

Design dials:

| Dial | Value | Meaning |
| --- | ---: | --- |
| Design variance | 5/10 | Structured and calm, with selective asymmetry |
| Motion intensity | 4/10 | Soft, responsive, and never theatrical |
| Visual density | 3/10 | Spacious, focused, and glanceable |

The system combines:

- Apple's clarity, direct manipulation, and disciplined hierarchy.
- Scandinavian minimalism through restraint, usefulness, and generous negative space.
- Premium wellness technology through calm pacing, clean product imagery, and reassuring language.
- Laikfvea brand continuity through white-led surfaces, Montserrat typography, a monochrome core, a quiet blue accent, and the established wordmark and overlapping-circle symbol.

Apple is an experience reference, not a visual asset source. Do not copy Apple layouts, icons, product imagery, or proprietary interface elements.

## 3. Core Experience Principles

### 3.1 One clear next action

Every screen must make the next useful action obvious within two seconds. A visitor should never need to understand the interface before using it.

### 3.2 Calm in a noisy environment

Exhibitions are visually and acoustically busy. The kiosk must reduce cognitive load through short copy, large type, strong contrast, stable layouts, and one focal action at a time.

### 3.3 Product truth over AI spectacle

The interface is a product specialist first and an AI interface second. Lead with products, benefits, evidence, and practical answers. Do not use glowing brains, robots, waveform decoration, fake intelligence indicators, or futuristic AI clichés.

### 3.4 Touch-first confidence

Controls must feel immediate and forgiving. Use large targets, generous separation, obvious states, and clear recovery paths. Never require hover, precision tapping, or hidden gestures.

### 3.5 Premium through restraint

Premium quality comes from typography, spacing, imagery, alignment, response quality, and motion timing. It does not come from gradients, glass effects, heavy shadows, excessive rounding, or decorative animation.

### 3.6 Public-session privacy

The kiosk is shared. Make session boundaries visible, avoid exposing previous visitor content, and provide a clear way to restart. Inactivity behavior must protect privacy without surprising an active visitor.

### 3.7 Accessible by default

Accessibility is part of the base system. WCAG 2.2 AA is the minimum. Text, controls, motion, focus, errors, timeouts, audio, and responsive behavior must all be designed for a wide public audience.

## 4. Brand Foundation

### 4.1 Brand assets

Use the official Laikfvea wordmark and overlapping-circle symbol exactly as provided by the brand asset package.

- Do not redraw, reinterpret, stretch, outline, animate, or recolor the mark without approval.
- Preserve the official clear-space and minimum-size rules when supplied.
- Until official production assets are present, use a clearly labeled placeholder. Do not approximate the logo in code.
- Use a single-color black mark on white as the default treatment.
- A white reversed mark is permitted only on approved black product imagery or black utility surfaces.

### 4.2 Brand character

The experience should feel:

- Calm, not passive.
- Expert, not clinical.
- Premium, not exclusive.
- Technological, not futuristic.
- Helpful, not conversationally overfamiliar.
- Minimal, not empty.

### 4.3 Brand non-negotiables

- White is the dominant background.
- Montserrat is the only interface type family.
- Primary actions are black.
- `#7EAFC3` is the signature accent.
- No gradients.
- No glassmorphism or backdrop blur.
- No heavy or dramatic shadows.
- No decorative glow.
- No dark-mode theme for the public kiosk experience.

## 5. Design Tokens

All implementation values must map to semantic tokens. Components must not introduce one-off colors, spacing values, radii, typography, shadows, or animation timing without documenting the reason.

### 5.1 Token naming

Use intent-based names:

```css
--color-bg-canvas
--color-bg-subtle
--color-text-primary
--color-text-secondary
--color-action-primary
--space-6
--radius-control
--duration-fast
```

Do not use presentation-only names such as `--light-blue`, `--gray-3`, or `--big-gap` inside component APIs.

### 5.2 Reference token set

```css
:root {
  color-scheme: light;

  /* Colour */
  --color-bg-canvas: #FFFFFF;
  --color-bg-subtle: #F6F8F9;
  --color-bg-muted: #EEF2F3;
  --color-bg-inverse: #111111;

  --color-text-primary: #111111;
  --color-text-secondary: #4E5558;
  --color-text-tertiary: #697277;
  --color-text-inverse: #FFFFFF;
  --color-text-link: #345F72;

  --color-border-subtle: #E3E8EA;
  --color-border-strong: #B8C2C6;

  --color-accent: #7EAFC3;
  --color-accent-soft: #EAF3F6;
  --color-accent-strong: #345F72;

  --color-success: #216E4E;
  --color-success-soft: #E9F5EF;
  --color-warning: #7A4D00;
  --color-warning-soft: #FFF4D6;
  --color-danger: #A12626;
  --color-danger-soft: #FCECEC;

  --color-focus: #345F72;
  --color-disabled-bg: #E8ECEE;
  --color-disabled-text: #777F83;

  /* Typography */
  --font-family-sans: "Montserrat", Arial, sans-serif;

  --font-size-display: 3.5rem;
  --font-size-h1: 3rem;
  --font-size-h2: 2.25rem;
  --font-size-h3: 1.75rem;
  --font-size-title: 1.375rem;
  --font-size-body-lg: 1.25rem;
  --font-size-body: 1.125rem;
  --font-size-label: 1rem;
  --font-size-caption: 0.875rem;

  --line-height-display: 1.08;
  --line-height-heading: 1.15;
  --line-height-body: 1.5;
  --line-height-label: 1.3;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;

  /* Shape */
  --radius-control: 0.75rem;
  --radius-panel: 1rem;
  --radius-media: 1.25rem;
  --radius-pill: 999px;

  /* Borders and elevation */
  --border-width: 1px;
  --shadow-float: 0 8px 24px rgb(17 17 17 / 0.08);

  /* Motion */
  --duration-instant: 80ms;
  --duration-fast: 160ms;
  --duration-base: 240ms;
  --duration-slow: 400ms;
  --duration-reveal: 560ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* Layout */
  --content-max: 75rem;
  --reading-max: 42rem;
  --touch-target-min: 3.5rem;
  --control-height: 4rem;
  --header-height: 5rem;
}
```

## 6. Colour System

### 6.1 Core palette

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Canvas | `bg-canvas` | `#FFFFFF` | Default page background |
| Subtle surface | `bg-subtle` | `#F6F8F9` | Grouped content, input areas |
| Muted surface | `bg-muted` | `#EEF2F3` | Selected neutral states, skeletons |
| Primary text | `text-primary` | `#111111` | Headings, body, primary actions |
| Secondary text | `text-secondary` | `#4E5558` | Supporting copy |
| Tertiary text | `text-tertiary` | `#697277` | Metadata, only at accessible sizes |
| Primary action | `action-primary` | `#111111` | Primary buttons |
| Brand accent | `accent` | `#7EAFC3` | Selection, illustration, progress, highlights |
| Accessible accent | `accent-strong` | `#345F72` | Links, focus, accent text |
| Soft accent | `accent-soft` | `#EAF3F6` | Selected backgrounds and callouts |

### 6.2 Accent usage

`#7EAFC3` is visually subtle but does not provide sufficient contrast for normal text on white. Therefore:

- Use `#7EAFC3` for non-text brand accents, progress indicators, large icons, selected borders, and decorative areas.
- Use `#345F72` for links, focus rings, small icons, and text that needs an accent color.
- Use black for primary actions. Do not turn the blue accent into a competing primary button color.
- Accent usage should occupy less than 10 percent of a typical screen.
- Do not introduce purple, cyan, teal, or additional brand accents.

### 6.3 Semantic colour

Success, warning, and danger colors communicate system meaning only. Pair every semantic color with an icon and plain-language label.

- Do not use brand blue for errors or success.
- Never communicate state through color alone.
- Avoid red for reversible selection states.
- Keep semantic surfaces pale and text/icons dark enough for WCAG AA.

### 6.4 Prohibited colour treatments

- No gradients of any kind.
- No transparent frosted panels.
- No neon or outer glow.
- No pure color field behind long-form text.
- No random section color changes.
- No dark page theme unless a future physical-installation requirement explicitly demands it.

## 7. Typography

### 7.1 Font family

Montserrat is mandatory across all visible interface text.

Preferred implementation:

- Self-host WOFF2 files or use the framework's optimized font loader.
- Load only weights 400, 500, 600, and 700.
- Use `font-display: swap`.
- Include Arial as the fallback.
- Reserve sufficient layout space to prevent font-swap movement.

### 7.2 Typography scale

The base scale is optimized for a kiosk viewed at arm's length on an iPad-sized display.

| Style | Size | Line height | Weight | Typical use |
| --- | ---: | ---: | ---: | --- |
| Display | 56px | 1.08 | 600 | Welcome statement, short product moment |
| H1 | 48px | 1.15 | 600 | Screen title |
| H2 | 36px | 1.15 | 600 | Major section |
| H3 | 28px | 1.2 | 600 | Product or panel heading |
| Title | 22px | 1.3 | 600 | Component title |
| Body large | 20px | 1.5 | 400 | Introductory and AI response text |
| Body | 18px | 1.5 | 400 | Standard copy |
| Label | 16px | 1.3 | 600 | Buttons, fields, controls |
| Caption | 14px | 1.4 | 500 | Short metadata only |

### 7.3 Responsive type

- Use the full scale at 768px and above.
- At widths below 768px, reduce Display to 44px, H1 to 40px, and H2 to 32px.
- Do not reduce body text below 17px on the kiosk.
- Avoid fluid type that becomes unpredictable. If using `clamp()`, cap values to this scale.
- Keep headings to two lines when possible.
- Keep AI response paragraphs to a maximum width of 42rem.

### 7.4 Typographic behavior

- Use sentence case.
- Use tight but not compressed headline tracking, between `-0.02em` and `-0.01em`.
- Use normal body tracking.
- Do not use all caps for sentences or primary actions.
- Small uppercase labels are permitted only for short real metadata and must use at least 14px.
- Use bold sparingly. Hierarchy should come from size, spacing, and position.
- Do not mix font families or insert a contrasting typeface for emphasis.
- Do not use decorative italics.
- Avoid paragraphs longer than 60 words on a single kiosk screen.

## 8. Spacing System

### 8.1 Base unit

Use a 4px atomic unit and an 8px primary rhythm. Standard component and layout spacing must come from the token scale.

### 8.2 Spacing roles

| Context | Preferred tokens |
| --- | --- |
| Icon to label | 8-12px |
| Label to helper text | 8px |
| Related controls | 12-16px |
| Button group | 16px |
| Card or panel padding | 24-32px |
| Content group separation | 32-48px |
| Section separation | 64-96px |
| Major screen breathing room | 96-128px |

### 8.3 Whitespace rules

- Whitespace must clarify groups and focus, not merely make the screen look sparse.
- Prefer spacing and alignment over boxes.
- A typical kiosk screen should have one dominant content region and one action region.
- Do not fill unused space with decoration.
- Keep related content visually close enough to read as one task.
- Never compress controls to fit more options. Reduce choices or introduce progressive disclosure.

## 9. Layout System

### 9.1 Primary target

Design first for:

- iPad landscape: 1024 x 768 CSS pixels.
- iPad portrait: 768 x 1024 CSS pixels.
- Full-screen standalone or kiosk browser mode.
- Touch input with no keyboard or mouse assumed.

Validate also at:

- 820 x 1180 portrait.
- 1180 x 820 landscape.
- 1280 x 800 exhibition display.
- 390 x 844 as a narrow fallback, not the primary experience.

### 9.2 Safe canvas

- Use `min-height: 100dvh`.
- Respect `env(safe-area-inset-*)`.
- Keep critical controls at least 24px from physical screen edges.
- Base outer padding: 32px portrait, 40px landscape.
- Reduce outer padding to 20px only below 600px.
- Maximum content width: 1200px.
- Maximum reading width: 672px.

### 9.3 Grid

Use a 12-column grid for landscape and an 8-column grid for portrait.

Landscape:

- 12 columns.
- 24px gutters.
- 40px outer margins.

Portrait:

- 8 columns.
- 20px gutters.
- 32px outer margins.

Narrow fallback:

- 4 columns.
- 16px gutters.
- 20px outer margins.

Use CSS Grid for structure. Avoid percentage calculations in flex layouts.

### 9.4 Composition

- Default to left-aligned content.
- Center alignment is reserved for the welcome screen, completion moments, and single-question prompts.
- Use asymmetry only when it strengthens product focus or reading order.
- Keep the primary action within the lower two-thirds of the screen without placing it too close to the bottom edge.
- Avoid more than two primary columns on iPad.
- Do not place essential controls in a narrow side rail.
- Do not require scrolling to find the main action.

### 9.5 Screen anatomy

A standard screen may include:

1. Persistent brand header.
2. Optional session utility action.
3. Main title or question.
4. Primary content or AI response.
5. Contextual controls.
6. Primary action area.
7. Optional progress or privacy message.

Not every screen needs every region. Remove regions that do not support the current task.

### 9.6 Scrolling

- Prefer one-screen tasks.
- If content must scroll, keep the header stable and make the scroll region obvious through content clipping, not a “scroll” label.
- Never use horizontal scroll for core navigation.
- Avoid nested scrolling.
- Preserve the visitor's place when expanding details.
- Keep the primary action visible only when doing so does not cover content.

## 10. Touch and Input

### 10.1 Target sizes

- Minimum interactive target: 56 x 56px.
- Preferred primary control height: 64px.
- Minimum space between separate targets: 12px.
- Icon-only controls: at least 56 x 56px with a visible label or accessible name.
- Product choice tiles: at least 104px tall.

The 44px WCAG minimum is a fallback floor, not the kiosk standard.

### 10.2 Touch behavior

- Provide visible pressed feedback immediately, within 80ms.
- Keep targets stable during interaction.
- Do not place destructive actions adjacent to primary actions.
- Do not rely on double tap, long press, pinch, swipe, or drag for essential tasks.
- If a gesture is offered, provide an equivalent visible control.
- Prevent accidental repeated submissions while clearly showing progress.

### 10.3 On-screen keyboard

- Avoid text entry where a choice, topic suggestion, or voice option is sufficient.
- When text entry is necessary, keep the active field and submission control visible above the keyboard.
- Use the correct input mode.
- Provide a clear keyboard dismissal path.
- Do not clear entered text after a recoverable error.

## 11. Component Guidelines

### 11.1 Buttons

#### Primary button

- Black background `#111111`.
- White label.
- Minimum 64px height.
- Horizontal padding 28-32px.
- 12px radius.
- Montserrat 16-18px, weight 600.
- One icon maximum, placed before or after the label based on meaning.
- Use once per decision area.

States:

- Default: black background.
- Hover where available: `#242424`.
- Pressed: `#2E2E2E`, scale to `0.98`.
- Focus: 3px `#345F72` outer ring with 2px white separation.
- Loading: retain width, show progress beside the unchanged label or replace with a specific active label.
- Disabled: `#E8ECEE` background with `#777F83` text.

#### Secondary button

- White background.
- Black label.
- 1px `#B8C2C6` border.
- Same height, type, padding, and radius as primary.
- Pressed state uses `#F6F8F9`.

#### Tertiary button

- Text and optional icon.
- No container by default.
- Minimum 56px target maintained through padding.
- Use `#345F72` for link-like actions or black for neutral utilities.

Rules:

- Labels should use one to three words where possible.
- Labels must stay on one line.
- Use verb-first labels: “Compare products”, “Ask a question”, “Start over”.
- Do not show two actions with the same intent using different labels.
- Do not use blue filled primary buttons.
- Do not use pill buttons for standard actions.

### 11.2 Choice tiles

Use for product categories, suggested questions, or guided answers.

- White or subtle surface background.
- 1px subtle border.
- 16px radius.
- 24px minimum padding.
- Left-aligned label and supporting text.
- Optional product image or single icon.
- Entire tile is one target.

Selected state:

- `#EAF3F6` background.
- `#7EAFC3` 2px border.
- Black text.
- Check icon in `#345F72`.

Do not use shadows to imply clickability. Use border, spacing, pointer response, and pressed feedback.

### 11.3 Product cards

Product cards present a real item and must contain:

- Approved product image.
- Product name.
- One short differentiator.
- One action or whole-card selection behavior.

Rules:

- Use an image-first composition.
- Do not overlay labels on the image.
- Keep photography on white or approved neutral backgrounds.
- Avoid equal grids of three generic cards. On iPad, use one featured product plus a clearly structured alternative set, or a two-column comparison.
- Do not invent specifications or performance claims.

### 11.4 AI response block

The AI response should read like a knowledgeable specialist, not a chat transcript by default.

- Use a clean content region without a speech bubble.
- Body large style, maximum 42rem width.
- Break long answers into a short answer, optional bullets, and one next action.
- Use bold only for scan points.
- Show sources or product references directly below the relevant claim.
- If confidence is limited, state the limitation plainly.
- Never show internal model reasoning.

For multi-turn history:

- Distinguish visitor prompts with a subtle blue surface or compact label.
- Keep AI answers on white.
- Avoid alternating bubble colors.
- Collapse older turns when the current task needs more room.

### 11.5 Prompt composer

- Minimum 64px control height.
- White field on a subtle surface or subtle field on white, never white on white without a border.
- 1px strong border at rest.
- 3px accessible blue focus ring.
- Placeholder is an example, not the only label.
- Submission button remains visually separate and at least 56px square.
- Voice input, if present, uses a labeled microphone control and clear listening state.

### 11.6 Suggested prompts

- Show three to five relevant prompts.
- Use large choice tiles or secondary buttons.
- Keep each prompt under eight words.
- Tailor prompts to the current product or topic.
- Do not use an endlessly scrolling carousel or marquee.

### 11.7 Header

- Height: 80px.
- White background.
- Official logo aligned left.
- One utility action aligned right, normally “Start over” or language selection.
- No full website navigation on a guided kiosk.
- Use a subtle bottom border only when the header needs separation from scrolling content.

### 11.8 Progress

- Use progress only for a genuine multi-step guided flow.
- Prefer a short text label such as “2 of 4” plus a thin 4px track.
- Use `#7EAFC3` for completed progress and `#E3E8EA` for the remainder.
- Do not show decorative completion percentages.
- Do not animate progress continuously.

### 11.9 Dialogs

- Use only for blocking confirmation, privacy, language, or critical recovery.
- Width: 520-640px on iPad.
- White background, 16px radius, 1px border.
- Optional subtle shadow token only.
- Clear title, concise body, primary action, and safe secondary action.
- Initial focus follows the safest logical action.
- Trap focus and restore it on close.
- Do not use full-screen blur behind the dialog. Use a solid translucent black scrim at 20-30 percent.

### 11.10 Toasts and banners

- Toasts are for brief, non-critical confirmation only.
- Persistent or actionable problems use inline banners.
- Banners include icon, title, message, and recovery action where possible.
- Do not hide errors automatically.
- Never stack more than two toasts.

### 11.11 Loading

- Use skeletons shaped like the expected content for delays above 500ms.
- Use a concise status sentence for AI generation: “Preparing your answer”.
- Keep layout dimensions stable.
- After 8 seconds, add reassurance or a recovery option.
- Do not use an ornamental AI animation.
- Never show indefinite progress without a way to restart after failure.

### 11.12 Empty, offline, and error states

Each state needs:

- Plain-language title.
- One sentence explaining what happened.
- One recommended recovery action.
- Optional secondary action.
- An icon only when it aids recognition.

Offline mode should distinguish:

- Product content still available locally.
- AI answers temporarily unavailable.
- Full service unavailable.

Do not blame the visitor or expose raw technical errors.

## 12. AI Interaction Patterns

### 12.1 Welcome state

The welcome screen should include:

- Laikfvea logo.
- One concise invitation.
- One short supporting sentence.
- One black primary action.
- Optional language control.
- One strong product or lifestyle image when approved assets are available.

Keep all core content visible without scrolling in both iPad orientations.

### 12.2 Guided discovery

Use guided choices before open text when the visitor's goal is unknown.

Recommended sequence:

1. Ask what the visitor wants to improve or understand.
2. Offer three to five meaningful choices.
3. Present the best-fit product or explanation.
4. Invite a follow-up question, comparison, or staff handoff.

Do not label visible steps “Step 1”, “Step 2”, or similar unless progress is operationally important.

### 12.3 Product recommendation

Every recommendation must separate:

- Recommended product.
- Why it fits the stated need.
- Relevant evidence or specifications.
- Important limitation or condition.
- Next action.

Never imply medical diagnosis, treatment, or guaranteed wellness outcomes. Use approved claims only.

### 12.4 Comparison

- Compare two products at a time on iPad.
- Lead with meaningful differences, not a long specification table.
- Group facts under clear topics.
- Use check icons only for actual included features.
- Keep values aligned for scanning.
- Provide a plain summary of which visitor need each product serves.

### 12.5 Staff handoff

When the visitor needs human help:

- Explain why staff assistance may help.
- Use one clear “Ask a specialist” action.
- Confirm that the request was sent or show how to find staff.
- Do not collect personal details unless operationally required and consented.

### 12.6 Session ending

Provide a visible “Start over” action throughout the experience.

At session end:

- Confirm completion.
- Offer one clear restart action.
- Remove visitor-entered content after the approved timeout.
- Return to the welcome state.
- Do not expose previous prompts during attract mode.

## 13. Motion and Micro-Interactions

### 13.1 Motion principles

Motion must communicate one of four things:

- A touch was received.
- Content entered or changed.
- The system is working.
- The user moved between clear states.

If an animation does not improve understanding or feedback, remove it.

### 13.2 Motion character

Motion should feel soft, composed, and physically credible.

- Prefer ease-out movement.
- Keep travel distances short, typically 8-20px.
- Animate only `transform` and `opacity`.
- Avoid bounce, elastic overshoot, parallax, scroll hijacking, and looping decoration.
- Never animate gradients because gradients are not part of this system.
- Avoid large-scale zooms.

### 13.3 Timing

| Interaction | Duration | Treatment |
| --- | ---: | --- |
| Touch acknowledgement | 80-120ms | Scale or tone shift |
| Button and control state | 160ms | Standard ease |
| Panel or content change | 240ms | Fade plus 8px movement |
| Dialog enter | 240ms | Fade plus subtle scale from 0.98 |
| Dialog exit | 160ms | Faster fade |
| Screen transition | 320-400ms | Shared directional transition |
| Initial content reveal | Up to 560ms | Stagger only meaningful groups |

### 13.4 Premium micro-interactions

Approved patterns:

- Buttons compress to `0.98` on press and return smoothly.
- Choice tiles shift from subtle border to accent selection with a short check reveal.
- Product images may scale up by no more than 1.015 on selection where hover exists.
- AI answer content fades in by logical group, not character by character.
- The send control acknowledges touch before entering a stable loading state.
- Focus rings transition in quickly but never pulse.
- Successful completion may use one short icon stroke or opacity reveal.

Prohibited patterns:

- Magnetic cursor effects.
- Text scrambling or typewriter effects.
- Floating particles.
- Continuous breathing cards.
- Auto-rotating product carousels.
- Confetti.
- Animated background blobs.
- Decorative marquees.

### 13.5 Reduced motion

Honor `prefers-reduced-motion: reduce`.

- Remove movement and scale.
- Keep opacity transitions at 100ms or make changes instant.
- Replace animated progress with static status.
- Never make information dependent on animation.

## 14. Iconography

### 14.1 Icon family

Use one outline family throughout the application. Phosphor Icons is the preferred choice because it offers clear, friendly geometry and broad coverage.

- Default weight: regular.
- Default stroke character: visually equivalent to 1.75-2px at 24px.
- Standard icon sizes: 24px, 28px, and 32px.
- Heroic or empty-state icon maximum: 48px.
- Do not mix Phosphor with another family.
- Do not hand-draw SVG paths for interface icons.

### 14.2 Icon use

- Pair unfamiliar icons with labels.
- Use icon-only buttons only for universally recognized actions and always provide an accessible name.
- Use filled icons only for selected or confirmed state when the meaning remains clear.
- Do not use icons as decoration between text blocks.
- Do not use emojis as interface icons.
- Do not put icons inside decorative circles unless the circle communicates a target or state.

### 14.3 Brand symbol

The Laikfvea overlapping-circle mark is a brand asset, not an interface icon. Do not use it for close, send, loading, selection, or status actions.

## 15. Imagery and Product Presentation

### 15.1 Product imagery

- Use approved, high-resolution product renders or photography.
- Prefer white or very light neutral environments.
- Show true proportions, materials, controls, and use context.
- Maintain consistent lighting direction and color temperature.
- Reserve image dimensions to prevent layout shift.
- Use image crops designed for both portrait and landscape iPad.

### 15.2 Wellness imagery

Show credible human contexts with calm, natural behavior.

- Avoid clinical stock photography unless the product context is clinical.
- Avoid exaggerated happiness, pseudo-scientific imagery, and medical symbolism.
- Represent a broad audience authentically.
- Do not imply outcomes the product cannot substantiate.

### 15.3 Image accessibility

- Product images need concise alt text naming the product and relevant visible detail.
- Decorative atmosphere images use empty alt text.
- Do not repeat adjacent text in alt text.
- Never encode essential labels inside images.

## 16. Accessibility

### 16.1 Standard

Target WCAG 2.2 AA for all screens and interactions.

### 16.2 Contrast

- Normal text: at least 4.5:1.
- Large text: at least 3:1.
- UI components and focus indicators: at least 3:1 against adjacent colors.
- Use `#345F72`, not `#7EAFC3`, for accent text on white.
- Test real states, including disabled, error, selected, and focus.

### 16.3 Focus and keyboard

Even on a touch-first kiosk, all functionality must support keyboard navigation.

- Use a visible 3px `#345F72` focus indicator with 2px separation.
- Preserve logical DOM and focus order.
- Do not remove outlines without a replacement.
- Keep focus inside modal dialogs.
- Return focus after dialogs close.
- Provide a skip link if a persistent header precedes substantial content.

### 16.4 Structure

- Use semantic landmarks.
- Maintain one H1 per screen.
- Keep heading levels sequential.
- Use buttons for actions and links for navigation.
- Associate all labels, helper text, and errors programmatically.
- Announce async AI status through an appropriate live region without repeatedly interrupting the user.

### 16.5 Time limits

Public kiosk sessions may time out, but visitors must receive:

- A visible warning before reset.
- At least 20 seconds to extend the session.
- A large “Continue session” control.
- No reset while speech, typing, or an active interaction is detected.
- Immediate content clearing only after the warning expires.

Timeout behavior must be reviewed against WCAG timing requirements and exhibition privacy policy.

### 16.6 Audio and voice

If voice interaction is implemented:

- Always provide an equivalent touch and text path.
- Show clear listening, processing, and stopped states.
- Provide captions or text for spoken output.
- Never autoplay speech from the welcome screen.
- Make volume and stop controls visible.
- Avoid collecting audio before explicit visitor action.

### 16.7 Language

- Use plain language and short sentences.
- Avoid jargon without explanation.
- Do not communicate errors by code or technical terminology.
- Support localization without fixed-width text containers.
- Allow 30 percent expansion for translated labels.

## 17. Kiosk-Specific Operational States

The design system must cover:

### 17.1 Attract mode

- Quiet, static or minimally animated.
- Laikfvea brand and one invitation.
- No previous-session content.
- No audio autoplay.
- One obvious touch target to begin.

### 17.2 Active session

- Visible “Start over” utility.
- Clear current task.
- Stable header and content hierarchy.
- No browser chrome or external navigation.

### 17.3 Inactivity warning

- Blocking dialog.
- Clear countdown in text.
- Large “Continue session” primary button.
- Secondary “End session” action.
- Countdown announced accessibly without noisy per-second announcements.

### 17.4 Offline state

- Preserve locally available product information.
- Explain which AI features are unavailable.
- Offer retry and staff assistance.
- Show connection recovery without forcing a full restart.

### 17.5 Maintenance mode

- Branded white screen.
- Short unavailable message.
- Staff-facing recovery information behind a protected action, not visible by default.
- No raw system logs or credentials.

### 17.6 Reset state

- Clear all visitor prompts and generated personal context.
- Return navigation, scroll, input, and language to approved defaults.
- Confirm no previous content flashes during reset.

## 18. Content and Voice

### 18.1 Voice

Laikfvea speaks with calm expertise.

- Direct.
- Reassuring.
- Specific.
- Respectful.
- Brief.
- Honest about uncertainty.

### 18.2 Copy rules

- Lead with the answer.
- Keep screen introductions under 25 words.
- Keep button labels under three words where possible.
- Use concrete verbs.
- Use approved product names and claims.
- Explain technical features through visitor benefit, then offer detail.
- Avoid hype such as “revolutionary”, “game-changing”, “unleash”, “next-gen”, and “seamless”.
- Avoid fake metrics, testimonials, clinical claims, and invented specifications.
- Do not use decorative punctuation or emoji.
- Use regular hyphens for ranges and compound terms.

### 18.3 AI disclosure

Disclose AI use where it affects trust or expectations.

- Explain that responses are generated from approved product information.
- Provide a path to a human specialist.
- Mark uncertainty or missing information.
- Do not claim medical, legal, or diagnostic authority.

## 19. Responsive Rules

### 19.1 Landscape iPad

- Use two columns when a product visual and decision content benefit from equal attention.
- Keep the main action near the content it completes.
- Maintain 40px outer margins and 24px gutters.
- Avoid a dense desktop navigation bar.

### 19.2 Portrait iPad

- Prefer a single content column.
- Product imagery may occupy the upper 35-45 percent of the screen.
- Keep actions below content in natural reading order.
- Use 32px outer margins.
- Avoid fixed side panels.

### 19.3 Narrow screens

- Collapse to one column.
- Reduce outer padding, not touch target size.
- Keep body text at 17px or larger.
- Allow buttons to become full width.
- Keep labels on one line by shortening copy, not shrinking text.

### 19.4 Large displays

- Do not scale every element proportionally.
- Keep reading width controlled.
- Increase outer whitespace and product imagery before increasing body text.
- Cap interactive content width so touch paths remain clear.

### 19.5 Orientation changes

- Preserve session state, entered text, current answer, and scroll position.
- Reflow without animation.
- Avoid content jumps caused by fixed viewport assumptions.

## 20. Implementation Guardrails

When development begins:

- Centralize all tokens in one theme layer.
- Use semantic token aliases inside components.
- Do not hardcode color values in component files.
- Keep components independent of kiosk orientation.
- Use CSS Grid for major structure.
- Use `100dvh` and safe-area insets.
- Reserve image and response space to avoid layout shift.
- Isolate animation in small client-side components.
- Check installed dependencies before importing them.
- Use one icon library.
- Test on real iPad hardware before release.

## 21. Prohibited Patterns

The following fail the design system:

- Any gradient.
- Glassmorphism, backdrop blur, or translucent frosted cards.
- Heavy, black, layered, or dramatic shadows.
- Purple or neon AI styling.
- Dark canvas as the default public experience.
- Three equal feature cards used as a generic layout.
- Small touch targets.
- Hover-only behavior.
- Auto-advancing carousels.
- Decorative status dots.
- Fake product UI.
- Robot, brain, circuit, or sparkles imagery used to signify AI.
- Mixed icon families.
- Excessive pills.
- Excessive rounded containers.
- Long chat-bubble transcripts.
- Typewriter responses.
- Infinite decorative animation.
- Hidden gestures.
- Placeholder-as-label forms.
- Low-contrast blue text.
- Unverified product, wellness, or medical claims.

## 22. Screen Review Checklist

Every future screen must pass this checklist before completion.

### Brand and visual language

- [ ] White is the dominant background.
- [ ] Montserrat is used for all interface text.
- [ ] The primary action is black.
- [ ] `#7EAFC3` is used only as the restrained brand accent.
- [ ] No gradient, glass effect, glow, or heavy shadow appears.
- [ ] Official Laikfvea assets are used correctly.
- [ ] Shape, color, and icon tokens match this system.

### Layout and touch

- [ ] The primary task is clear within two seconds.
- [ ] The main action is visible without exploratory scrolling.
- [ ] All targets are at least 56 x 56px where practical.
- [ ] Separate touch targets have at least 12px spacing.
- [ ] Landscape and portrait iPad layouts are intentional.
- [ ] Narrow-screen fallback preserves type and target sizes.
- [ ] No hover or precision gesture is required.

### Typography and content

- [ ] Type style comes from the defined scale.
- [ ] Headings are concise and normally no more than two lines.
- [ ] Reading width stays within 42rem.
- [ ] Copy is factual, plain, and free of hype.
- [ ] Claims and specifications are approved.
- [ ] Button labels are clear, consistent, and unwrapped.

### Interaction and states

- [ ] Pressed, focus, loading, disabled, selected, error, and success states exist.
- [ ] Motion explains feedback or state change.
- [ ] Reduced-motion behavior is complete.
- [ ] Loading preserves layout and provides meaningful status.
- [ ] Offline and recovery paths are present where needed.
- [ ] Session reset clears prior visitor content.

### Accessibility

- [ ] WCAG 2.2 AA contrast is verified.
- [ ] Accent text uses the accessible strong accent.
- [ ] Keyboard order and focus are correct.
- [ ] Semantic structure and accessible names are complete.
- [ ] Touch targets meet kiosk standards.
- [ ] Async AI updates are announced appropriately.
- [ ] Timeout warning can be extended.
- [ ] Voice features have text and touch alternatives.
- [ ] Localization and text expansion have been tested.

### Kiosk quality

- [ ] Attract mode exposes no prior session data.
- [ ] Welcome content fits both iPad orientations.
- [ ] Browser chrome and external navigation are inaccessible.
- [ ] The experience recovers from offline and service errors.
- [ ] Orientation changes preserve active session state.
- [ ] The screen has been tested on physical iPad hardware.

## 23. Governance

This document is the default authority for visual and interaction decisions.

Any exception must record:

1. The rule being changed.
2. The user or operational need.
3. The accessibility impact.
4. The new token or component behavior.
5. Approval from the product or design owner.

Do not create local visual exceptions inside a screen. If a pattern is reusable, add it to this document and the shared component system.
