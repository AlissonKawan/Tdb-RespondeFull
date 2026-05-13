// src/context/tdbStorage.ts
import type { TDBState } from '../types/index';
import { SEED_STATE } from './seedData';

const STORAGE_KEY = 'tdb_sistema_v2';

export function loadTDBState(): TDBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TDBState;
  } catch {
    // erro ao ler localStorage, usa seed
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STATE));
  return SEED_STATE;
}

export function saveTDBState(s: TDBState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}