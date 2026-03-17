# Canva Style Adaptation Report

## Extracted From Canva

- Palette: airy off-white and blush backgrounds, pale lilac surfaces, deep violet/plum accents, muted lavender neutrals.
- Typography: bold high-contrast sans headlines, lighter supportive sans copy, small uppercase utility labels.
- Layout: centered hero blocks, thin top navigation line, calm stacked CTA plates, generous whitespace, and flat translucent surfaces instead of heavy desktop cards.
- Decorative motifs: large swallow/bird marks, diffused pastel overlays, soft tinted panel plates.
- Motion cues: fade-up reveals, soft panel presence, gentle sheen/loading movement, lightweight premium transitions.

## Applied To The App

- Added a Canva-derived token layer in `frontend/src/styles/tailwind.css` and aligned board theme values in `frontend/src/theme/boardTheme.ts`.
- Replaced the earlier abstract accent treatment with the real SoulVio bird logo via `frontend/src/components/BrandLogo.tsx` on the start, setup, history, settings, multiplayer, solo, and game shell surfaces.
- Restyled splash/start/setup, single-player, multiplayer, history, settings, main game shell, and card modal around the real Canva patterns: thin top line, centered headline, pale-lilac CTA plates, brand-mark watermarks, and calmer glass-paper panels.
- Rebuilt the shell breakpoints and board container so the board can expand properly on both phone and desktop instead of opening in a cramped half-height frame.
- Added theme-aware Canva surface tokens so dark theme keeps readable text contrast and distinct panel separation instead of washed-out light overlays.
- Kept motion calm and lightweight with soft overlays, sheen loading, and panel-driven transitions.

## Adapted Instead Of Copied

- Canva’s poster-like whitespace was compressed into one-screen app shells to preserve the Telegram Mini App rhythm.
- Large Canva hero compositions were translated into centered one-screen stages that still fit Telegram and small phones without page scrolling.
- The real bird logo is used as a watermark/surface motif, but it is still kept away from active gameplay targets so it does not interfere with taps on the board.
- Long explanatory content was kept inside internal scroll panes and modal bodies rather than page-level scrolling.
- The board, dice, card-open sequence, host/player flows, and session logic were not rewritten.

## Screens Changed

- Splash / boot overlay
- Start screen
- Single-player start flow
- Multiplayer start / room-entry flow
- Setup screen
- Main game shell
- Card modal
- Final screen
- History
- Settings
- Error / offline-support surfaces inside Telegram shell

## Preserved UX Philosophy

- One screen equals one page in the core flows.
- No page-level scrolling was introduced for the main start/setup/game shells; internal panel scrolling is used only where content can exceed the viewport.
- The board remains the primary visual focus.
- Solo and multiplayer behavior, dice lifecycle, host/player logic, modal card opening, and session continuity were preserved.
- Mobile-first Telegram usage remains intact, while desktop now uses available width more effectively and no longer collapses into an artificial mobile-width frame too early.

## Manual Test Guide

1. Open the app and wait for the splash to transition to the start screen.
2. On the start and setup screens, confirm the real SoulVio bird logo is visible as the main brand mark or as a subtle watermark, rather than only an abstract icon.
3. Enter single-player, start a new game, roll the dice, and open a card.
4. Resume an existing solo session from the archive if one exists.
5. Enter multiplayer and verify host/player entry points, recent room cards, and Telegram room panel rendering.
6. Open history, settings, and route-error/offline states to confirm consistent surfaces and readable spacing.
7. Switch to dark theme and confirm headings, body text, pills, and panels remain readable with strong enough contrast.
8. On desktop, confirm the board stays large and central with controls in a side panel instead of a squeezed mobile column.
9. On mobile widths, confirm stacked blocks do not overlap and there is no page-level scrolling in the main shell; only internal panels/modals should scroll when content is long.
