import React from 'react';
import './presentation.css';
import { CinematicAccent } from './CinematicAccent';

export function ResultFeedback({ kind, children }: React.PropsWithChildren<{ kind: 'reward' | 'victory' | 'defeat' }>) {
  return <div className="result-feedback" data-kind={kind} role="status">
    {kind === 'victory' && <CinematicAccent kind="victory" />}
    <svg width="25" height="25" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2 29 10v12L16 30 3 22V10Z" stroke="currentColor" />
      {kind === 'defeat' ? <path d="m11 11 10 10m0-10L11 21" stroke="currentColor" strokeWidth="2" /> : <path d="m9 16 5 5 10-11" stroke="currentColor" strokeWidth="2" />}
    </svg><span>{children}</span>
  </div>;
}
