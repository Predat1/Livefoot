import React, { Component, ErrorInfo, ReactNode } from "react";
import { captureError } from "@/integrations/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null) => ReactNode);
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

    // Auto-reload sur erreur de chunk loading (déploiement récent avec nouveaux hashes)
    const isChunkError =
      error.name === "ChunkLoadError" ||
      /Loading chunk \d+ failed/i.test(error.message) ||
      /Failed to fetch dynamically imported module/i.test(error.message) ||
      /Importing a module script failed/i.test(error.message) ||
      /Cannot access '\w+' before initialization/i.test(error.message);

    if (isChunkError) {
      // Évite la boucle infinie de reload : on ne reload qu'une seule fois
      const reloadKey = "livefoot_chunk_reload";
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        console.warn("Stale chunk detected, forcing reload...");
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error)
          : this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0c0f1d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          gap: '16px',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ marginBottom: '24px', fontSize: '64px' }}>⚽</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>Une erreur est survenue</h1>
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '500px'
          }}>
            <p style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '14px', margin: '0' }}>
              {this.state.error?.message || "Erreur inattendue"}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
