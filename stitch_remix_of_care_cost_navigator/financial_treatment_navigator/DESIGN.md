---
name: Financial Treatment Navigator
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424750'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737781'
  outline-variant: '#c3c6d1'
  surface-tint: '#335f99'
  primary: '#003466'
  on-primary: '#ffffff'
  primary-container: '#1a4b84'
  on-primary-container: '#93bcfc'
  inverse-primary: '#a6c8ff'
  secondary: '#006a68'
  on-secondary: '#ffffff'
  secondary-container: '#91f0ec'
  on-secondary-container: '#006e6c'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca830'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#144780'
  secondary-fixed: '#94f2ef'
  secondary-fixed-dim: '#78d6d2'
  on-secondary-fixed: '#00201f'
  on-secondary-fixed-variant: '#00504e'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is built on the principle of "Empathetic Clarity." It bridges the gap between the clinical precision of healthcare and the structured reliability of finance. The target audience includes patients and caregivers navigating complex billing cycles, often under significant stress. 

The visual style is **Corporate / Modern** with a humanistic touch. It prioritizes extreme legibility and a calm interface to reduce cognitive load. By utilizing generous whitespace and a "Quiet UI" philosophy, the design system ensures that financial data never feels overwhelming or aggressive. The emotional goal is to move the user from a state of anxiety to one of informed confidence.

## Colors

The palette is anchored by **Deep Healthcare Blue**, chosen to establish an immediate sense of institutional trust and stability. **Soft Teal** is used for "health-positive" actions and success states, providing a calming contrast.

**Warm Gold** is reserved for high-value insights, such as financial savings or expert recommendations, signaling quality without the "cheapness" of bright yellow. For alerts and warnings, we avoid high-vibrancy reds; instead, we use **Gentle Red and Amber** (desaturated and slightly lighter) to inform the user of cost concerns without triggering a panic response. The background remains a very light cool gray to prevent eye strain during long reading sessions.

## Typography

The design system utilizes **Public Sans**, an institutional-grade typeface designed for accessibility and clarity. It provides the neutral, authoritative tone required for financial data while remaining approachable.

Headlines use a tighter letter-spacing and heavier weights to provide clear section anchoring. Body text is set with generous line-height (1.5x minimum) to ensure that complex medical and financial jargon is easy to parse. Large-scale headlines scale down significantly on mobile to avoid awkward line breaks in multi-syllable medical terms.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop (12 columns) centered within a 1200px container to keep information density manageable. On mobile, it transitions to a single-column fluid layout with 16px side margins.

We use an 8px rhythmic spacing system. Larger gaps (LG/XL) are intentionally used between distinct financial sections (e.g., separating "Insurance Coverage" from "Out-of-Pocket Estimates") to create "breathing room" that lowers user stress. Groups of related inputs or data points use the SM (12px) or MD (24px) units to maintain a strong visual association.

## Elevation & Depth

To maintain a reassuring and "flat-plus" professional look, this design system uses **Tonal Layers** supplemented by **Ambient Shadows**. 

- **Primary Surface:** The background is the lowest level (Level 0).
- **Cards & Containers:** White surfaces with a very soft, diffused shadow (10% opacity Primary Color, 12px blur, 4px Y-offset). This makes "Summary Cards" feel like tangible documents.
- **Interactive Elements:** Buttons and active inputs use a slightly more defined shadow to invite interaction.
- **Modals:** High elevation with a 40% opacity backdrop blur to focus the user’s attention on critical decisions, such as "Confirm Payment Plan."

## Shapes

The design system uses a **Rounded** (Level 2) shape language. A corner radius of 8px (0.5rem) is the standard for cards and buttons. This "Medium Softness" is key to the brand: it is friendlier than sharp corners (which can feel clinical/aggressive) but more professional than fully rounded/pill shapes (which can feel too casual for serious financial matters).

- **Standard Elements:** 8px radius.
- **Large Containers:** 16px radius.
- **Selection Indicators:** 4px radius for small internal elements like checkboxes.

## Components

### Progress Steppers
The multi-step intake process uses a "Quiet Stepper" located at the top of the viewport. Completed steps are indicated by a Soft Teal checkmark; the current step is a Deep Blue circle with a white numeral. Label text for future steps is in Neutral Gray to reduce visual noise.

### Reassuring Cards
Cards are the primary vessel for information. Every card must have a 24px internal padding. Title sections within cards are separated by a subtle 1px border (#E2E8F0). Financial totals are always displayed in the top-right or bottom-right of the card in a bold weight.

### Data Visualization
Charts (Cost Breakdowns) use the Primary Blue for "Insurance Paid," Secondary Teal for "Patient Responsibility," and Neutral Gray for "Pending/Adjustments." Use donut charts for high-level summaries and stacked bar charts for monthly payment projections.

### Confidence Indicator
A "Compassionate Gauge" component. This is a semi-circle gauge using a gradient from Gentle Amber to Soft Teal. A needle indicates the "Reliability Score" of a cost estimate. Accompanying text should explain *why* the score is high or low (e.g., "Based on verified provider rates").

### Buttons & Inputs
- **Primary Action (e.g., Download Report):** Deep Healthcare Blue background, white text, 8px radius.
- **Secondary Action (e.g., Upload Document):** Ghost button style (Teal border, Teal text).
- **Inputs:** 1px Neutral Gray border that transitions to a 2px Primary Blue border on focus. Include clear helper text below for complex financial fields.