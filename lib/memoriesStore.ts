import { WineMemory } from '../types/memory';

type Listener = (memories: WineMemory[]) => void;

let memoriesStore: WineMemory[] = [];
const listeners = new Set<Listener>();

export function getMemoriesStore(): WineMemory[] {
  return memoriesStore;
}

export function setMemoriesStore(next: WineMemory[]): void {
  memoriesStore = next;
  // Différer la notification pour éviter les setState pendant le rendu
  queueMicrotask(() => {
    for (const l of listeners) {
      try { l(memoriesStore); } catch {}
    }
  });
}

export function subscribeMemories(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}




