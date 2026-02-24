export const NOTE_MIN_NON_WHITESPACE_CHARS = 2;

const nonWhitespaceLength = (value: string): number => value.replace(/\s+/g, '').length;

export const getNoteValidationError = (value: string): string | undefined => {
  if (nonWhitespaceLength(value) < NOTE_MIN_NON_WHITESPACE_CHARS) {
    return 'Будь ласка, напишіть хоч одну фразу або пропустіть крок.';
  }
  return undefined;
};

export const isNoteValid = (value: string): boolean => !getNoteValidationError(value);
