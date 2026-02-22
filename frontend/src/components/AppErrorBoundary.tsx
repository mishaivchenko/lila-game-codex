import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6 text-stone-800">
          <h1 className="text-lg font-semibold">Сталася помилка інтерфейсу</h1>
          <p className="mt-2 text-sm">
            {this.state.message ?? 'Спробуйте оновити сторінку або почати нову сесію.'}
          </p>
        </main>
      );
    }

    return this.props.children;
  }
}
