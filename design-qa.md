# Design QA

## Comparison target

- Source visual truth:
  - `../assets/d6cba64e955289b2843df0324d5b0872.jpg` — moonlit water, 1240 × 928.
  - `../assets/356ab4292905ea92f78df271b1409ad1.jpg` — harbor and streetlights, 1239 × 915.
  - `../assets/c39bb411b4ae6647f9f90b747c248114.jpg` — forest road to the sea, 1239 × 898.
- Implementation evidence:
  - `implementation-mobile-screen-v2.png`
  - `implementation-letter-screen.png`
  - `implementation-lights-screen-v2.png`
  - `implementation-finale-screen.png`
- Browser: Microsoft Edge.
- CSS viewport: 393 × 852.
- Implementation pixels: 393 × 852 at devicePixelRatio 1.
- Source density: original supplied landscape JPEGs; used directly without regeneration.
- State coverage: opening, letter, three-light interaction, unlocked finale.

The source images are mood and asset truth rather than a pixel-exact UI mock. QA therefore evaluates whether the implementation preserves their crops, palette, texture, atmosphere, and focal light while adding an appropriate editorial interface.

## Full-view comparison evidence

The opening-screen comparison was viewed with the moon source and `implementation-mobile-screen-v2.png` in the same comparison input. The source image remains recognizable and unaltered. The moon, water reflection, treeline, grain, and blue-green palette remain the dominant visual hierarchy; interface copy is subordinate and uses the lower third without obscuring the primary light.

The harbor comparison was viewed with the harbor source and `implementation-lights-screen-v2.png` in the same comparison input. The final crop deliberately favors the left streetlight and its water reflection so the warm light from the source remains visible in the narrow mobile aspect ratio.

## Focused region comparison evidence

- Letter: `implementation-letter-screen.png` verifies the long-form Chinese copy at readable optical size, line height, and margins.
- Interaction: `implementation-lights-screen-v2.png` verifies the three light targets, source-image crop, and title hierarchy.
- Finale: `implementation-finale-screen.png` verifies the unlocked completion state and final message.

Focused views were necessary because the full opening screen cannot establish long-copy readability or the interaction state.

## Required fidelity surfaces

- Fonts and typography: the Chinese serif stack gives the intended quiet editorial tone. Display text is 43–55px, body copy is 12–15px with 1.85–2.08 line height, and metadata uses compact sans-serif tracking. No clipping or truncation remains.
- Spacing and layout rhythm: the app uses full-screen image chapters, restrained 28–29px side margins, thin dividers, and long pauses between narrative beats. The 393 × 852 screen capture shows all opening controls inside the device viewport.
- Colors and tokens: blue-green night, warm ivory text, and restrained amber accents map directly to the supplied images. Solid translucent washes preserve legibility without replacing the original image texture.
- Image quality and asset fidelity: all three supplied JPEGs are used directly. No AI regeneration, placeholder, CSS drawing, emoji, or approximate substitute is present. `object-fit: cover` is intentional for the mobile crop.
- Copy and content: names, nickname, dates, the three memories, the sentence “你是一个很纯粹的人”, and the three-month message are preserved.

## Comparison history

### Iteration 1

- Earlier finding: [P1] viewport-relative section heights used the outer browser viewport, placing the opening CTA below the virtual phone screen.
- Fix: introduced the internal screen-height token for iPhone and Pixel app viewports and replaced outer `svh` sizing.
- Post-fix evidence: `qa-opening-v2.png` and `implementation-mobile-screen-v2.png` show the full title, copy, and CTA within 393 × 852.

### Iteration 2

- Earlier finding: [P1] motion elements could remain invisible when a deep link loaded directly into a later section.
- Fix: later sections now render visibly by default and retain in-view motion as progressive enhancement.
- Post-fix evidence: `qa-letter-v3.png` and `qa-lights-v3.png` show complete content after direct section navigation.

### Iteration 3

- Earlier finding: [P2] the first harbor crop hid the source image's warm streetlamp, weakening the visual reference.
- Fix: shifted the interaction chapter crop to 30% horizontal position and reduced its dark wash.
- Post-fix evidence: `implementation-lights-screen-v2.png` preserves the streetlamp and reflection while keeping the three controls legible.

## Interaction and runtime checks

- All 8 image instances loaded with non-zero natural dimensions.
- Audio reached readyState 4.
- Opening CTA changed to the started state and navigated into the story.
- All three light buttons changed to the found state.
- Finale changed to `data-unlocked="true"`.
- Final light message matched the intended copy.
- No runtime exceptions or console errors were observed.
- Protected mobile runtime integrity check passed.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] Chinese serif appearance will vary slightly by operating system because the design intentionally uses native Song-style font fallbacks.
- [P3] Real chat screenshots can be added later as a separate memory chapter once supplied.

## Implementation checklist

- [x] Preserve all three supplied images.
- [x] Keep the mobile runtime intact.
- [x] Verify 393 × 852 content-only captures.
- [x] Verify music, primary CTA, all three light controls, and finale.
- [x] Verify runtime integrity and production build.

final result: passed
