import { Wine } from '../types/wine';

type Listener = (wines: Wine[]) => void;

let winesStore: Wine[] = [];
const listeners = new Set<Listener>();

export function getWinesStore(): Wine[] {
  return winesStore;
}

export function setWinesStore(next: Wine[]): void {
  winesStore = next;
  for (const l of listeners) {
    try { l(winesStore); } catch {}
  }
}

export function subscribeWines(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

