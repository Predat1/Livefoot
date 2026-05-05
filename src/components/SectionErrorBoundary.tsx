/**
 * SectionErrorBoundary — Error boundary léger pour isoler des sections de page.
 * Usage : wrapper autour de composants dépendant d'une API externe.
 * Empêche qu'un crash d'un module (ex: IA Prédictions) ne fasse tomber toute la page.
 */
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { captureError } from "@/integrations/sentry";

interface Props {
  children: ReactNode;
  /** Titre affiché dans le fallback UI */
  sectionName?: string;
  /** Fallback personnalisé complet */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SectionErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const section = this.props.sectionName ?? "Unknown section";
    console.error(`[SectionErrorBoundary][${section}]`, error, errorInfo);
    captureError(error, { section, componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[120px]">
          <AlertTriangle className="text-red-400 w-8 h-8" />
          <p className="text-sm font-medium text-red-300">
            {this.props.sectionName
              ? `Impossible de charger : ${this.props.sectionName}`
              : "Cette section est temporairement indisponible"}
          </p>
          <p className="text-xs text-slate-500">{this.state.error?.message}</p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 transition-colors"
          >
            <RefreshCcw className="w-3 h-3" /> Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
