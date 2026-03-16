import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { CanvaWingAccent } from '../components/CanvaWingAccent';

export const RouteErrorPage = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <main className="lila-page-shell lila-page-shell--center">
        <section className="lila-panel mx-auto w-full max-w-xl px-5 py-6 text-[var(--lila-text-primary)]">
          <CanvaWingAccent className="pointer-events-none absolute -right-8 top-0 hidden h-28 w-44 text-[color:rgba(90,72,135,0.16)] md:block" />
          <p className="lila-utility-label">Route Error</p>
          <h1 className="mt-3 text-2xl font-black tracking-[-0.04em]">Не вдалося відкрити сторінку</h1>
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">{error.status} {error.statusText}</p>
        </section>
      </main>
    );
  }

  const message =
    error instanceof Error ? error.message : 'Сталася помилка інтерфейсу. Оновіть сторінку.';

  return (
    <main className="lila-page-shell lila-page-shell--center">
      <section className="lila-panel mx-auto w-full max-w-xl px-5 py-6 text-[var(--lila-text-primary)]">
        <CanvaWingAccent className="pointer-events-none absolute -right-8 top-0 hidden h-28 w-44 text-[color:rgba(90,72,135,0.16)] md:block" />
        <p className="lila-utility-label">UI Error</p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.04em]">Сталася помилка інтерфейсу</h1>
        <p className="mt-3 text-sm text-[var(--lila-text-muted)]">{message}</p>
      </section>
    </main>
  );
};
