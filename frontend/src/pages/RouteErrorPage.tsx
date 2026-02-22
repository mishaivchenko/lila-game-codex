import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export const RouteErrorPage = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6 text-stone-800">
        <h1 className="text-lg font-semibold">Не вдалося відкрити сторінку</h1>
        <p className="mt-2 text-sm">{error.status} {error.statusText}</p>
      </main>
    );
  }

  const message =
    error instanceof Error ? error.message : 'Сталася помилка інтерфейсу. Оновіть сторінку.';

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6 text-stone-800">
      <h1 className="text-lg font-semibold">Сталася помилка інтерфейсу</h1>
      <p className="mt-2 text-sm">{message}</p>
    </main>
  );
};
