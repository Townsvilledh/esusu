/* Esusu local storage — IndexedDB behind a thin promise wrapper.
 *
 * All data lives on the device (Requirement 4). If IndexedDB is missing or
 * blocked (e.g. some private-browsing modes), the store falls back to
 * in-memory state for the session and reports `persistent === false`, so
 * the UI can show the plain-language banner from Requirement 4.4 instead of
 * pretending saves worked.
 *
 * Every mutation is awaited before the caller confirms success to the user
 * (Requirement 1.3 / task 3.3): callers `await saveCircle(...)` first, and
 * only then navigate or show a confirmation.
 */

import { validateCircle, type Circle } from "./domain";

const DB_NAME = "esusu";
const DB_VERSION = 1;
const STORE_NAME = "circles";

let dbPromise: Promise<IDBDatabase> | null = null;
let memoryFallback: Map<string, Circle> | null = null;

/** True once the store has confirmed IndexedDB works; false in memory mode. */
export let persistent = true;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB blocked"));
  });
  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
  });
  const result = await run(tx.objectStore(STORE_NAME));
  await done;
  return result;
}

/** Probe IndexedDB once; on failure, switch the whole store to memory mode. */
export async function initStore(): Promise<boolean> {
  if (memoryFallback) return false;
  try {
    await openDb();
    persistent = true;
    return true;
  } catch {
    forceMemory();
    return false;
  }
}

/** Permanently switch this session to in-memory storage (Requirement 4.4). */
function forceMemory(): void {
  if (!memoryFallback) memoryFallback = new Map();
  persistent = false;
}

function sorted(circles: Circle[]): Circle[] {
  return circles.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
}

export async function listCircles(): Promise<Circle[]> {
  if (memoryFallback) return sorted([...memoryFallback.values()]);
  try {
    const all = await withStore("readonly", (store) =>
      requestToPromise(store.getAll() as IDBRequest<Circle[]>)
    );
    return sorted(all ?? []);
  } catch {
    forceMemory();
    return sorted([...memoryFallback!.values()]);
  }
}

export async function getCircle(id: string): Promise<Circle | undefined> {
  if (memoryFallback) return memoryFallback.get(id);
  try {
    return await withStore("readonly", (store) =>
      requestToPromise(store.get(id) as IDBRequest<Circle | undefined>)
    );
  } catch {
    forceMemory();
    return memoryFallback!.get(id);
  }
}

/** Upsert a circle. Validates first — an invalid circle is never written. */
export async function saveCircle(circle: Circle): Promise<void> {
  const problems = validateCircle(circle);
  if (problems.length > 0) throw new Error(problems[0]);
  if (memoryFallback) {
    memoryFallback.set(circle.id, circle);
    return;
  }
  try {
    await withStore("readwrite", (store) => requestToPromise(store.put(circle)));
  } catch {
    forceMemory();
    memoryFallback!.set(circle.id, circle);
  }
}

export async function deleteCircle(id: string): Promise<void> {
  if (memoryFallback) {
    memoryFallback.delete(id);
    return;
  }
  try {
    await withStore("readwrite", (store) => requestToPromise(store.delete(id)));
  } catch {
    forceMemory();
    memoryFallback!.delete(id);
  }
}
