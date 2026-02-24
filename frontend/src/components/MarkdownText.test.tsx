import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  it('renders headings, emphasis and list items', () => {
    render(
      <MarkdownText
        source={`## Заголовок\nАбзац з **жирним** та *курсивом*.\n- Перший пункт\n- Другий пункт`}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Заголовок' })).not.toBeNull();
    expect(screen.getByText('жирним').tagName).toBe('STRONG');
    expect(screen.getByText('курсивом').tagName).toBe('EM');
    expect(screen.getByText('Перший пункт')).not.toBeNull();
    expect(screen.getByText('Другий пункт')).not.toBeNull();
  });
});
