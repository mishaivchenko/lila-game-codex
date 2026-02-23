import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DeepModePage } from './DeepModePage';

describe('DeepModePage', () => {
  it('navigates back to home on close', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/deep-mode']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/deep-mode" element={<DeepModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Deep Game (AI)')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.getByText('home')).not.toBeNull();
  });
});
