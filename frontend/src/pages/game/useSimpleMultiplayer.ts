import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameSession } from '../../domain/types';
import type {
  PendingSimpleMove,
  SimpleMultiplayerPayload,
  SimplePlayerHistoryEntry,
  SimplePlayerState,
} from './gamePageTypes';

interface UseSimpleMultiplayerParams {
  currentSession?: GameSession;
  updateSessionRequest: (patch: string | { question?: string }) => Promise<void>;
}

const normalizeSimplePlayers = (raw: unknown): SimplePlayerState[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => ({
      id: String((item as { id?: unknown }).id ?? `simple-${Date.now()}-${Math.random()}`),
      name: String((item as { name?: unknown }).name ?? 'Учасник'),
      request: String((item as { request?: unknown }).request ?? ''),
      color: String((item as { color?: unknown }).color ?? 'синій'),
      currentCell: Number((item as { currentCell?: unknown }).currentCell ?? 1),
      hasEnteredGame: Boolean((item as { hasEnteredGame?: unknown }).hasEnteredGame ?? true),
      finished: Boolean((item as { finished?: unknown }).finished ?? false),
    }))
    .slice(0, 4);
};

const normalizeHistoryByPlayer = (raw: unknown): Record<string, SimplePlayerHistoryEntry[]> => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const entries = raw as Record<string, SimplePlayerHistoryEntry[]>;
  return Object.fromEntries(
    Object.entries(entries).map(([playerId, historyEntries]) => [
      playerId,
      historyEntries.map((entry) => ({
        ...entry,
        moveType:
          entry.moveType ??
          (entry.snakeOrArrow === 'snake'
            ? 'snake'
            : entry.snakeOrArrow === 'arrow'
              ? 'ladder'
              : 'normal'),
      })),
    ]),
  ) as Record<string, SimplePlayerHistoryEntry[]>;
};

export const useSimpleMultiplayer = ({
  currentSession,
  updateSessionRequest,
}: UseSimpleMultiplayerParams) => {
  const [simplePlayers, setSimplePlayers] = useState<SimplePlayerState[]>([]);
  const [activeSimplePlayerIndex, setActiveSimplePlayerIndex] = useState(0);
  const multiplayerInitializedSessionIdRef = useRef<string | undefined>(undefined);
  const simpleHistoryByPlayerRef = useRef<Record<string, SimplePlayerHistoryEntry[]>>({});

  useEffect(() => {
    if (!currentSession || currentSession.request.isDeepEntry) {
      setSimplePlayers([]);
      simpleHistoryByPlayerRef.current = {};
      multiplayerInitializedSessionIdRef.current = undefined;
      return;
    }

    try {
      const parsed = JSON.parse(currentSession.request.question ?? '[]');
      const parsedPlayers = Array.isArray(parsed) ? parsed : (parsed as { players?: unknown })?.players;
      const players = normalizeSimplePlayers(parsedPlayers);

      if (players.length === 0) {
        setSimplePlayers([]);
        simpleHistoryByPlayerRef.current = {};
        multiplayerInitializedSessionIdRef.current = undefined;
        return;
      }

      const rawHistory =
        parsed && !Array.isArray(parsed) && typeof parsed === 'object'
          ? (parsed as { historyByPlayer?: unknown }).historyByPlayer
          : undefined;
      simpleHistoryByPlayerRef.current = normalizeHistoryByPlayer(rawHistory);

      if (multiplayerInitializedSessionIdRef.current !== currentSession.id) {
        setSimplePlayers(players);
        setActiveSimplePlayerIndex(0);
        multiplayerInitializedSessionIdRef.current = currentSession.id;
      }
    } catch {
      setSimplePlayers([]);
      simpleHistoryByPlayerRef.current = {};
      multiplayerInitializedSessionIdRef.current = undefined;
    }
  }, [currentSession]);

  const isSimpleMultiplayer = Boolean(
    currentSession && !currentSession.request.isDeepEntry && simplePlayers.length > 1,
  );
  const activeSimplePlayer = isSimpleMultiplayer ? simplePlayers[activeSimplePlayerIndex] : undefined;
  const multiplayerFinished =
    isSimpleMultiplayer && simplePlayers.length > 0 && simplePlayers.every((player) => player.finished);

  const commitPendingSimpleMove = useCallback((pending: PendingSimpleMove) => {
    let nextIndex = activeSimplePlayerIndex;
    let nextPlayersSnapshot: SimplePlayerState[] = [];
    setSimplePlayers((prev) => {
      const nextPlayers = prev.map((player) =>
        player.id === pending.playerId
          ? {
              ...player,
              currentCell: pending.toCell,
              finished: pending.finished,
              hasEnteredGame: pending.hasEnteredGame,
            }
          : player,
      );
      nextPlayersSnapshot = nextPlayers;

      const unfinished = nextPlayers
        .map((player, index) => ({ player, index }))
        .filter((entry) => !entry.player.finished);
      if (unfinished.length === 0) {
        nextIndex = activeSimplePlayerIndex;
      } else {
        const currentPos = unfinished.findIndex((entry) => entry.index === activeSimplePlayerIndex);
        nextIndex =
          currentPos === -1 ? unfinished[0].index : unfinished[(currentPos + 1) % unfinished.length].index;
      }
      return nextPlayers;
    });
    setActiveSimplePlayerIndex(nextIndex);

    const prev = simpleHistoryByPlayerRef.current;
    const nextHistory: Record<string, SimplePlayerHistoryEntry[]> = {
      ...prev,
      [pending.playerId]: [
        ...(prev[pending.playerId] ?? []),
        {
          fromCell: pending.fromCell,
          toCell: pending.toCell,
          dice: pending.dice,
          moveType: pending.moveType,
          snakeOrArrow: pending.snakeOrArrow,
          createdAt: pending.createdAt,
        },
      ],
    };
    simpleHistoryByPlayerRef.current = nextHistory;

    const payload: SimpleMultiplayerPayload = {
      players: nextPlayersSnapshot.map((player) => ({
        id: player.id,
        name: player.name,
        request: player.request,
        color: player.color,
        currentCell: player.currentCell,
        hasEnteredGame: player.hasEnteredGame,
        finished: player.finished,
      })),
      historyByPlayer: nextHistory,
    };
    void updateSessionRequest({ question: JSON.stringify(payload) });
  }, [activeSimplePlayerIndex, updateSessionRequest]);

  return {
    simplePlayers,
    activeSimplePlayer,
    activeSimplePlayerIndex,
    isSimpleMultiplayer,
    multiplayerFinished,
    setSimplePlayers,
    setActiveSimplePlayerIndex,
    commitPendingSimpleMove,
    resetSimpleMultiplayer: () => {
      setSimplePlayers([]);
      simpleHistoryByPlayerRef.current = {};
      multiplayerInitializedSessionIdRef.current = undefined;
    },
  };
};
