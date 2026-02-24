import { useCallback, useEffect, useState } from 'react';
import type { CellInsight, GameMove, GameSession } from '../../domain/types';
import { createRepositories } from '../../repositories';

const repositories = createRepositories();

export type HistoryFilter = 'all' | 'insights' | 'snakes' | 'arrows';

interface MultiplayerHistoryEntry {
  fromCell: number;
  toCell: number;
  dice: number;
  moveType?: 'normal' | 'snake' | 'ladder';
  snakeOrArrow: 'snake' | 'arrow' | null;
  createdAt: string;
}

export interface MultiplayerHistoryPayload {
  players: Array<{ id: string; name: string; color: string }>;
  historyByPlayer: Record<string, MultiplayerHistoryEntry[]>;
}

const isMultiplayerPayload = (value: unknown): value is MultiplayerHistoryPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybe = value as MultiplayerHistoryPayload;
  return Array.isArray(maybe.players) && typeof maybe.historyByPlayer === 'object' && !!maybe.historyByPlayer;
};

const mapMultiplayerMoves = (
  payload: MultiplayerHistoryPayload,
  selectedPlayerId: string,
  sessionId: string,
): GameMove[] => {
  const playerHistory = payload.historyByPlayer[selectedPlayerId] ?? [];
  return playerHistory.map((entry, index) => ({
    id: `multi-${selectedPlayerId}-${index}`,
    sessionId,
    moveNumber: index + 1,
    fromCell: entry.fromCell,
    toCell: entry.toCell,
    dice: entry.dice,
    moveType:
      entry.moveType ??
      (entry.snakeOrArrow === 'snake'
        ? 'snake'
        : entry.snakeOrArrow === 'arrow'
          ? 'ladder'
          : 'normal'),
    snakeOrArrow: entry.snakeOrArrow,
    createdAt: entry.createdAt,
  }));
};

interface UseHistoryDataParams {
  currentSession?: GameSession;
  saveInsight: (cellNumber: number, text: string) => Promise<void>;
}

export const useHistoryData = ({ currentSession, saveInsight }: UseHistoryDataParams) => {
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [insights, setInsights] = useState<CellInsight[]>([]);
  const [multiplayerPayload, setMultiplayerPayload] = useState<MultiplayerHistoryPayload | undefined>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();
  const [insightDraft, setInsightDraft] = useState('');

  useEffect(() => {
    if (!currentSession) {
      setMoves([]);
      setInsights([]);
      setMultiplayerPayload(undefined);
      setSelectedPlayerId(undefined);
      return;
    }

    let parsedPayload: MultiplayerHistoryPayload | undefined;

    if (!currentSession.request.isDeepEntry) {
      try {
        const parsed = JSON.parse(currentSession.request.question ?? '{}');
        if (isMultiplayerPayload(parsed) && parsed.players.length > 1) {
          parsedPayload = parsed;
          setMultiplayerPayload(parsed);
          setSelectedPlayerId((prev) => prev ?? parsed.players[0]?.id);
        } else {
          setMultiplayerPayload(undefined);
          setSelectedPlayerId(undefined);
        }
      } catch {
        setMultiplayerPayload(undefined);
        setSelectedPlayerId(undefined);
      }
    } else {
      setMultiplayerPayload(undefined);
      setSelectedPlayerId(undefined);
    }

    if (parsedPayload && selectedPlayerId) {
      setMoves(mapMultiplayerMoves(parsedPayload, selectedPlayerId, currentSession.id));
    } else {
      void repositories.movesRepository.getMovesBySession(currentSession.id).then(setMoves);
    }

    void repositories.insightsRepository.getInsightsBySession(currentSession.id).then(setInsights);
  }, [currentSession, selectedPlayerId]);

  const applyInsight = useCallback(
    async (cellNumber: number, text: string) => {
      if (!currentSession) {
        return;
      }
      await saveInsight(cellNumber, text);
      const nextInsights = await repositories.insightsRepository.getInsightsBySession(currentSession.id);
      setInsights(nextInsights);
    },
    [currentSession, saveInsight],
  );

  return {
    moves,
    insights,
    multiplayerPayload,
    selectedPlayerId,
    setSelectedPlayerId,
    insightDraft,
    setInsightDraft,
    applyInsight,
  };
};
