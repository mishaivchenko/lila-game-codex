# Bugfix Sprint Report — UX + Online

Branch: `codex/feature/bugfix-sprint-ux-online`  
Date: 2026-03-05

## 1) Windows fullscreen / viewport sizing
### What was wrong
- App shell height depended on browser-specific `vh` behavior, which is unstable on Windows/mobile webviews.

### What was changed
- Added centralized viewport height strategy:
  - `resolveViewportHeightPx(window)` with `visualViewport.height` priority.
  - CSS var sync: `--app-height`.
  - App shell root switched to `min-h-[var(--app-height,100dvh)]`.
- Hook is applied at Telegram shell level for all runtime modes.

### Files
- `frontend/src/features/telegram/ui/useViewportHeightFix.ts`
- `frontend/src/features/telegram/ui/TelegramAppShell.tsx`
- `frontend/src/features/telegram/ui/useViewportHeightFix.test.ts`
- `frontend/src/features/telegram/ui/TelegramAppShell.test.tsx`

## 2) Single-player multi-player names readability
### What was wrong
- Player chips could clip/overflow with long names; contrast was weak in some theme combinations.

### What was changed
- Reworked player chips:
  - better wrapping/word break behavior,
  - improved typography/contrast with theme tokens,
  - stable spacing for small screens.

### Files
- `frontend/src/pages/game/components/GameStatusHeader.tsx`
- `frontend/src/pages/game/components/GameStatusHeader.test.tsx`

## 3) Dice sum display rules and timing
### What was wrong
- Sum visibility was not tied to animation lifecycle and was shown in 1-die mode.

### What was changed
- Introduced lifecycle state machine: `idle -> rolling -> settled`.
- Sum row logic:
  - hidden always for 1 die,
  - shown only in `settled` state for 2/3 dice.
- Wired animation completion callback (`onAnimationComplete`) to lifecycle transition.

### Files
- `frontend/src/components/dice3d/useDiceRollLifecycle.ts`
- `frontend/src/components/dice3d/Dice3D.tsx`
- `frontend/src/components/dice3d/Dice3D.test.tsx`
- `frontend/src/components/dice3d/useDiceRollLifecycle.test.ts`

## 4) Start card before first move
### What was wrong
- New single-player sessions did not reliably show the ritual start card once before first move.

### What was changed
- Added persistent flag `hasShownStartCard` into session model and reducer normalization.
- Added `markStartCardShown` action.
- Added auto-open hook for card `1` with one-time behavior.
- Integrated close flow to persist the flag and prevent reopen on reload.

### Files
- `frontend/src/domain/types.ts`
- `frontend/src/context/gameContextReducer.ts`
- `frontend/src/context/gameContextTypes.ts`
- `frontend/src/context/useGameContextActions.ts`
- `frontend/src/pages/game/useStartCardAutoOpen.ts`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/pages/GamePage.boardCardFlow.test.tsx`
- `frontend/src/context/GameContext.test.tsx`
- `frontend/src/pages/game/useStartCardAutoOpen.test.ts`

## 5) Online desktop: host-controlled players
### What was wrong
- Host could not create/use desktop-only host-controlled player entries in room flow.

### What was changed
- Added room player control mode (`self` / `host`) and persistence.
- New host-only endpoint + WS event for host-controlled player creation.
- Roll API/WS now supports `targetPlayerId` for host rolling on selected host-controlled player.
- Desktop host UI:
  - “Add host-controlled player” form,
  - control mode badges,
  - roll target selector for host-controlled turns.

### Files
- `backend/migrations/005_room_players_control_mode.sql`
- `backend/src/types/rooms.ts`
- `backend/src/store/roomsStore.ts`
- `backend/src/routes/rooms.ts`
- `backend/src/socket/hostRoomSocket.ts`
- `backend/test/authRooms.test.ts`
- `frontend/src/features/telegram/rooms/roomsApi.ts`
- `frontend/src/features/telegram/rooms/TelegramRoomsContext.tsx`
- `frontend/src/features/telegram/rooms/HostRoomPage.tsx`
- `frontend/src/features/telegram/rooms/HostRoomPage.test.tsx`

## 6) Loading screen transitions
### What was wrong
- Startup loading states were abrupt and not explicitly separated.

### What was changed
- Added explicit bootstrap state mapping (`initializing`, `syncing`, `ready`, fallback states).
- Updated startup banner to soft animated transition with progress line.
- Added deterministic state tests.

### Files
- `frontend/src/features/telegram/ui/bootstrapState.ts`
- `frontend/src/features/telegram/ui/TelegramAppShell.tsx`
- `frontend/src/features/telegram/ui/bootstrapState.test.ts`

## Manual verification checklist
- [ ] Open app on Windows web: shell uses full viewport height without clipping.
- [ ] Open app on iPhone/Android: no jumpy height changes on browser chrome changes.
- [ ] Single-player with 2+ long player names: chips remain readable and non-overflowing in both themes.
- [ ] Dice mode 1 die: no sum line ever shown.
- [ ] Dice mode 2/3 dice: sum appears only after dice settle animation.
- [ ] New single-player game: cell 1 card opens once before first roll; after dismiss + reload it does not auto-open again.
- [ ] Desktop multiplayer host: can add host-controlled player, see badge, select as roll target, and apply roll to that player.
- [ ] Startup: loading banner transitions through init/sync states and disappears in ready state.

## Tests added/updated
- Added:
  - `frontend/src/features/telegram/ui/useViewportHeightFix.test.ts`
  - `frontend/src/features/telegram/ui/bootstrapState.test.ts`
  - `frontend/src/features/telegram/ui/TelegramAppShell.test.tsx`
  - `frontend/src/pages/game/components/GameStatusHeader.test.tsx`
  - `frontend/src/pages/game/useStartCardAutoOpen.test.ts`
  - `frontend/src/features/telegram/rooms/HostRoomPage.test.tsx`
  - `frontend/src/components/dice3d/useDiceRollLifecycle.test.ts`
- Updated:
  - `frontend/src/components/dice3d/Dice3D.test.tsx`
  - `frontend/src/context/GameContext.test.tsx`
  - `frontend/src/pages/GamePage.boardCardFlow.test.tsx`
  - `backend/test/authRooms.test.ts`

## Build/test status
- `npm run test:all` ✅
- `npm run build` ✅
- Lint script is not defined in workspace root scripts (no runnable lint command found in `package.json`).

## Screenshots
- No automated screenshots were generated in this sprint.
