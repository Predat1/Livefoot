import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Oups ! Quelque chose s'est mal passé.</h1>
          <div className="bg-slate-900 border border-red-500/50 rounded-xl p-4 max-w-lg overflow-auto">
            <p className="text-red-400 font-mono text-sm">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-emerald-500 rounded-lg font-bold hover:bg-emerald-600 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;
