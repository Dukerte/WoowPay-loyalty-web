import type { AppState } from './types';

const DEFAULT_STATE: AppState = {
  userType:   null,
  code:       null,
  spinsTotal: 0,
  spinsUsed:  0,
  history:    [],
};

let state: AppState = { ...DEFAULT_STATE };
const subscribers: Array<(s: AppState) => void> = [];

export function getState(): Readonly<AppState> { return state; }

export function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  subscribers.forEach(fn => fn(state));
}

export function resetState(): void {
  state = { ...DEFAULT_STATE };
  subscribers.forEach(fn => fn(state));
}

export function subscribe(fn: (s: AppState) => void): () => void {
  subscribers.push(fn);
  return () => { const i = subscribers.indexOf(fn); if (i > -1) subscribers.splice(i, 1); };
}
