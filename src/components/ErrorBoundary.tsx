// ============================================
// Biome – Error Boundary
// Catches runtime crashes in any child tree and
// renders a recovery UI instead of a blank screen.
// ============================================
import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Optional label shown in the error panel (e.g. "Forest View") */
  label?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, pipe this to Sentry or similar
    console.error('[Biome ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleHardReset = () => {
    // Clear persisted state and reload
    localStorage.removeItem('biome_pro_v3');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = 'this section' } = this.props;

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-forest-100">Something went wrong</h2>
          <p className="text-sm text-forest-400 max-w-sm">
            {label} ran into an unexpected error. Your data is safe — this is a display issue only.
          </p>
          {this.state.errorMessage && (
            <p className="text-xs text-forest-600 font-mono bg-forest-950/60 rounded px-3 py-1 max-w-sm break-all">
              {this.state.errorMessage}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={this.handleHardReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 text-sm font-medium transition-colors border border-red-800/40"
          >
            Reset App
          </button>
        </div>
      </div>
    );
  }
}
