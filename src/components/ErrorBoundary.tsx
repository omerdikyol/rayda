import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-bg flex min-h-full items-center justify-center px-4">
        <div className="glass w-full max-w-md rounded-3xl p-7 shadow-panel">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose/10 text-rose ring-1 ring-rose/20">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-mist-50">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">
            Rayda hit an unexpected error. The timetable data is safe — reload to start a fresh
            session.
          </p>
          <p className="mt-1 text-sm text-mist-500">
            Beklenmeyen bir hata oluştu. Yeniden yükleyerek devam edebilirsiniz.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-ink-900 p-3 text-[11px] leading-relaxed text-rose/80">
              {this.state.error.toString()}
            </pre>
          )}

          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-marmaray px-4 py-3 text-sm font-semibold text-white transition hover:bg-marmaray/90"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Rayda
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
