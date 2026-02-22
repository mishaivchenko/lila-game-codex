import { describe, expect, it } from 'vitest';
import { getLilaCellContent } from '../cellContent';

describe('getLilaCellContent', () => {
  it('returns mapped content for known cells', () => {
    const cell4 = getLilaCellContent(4);
    const cell13 = getLilaCellContent(13);

    expect(cell4.title).toBe('Бажання');
    expect(cell4.description).toContain('хибні');
    expect(cell4.questions.length).toBeGreaterThan(0);

    expect(cell13.title).toBe('Нікчемність');
    expect(cell13.description).toContain('Знецінюєш себе');
    expect(cell13.questions[0]).toContain('знецінюєш');
  });

  it('returns fallback for unknown cell', () => {
    const fallback = getLilaCellContent(999);
    expect(fallback.title).toBe('Клітина 999');
    expect(fallback.description).toContain('Опишіть свої думки');
    expect(fallback.questions[0]).toContain('Що зараз');
  });
});
