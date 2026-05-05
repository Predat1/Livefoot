import React, { Component, ErrorInfo, ReactNode } from "react";
import { captureError } from "@/integrations/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 text-6xl">⚽</div>
          <h1 className="text-2xl font-bold mb-2">Oups ! Quelque chose s'est mal passé.</h1>
          <p className="text-slate-400 mb-6 text-sm max-w-sm">
            Une erreur inattendue s'est produite. Notre équipe a été notifiée.
          </p>
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-4 max-w-lg overflow-auto mb-6">
            <p className="text-red-400 font-mono text-xs">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 rounded-lg font-bold hover:bg-emerald-600 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    // ✅ CORRECTION : this.props.children (pas this.children)
    return this.props.children;
  }
}

export default ErrorBoundary;
