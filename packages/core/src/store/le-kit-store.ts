import { atom, type WritableAtom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export type LeKitPersistKey = 'theme' | 'appearance';

export type LeKitPersistConfig = {
  persistKeys: LeKitPersistKey[];
};

export type LeKitStore = {
  theme$: WritableAtom<string>;
  appearance$: WritableAtom<string>;
};

export const defaultPersistKeys: LeKitPersistKey[] = ['theme', 'appearance'];

function hasPersistKey(keys: LeKitPersistKey[], key: LeKitPersistKey): boolean {
  return keys.includes(key);
}

export function parsePersistConfig(value?: string): LeKitPersistConfig {
  if (!value || value.trim().length === 0 || value.trim().toLowerCase() === 'all') {
    return { persistKeys: [...defaultPersistKeys] };
  }

  const normalized = value
    .split(/\s+/)
    .map(token => token.trim().toLowerCase())
    .filter(Boolean);

  if (normalized.includes('none')) {
    return { persistKeys: [] };
  }

  const persistKeys: LeKitPersistKey[] = [];
  if (normalized.includes('theme')) {
    persistKeys.push('theme');
  }
  if (normalized.includes('appearance')) {
    persistKeys.push('appearance');
  }

  return { persistKeys };
}

export function createLeKitStore(options?: {
  storageKey?: string;
  persistKeys?: LeKitPersistKey[];
}): LeKitStore {
  const storageKey = options?.storageKey || 'le-kit';
  const persistKeys = options?.persistKeys || defaultPersistKeys;

  const theme$ = hasPersistKey(persistKeys, 'theme')
    ? persistentAtom<string>(`${storageKey}:theme`, 'default')
    : atom<string>('default');

  const appearance$ = hasPersistKey(persistKeys, 'appearance')
    ? persistentAtom<string>(`${storageKey}:appearance`, 'default')
    : atom<string>('default');

  return {
    theme$,
    appearance$,
  };
}

export const defaultLeKitStore = createLeKitStore();
