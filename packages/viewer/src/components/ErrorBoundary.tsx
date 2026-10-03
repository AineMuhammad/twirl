import { Component, type ReactNode } from 'react';

interface Props {
  onError: (error: unknown) => void;
  /** Rendered instead of the children after an error. Defaults to nothing. */
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches load/parse failures inside the canvas so the rest of the scene keeps rendering.
 * Reset it by changing its `key` (e.g. to the URL being loaded).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
