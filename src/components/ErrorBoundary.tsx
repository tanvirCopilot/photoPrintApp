import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console — could integrate with remote error reporting
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white/95 rounded-xl p-6 shadow-lg max-w-2xl">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{String(this.state.error)}</pre>
            <p className="mt-4 text-sm text-slate-600">Open the browser console for a full stack trace.</p>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
