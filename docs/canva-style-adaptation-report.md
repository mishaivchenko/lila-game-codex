# Canva Style Adaptation Report

## Extracted From Canva

- Palette: airy off-white and blush backgrounds, pale lilac surfaces, deep violet/plum accents, muted lavender neutrals.
- Typography: bold high-contrast sans headlines, lighter supportive sans copy, small uppercase utility labels.
- Layout: centered hero blocks, calm card stacks, generous but controlled spacing, soft framed panels instead of hard boxes.
- Decorative motifs: translucent wing/bird-like ornaments, diffused glow shapes, soft tinted panel overlays.
- Motion cues: fade-up reveals, soft panel presence, gentle sheen/loading movement, lightweight premium transitions.

## Applied To The App

- Added a Canva-derived token layer in `frontend/src/styles/tailwind.css` and aligned board theme values in `frontend/src/theme/boardTheme.ts`.
- Introduced reusable shell/panel/button/input/list-card classes plus a reusable decorative SVG accent in `frontend/src/components/CanvaWingAccent.tsx`.
- Restyled splash/start/setup, single-player, multiplayer, history, settings, route-error, main game shell, card modal, final screen, Telegram room entry panel, and supporting dialogs.
- Expanded the desktop game shell so the board remains central and larger instead of living inside a narrow mobile frame.
- Kept motion calm and lightweight with soft overlays, sheen loading, and panel-driven transitions.

## Adapted Instead Of Copied

- Canva’s poster-like whitespace was compressed into one-screen app shells to preserve the Telegram Mini App rhythm.
- Large Canva hero compositions were translated into compact headers, info cards, and action panels.
- Decorative wing motifs were added to shell surfaces and modal headers, but intentionally kept away from the active board area.
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
- No page-level scrolling was introduced for the main start/setup/game shells.
- The board remains the primary visual focus.
- Solo and multiplayer behavior, dice lifecycle, host/player logic, modal card opening, and session continuity were preserved.
- Mobile-first Telegram usage remains intact, while desktop now uses available width more effectively.

## Manual Test Guide

1. Open the app and wait for the splash to transition to the start screen.
2. Enter single-player, start a new game, roll the dice, and open a card.
3. Resume an existing solo session from the archive if one exists.
4. Enter multiplayer and verify host/player entry points, recent room cards, and Telegram room panel rendering.
5. Open history, settings, and route-error/offline states to confirm consistent surfaces and readable spacing.
6. On desktop, confirm the board stays large and central with controls in a side panel instead of a squeezed mobile column.
7. In all major screens, confirm there is no page-level scrolling in the main shell; only internal panels/modals should scroll when content is long.
