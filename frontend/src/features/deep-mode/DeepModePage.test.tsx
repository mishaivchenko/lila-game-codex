import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DeepModePage } from './DeepModePage';

describe('DeepModePage', () => {
  it('closes local overlay on close', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/deep-mode']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/deep-mode" element={<DeepModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Глибока гра' })).not.toBeNull();
    expect(screen.getByTestId('deep-mode-wall')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.queryByTestId('deep-mode-wall')).toBeNull();
    expect(screen.getByTestId('deep-mode-settings-panel')).not.toBeNull();
  });
});
