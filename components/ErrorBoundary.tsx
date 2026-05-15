"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[MY BUS]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-zinc-100 px-6 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">This screen could not load</h1>
          <p className="max-w-md text-sm text-zinc-600">
            {this.state.error.message}
          </p>
          <p className="max-w-md text-xs text-zinc-500">
            If you opened a file from disk, run <code className="rounded bg-zinc-200 px-1 py-0.5">npm run serve:out</code> after{" "}
            <code className="rounded bg-zinc-200 px-1 py-0.5">npm run build</code>, or open the app over HTTP so scripts can load.
          </p>
          <button
            type="button"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
