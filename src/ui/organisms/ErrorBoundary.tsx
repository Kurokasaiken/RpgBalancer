import { Component, type ErrorInfo, type ReactNode } from 'react';
import { GlassCard } from '../atoms/GlassCard';
import { GlassButton } from '../atoms/GlassButton';

const SHOW_STACK_DEFAULT =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 w-full h-full flex items-center justify-center">
                    <GlassCard variant="danger" className="max-w-md w-full text-center p-8">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
                        <p className="text-gray-300 mb-2">
                            An error occurred in <strong>{this.props.componentName || 'this component'}</strong>.
                        </p>
                        <div className="text-sm text-red-300/70 font-mono bg-black/20 p-2 rounded mb-6 overflow-auto max-h-48 text-left space-y-2">
                            <p className="whitespace-pre-wrap break-words" data-testid="error-message">
                                {this.state.error?.message}
                            </p>
                            {this.state.error?.stack && (
                                <details
                                    className="text-xs text-red-200/70"
                                    open={SHOW_STACK_DEFAULT}
                                    data-testid="error-stack"
                                >
                                    <summary className="cursor-pointer text-red-100/80">Stack trace</summary>
                                    <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.stack}</pre>
                                </details>
                            )}
                        </div>
                        <GlassButton
                            variant="secondary"
                            onClick={() => this.setState({ hasError: false, error: null })}
                        >
                            Try Again
                        </GlassButton>
                    </GlassCard>
                </div>
            );
        }

        return this.props.children;
    }
}
