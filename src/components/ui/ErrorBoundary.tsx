import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Gözlənilməz tətbiq xətası baş verdi.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Kodera ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] p-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#18181B]">
              Gözlənilməz xəta baş verdi
            </h1>
            <p className="mt-2 text-sm text-zinc-600">{this.state.message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/';
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Ana səhifəyə qayıt
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
