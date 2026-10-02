import { Component, type ReactNode } from 'react';

interface Props {
  onError: (error: unknown) => void;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches model load/parse failures inside the canvas so the rest of the scene keeps rendering.
 * The host shows the message; reset by changing this boundary's `key` (e.g. the model URL).
 */
export class ModelErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
