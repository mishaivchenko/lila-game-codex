# Host Room UI Bugfix Pass

## What Was Fixed

### Host Room
- Moved the noisy online rules copy out of the header block into a compact `i` popover.
- Removed the misleading always-on connection badge from the `Наступна дія` card and now only surface connection state when it actually needs attention.
- Removed the floating `Відкрита картка` status surface from Host Room.
- Tightened the control rail so the primary action and room menu fit without stacking into each other.
- Reworked the room utility modal into a wider, non-scrolling shell with panel-specific internal layout.
- Rebuilt room, players, history, and host notes panels so scrolling is scoped to long lists only.
- Kept host notes directly editable and saveable inside the notes panel.
- Switched Host Room appearance controls to the shared compact modal.

### Rules / Settings / Journey Setup
- Repaired the `Правила гри` layout in `JourneySetupHub` with dedicated internal scroll containers for long rules and level descriptions.
- Moved `Тема та вигляд` behind modal triggers instead of keeping appearance controls inline on the setup/rules screen.
- Stabilized `Налаштування подорожі` with a card-based layout and removed the local-storage copy line.
- Moved settings-page appearance controls into a modal for a calmer, more stable layout.

### Card Modal
- Removed the debug/placeholder scroll copy from the main card body.
- Moved the `Пропустити` explanation into a help popover attached to the skip action.
- Strengthened the modal frame with a dedicated inner rounded shell so the card reads as one rounded surface.

### Dice
- Made both the compact dice chip and the 3D dice shell use the active board theme.
- Kept existing dice roll timing and lifecycle logic unchanged.

## Architecture / UI Decisions
- Added a reusable [`InfoPopover`](/Users/mishaivchenko/.codex/worktrees/5a75/lila-game-codex/frontend/src/components/InfoPopover.tsx) for compact contextual help instead of repeating ad hoc tooltip logic.
- Extended [`CompactPanelModal`](/Users/mishaivchenko/.codex/worktrees/5a75/lila-game-codex/frontend/src/components/CompactPanelModal.tsx) with optional body/panel configuration so screens can choose between whole-modal scroll and scoped internal scroll.
- Kept business logic untouched in room/game/card flows; changes are limited to UI composition, layout, and theme presentation.
- Kept rules/setup behavior in the existing hierarchy by passing appearance-modal triggers down as callbacks instead of rewriting navigation flow.
- Added a theme-level dice style resolver so dice visuals follow the active theme without duplicating color logic in each dice component.

## Edge Cases Considered
- Host room still supports host-controlled and self-controlled players.
- Utility modal panels only scroll where content can actually grow long, such as participant lists and saved notes.
- Skip help remains accessible on tap and click, not only hover.
- Theme-aware dice fall back to default dice styling if a theme omits dice overrides.
- Card modal dark theme keeps the lighter readable content surface behavior that already existed.

## Automated Verification
- `npm run test --workspace frontend`
- `npm run build --workspace frontend`

## Manual Verification Checklist
- [ ] Host Room fits without overlap between `Кинути за гравця` and `Меню кімнати`.
- [ ] Board remains the dominant visual element in Host Room on desktop and Telegram Mini App.
- [ ] `Відкрита картка` status block is gone from Host Room.
- [ ] Host Room rules open from the compact info trigger on desktop hover and mobile tap.
- [ ] `Меню кімнати -> Кімната` renders cleanly with no broken alignment.
- [ ] `Меню кімнати -> Нотатки` is usable and notes save correctly.
- [ ] `Правила гри` page scrolls correctly with long content.
- [ ] `Тема та вигляд` opens in a modal from setup/rules and settings screens.
- [ ] Card modal no longer shows the removed helper copy in the main body.
- [ ] Skip explanation appears only through the skip help affordance.
- [ ] Card frame looks fully rounded and visually separated from the page background.
- [ ] Journey settings page opens without layout shifts.
- [ ] Dice colors follow the active theme across theme switches.
