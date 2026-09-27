import { Component, type ReactNode } from 'react';
import { ErrorState } from './ResourceState';
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ErrorState retry={() => location.reload()} /> : this.props.children;
  }
}
