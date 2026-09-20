import { useSyncExternalStore } from 'react';

export type VisualPreferences = { quality: 'auto' | 'low' | 'standard'; cinematic: boolean };
export const defaultVisualPreferences: VisualPreferences = { quality: 'auto', cinematic: false };
export function parseVisualPreferences(value: string | null): VisualPreferences {
  try {
    const parsed = JSON.parse(value || 'null');
    return { quality: ['auto', 'low', 'standard'].includes(parsed?.quality) ? parsed.quality : 'auto', cinematic: parsed?.cinematic === true };
  } catch { return { ...defaultVisualPreferences }; }
}
export function cinematicAllowed(settings: VisualPreferences, reduced: boolean, compact: boolean, hidden: boolean) {
  return settings.cinematic && settings.quality !== 'low' && !reduced && !hidden && !(settings.quality === 'auto' && compact);
}
const key = 'nekomon_visual_preferences';
let current = defaultVisualPreferences;
try { current = parseVisualPreferences(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setVisualPreferences(value: VisualPreferences) {
  current = parseVisualPreferences(JSON.stringify(value));
  try { localStorage.setItem(key, JSON.stringify(current)); } catch { /* Memory-only settings still work. */ }
  listeners.forEach(listener => listener());
}
export function useVisualPreferences() { return useSyncExternalStore(subscribe, () => current, () => defaultVisualPreferences); }
