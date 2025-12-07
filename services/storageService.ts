
import { MemoryItem, TodoItem, LearningProfile, CustomCommand, NoFapState, Alarm, MasterProfile, MusicTrack } from '../types';

const DB_NAME = 'MARCO_DB';
const DB_VERSION = 6; // Incremented for MUSIC
const STORE_MEMORIES = 'memories';
const STORE_TODOS = 'todos';
const STORE_PROFILE = 'profile';
const STORE_COMMANDS = 'custom_commands';
const STORE_NOFAP = 'nofap_data';
const STORE_ALARMS = 'alarms';
const STORE_MUSIC = 'music_vault'; // NEW
const VAULT_PASS_KEY = 'MARCO_VAULT_PASS';
const SCRATCHPAD_KEY = 'MARCO_SCRATCHPAD';
const MASTER_PROFILE_KEY = 'MARCO_MASTER_PROFILE_V1';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TODOS)) {
        db.createObjectStore(STORE_TODOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_COMMANDS)) {
        db.createObjectStore(STORE_COMMANDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NOFAP)) {
        db.createObjectStore(STORE_NOFAP, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ALARMS)) {
        db.createObjectStore(STORE_ALARMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MUSIC)) {
        db.createObjectStore(STORE_MUSIC, { keyPath: 'id' }); // NEW
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- EXISTING METHODS KEPT AS IS ---
export const saveMemory = async (memory: MemoryItem): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_MEMORIES, 'readwrite');
  tx.objectStore(STORE_MEMORIES).put(memory);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getMemories = async (): Promise<MemoryItem[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_MEMORIES, 'readonly');
  const request = tx.objectStore(STORE_MEMORIES).getAll();
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const deleteMemory = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_MEMORIES, 'readwrite');
  tx.objectStore(STORE_MEMORIES).delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const saveTodo = async (todo: TodoItem): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_TODOS, 'readwrite');
  tx.objectStore(STORE_TODOS).put(todo);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getTodos = async (): Promise<TodoItem[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_TODOS, 'readonly');
  const request = tx.objectStore(STORE_TODOS).getAll();
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const deleteTodo = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_TODOS, 'readwrite');
  tx.objectStore(STORE_TODOS).delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const saveLearningProfile = async (profile: LearningProfile): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_PROFILE, 'readwrite');
  tx.objectStore(STORE_PROFILE).put({ ...profile, id: 'user_profile' });
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getLearningProfile = async (): Promise<LearningProfile | null> => {
  const db = await openDB();
  const tx = db.transaction(STORE_PROFILE, 'readonly');
  const request = tx.objectStore(STORE_PROFILE).get('user_profile');
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const saveCustomCommand = async (command: CustomCommand): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_COMMANDS, 'readwrite');
  tx.objectStore(STORE_COMMANDS).put(command);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const deleteCustomCommand = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_COMMANDS, 'readwrite');
  tx.objectStore(STORE_COMMANDS).delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getCustomCommands = async (): Promise<CustomCommand[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_COMMANDS, 'readonly');
  const request = tx.objectStore(STORE_COMMANDS).getAll();
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const saveNoFapData = async (data: NoFapState): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NOFAP, 'readwrite');
  tx.objectStore(STORE_NOFAP).put({ ...data, id: 'user_nofap' });
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getNoFapData = async (): Promise<NoFapState | null> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NOFAP, 'readonly');
  const request = tx.objectStore(STORE_NOFAP).get('user_nofap');
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const saveAlarm = async (alarm: Alarm): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_ALARMS, 'readwrite');
  tx.objectStore(STORE_ALARMS).put(alarm);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const deleteAlarm = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_ALARMS, 'readwrite');
  tx.objectStore(STORE_ALARMS).delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getAlarms = async (): Promise<Alarm[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_ALARMS, 'readonly');
  const request = tx.objectStore(STORE_ALARMS).getAll();
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
  });
};

// --- NEW MUSIC METHODS ---
export const saveMusicTrack = async (track: MusicTrack): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_MUSIC, 'readwrite');
    tx.objectStore(STORE_MUSIC).put(track);
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
};

export const getMusicTracks = async (): Promise<MusicTrack[]> => {
    const db = await openDB();
    const tx = db.transaction(STORE_MUSIC, 'readonly');
    const request = tx.objectStore(STORE_MUSIC).getAll();
    return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
    });
};

export const deleteMusicTrack = async (id: string): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_MUSIC, 'readwrite');
    tx.objectStore(STORE_MUSIC).delete(id);
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
};

// Vault Security (Simple storage for password hash/text)
export const getVaultPassword = (): string | null => {
  return localStorage.getItem(VAULT_PASS_KEY);
};

export const setVaultPassword = (password: string | null): void => {
  if (password === null) {
    localStorage.removeItem(VAULT_PASS_KEY);
  } else {
    localStorage.setItem(VAULT_PASS_KEY, password);
  }
};

// Scratchpad Storage
export const getScratchpad = (): string => {
  return localStorage.getItem(SCRATCHPAD_KEY) || '';
};

export const saveScratchpad = (content: string): void => {
  localStorage.setItem(SCRATCHPAD_KEY, content);
};

// --- MASTER PROFILE & LICENSE STORAGE ---
export const saveMasterProfile = (profile: MasterProfile): void => {
    localStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(profile));
};

export const getMasterProfile = (): MasterProfile | null => {
    const raw = localStorage.getItem(MASTER_PROFILE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};
