import { describe, expect, it } from 'vitest';
import { getNoteValidationError, isNoteValid } from '../noteValidation';

describe('noteValidation', () => {
  it('rejects empty and whitespace-only notes', () => {
    expect(getNoteValidationError('')).toBeDefined();
    expect(getNoteValidationError('   \n')).toBeDefined();
    expect(isNoteValid('  ')).toBe(false);
  });

  it('accepts note with at least two non-whitespace chars', () => {
    expect(getNoteValidationError('я')).toBeDefined();
    expect(getNoteValidationError('ок')).toBeUndefined();
    expect(isNoteValid('ok')).toBe(true);
  });
});
