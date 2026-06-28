const SAVE_KEY = 'iod_save_v1';

interface SaveData {
  realmUnlocked: boolean;
  selectedChar:  string;
}

const DEFAULTS: SaveData = { realmUnlocked: false, selectedChar: 'knight' };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGame(data: Partial<SaveData>): void {
  const existing = loadSave();
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...existing, ...data }));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
