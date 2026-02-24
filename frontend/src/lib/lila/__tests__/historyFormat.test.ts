import { describe, expect, it } from 'vitest';
import {
  formatMovePath,
  getMovePresentation,
  getMoveSymbol,
  resolveMoveType,
} from '../historyFormat';

describe('historyFormat', () => {
  it('resolves move types and symbols for normal, snake, ladder', () => {
    expect(resolveMoveType({ moveType: 'normal', snakeOrArrow: null })).toBe('normal');
    expect(resolveMoveType({ moveType: undefined, snakeOrArrow: 'snake' })).toBe('snake');
    expect(resolveMoveType({ moveType: undefined, snakeOrArrow: 'arrow' })).toBe('ladder');

    expect(getMoveSymbol('normal')).toBe('→');
    expect(getMoveSymbol('snake')).toBe('⇩');
    expect(getMoveSymbol('ladder')).toBe('⇧');
  });

  it('formats structured move path', () => {
    expect(formatMovePath({ fromCell: 12, toCell: 15, moveType: 'normal', snakeOrArrow: null })).toBe('12 → 15');
    expect(formatMovePath({ fromCell: 12, toCell: 27, moveType: 'ladder', snakeOrArrow: 'arrow' })).toBe('12 ⇧ 27');
    expect(formatMovePath({ fromCell: 34, toCell: 9, moveType: 'snake', snakeOrArrow: 'snake' })).toBe('34 ⇩ 9');
  });

  it('returns highlighted presentation for snake and ladder', () => {
    const ladder = getMovePresentation('ladder');
    const snake = getMovePresentation('snake');

    expect(ladder.label).toBe('Стріла');
    expect(ladder.symbol).toBe('⇧');
    expect(ladder.icon).toBe('🪜');
    expect(ladder.badgeClassName).toContain('teal');

    expect(snake.label).toBe('Змія');
    expect(snake.symbol).toBe('⇩');
    expect(snake.icon).toBe('🐍');
    expect(snake.badgeClassName).toContain('amber');
  });
});
