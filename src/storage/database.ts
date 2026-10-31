/**
 * Client-Side Browser Storage using IndexedDB and LocalStorage.
 * Ensures complete offline operation and persistent historical storage.
 */

import { LiveMarketSnapshot, HistoricalBar } from '../services/marketData/types';

const DB_NAME = 'AurumPulseDB';
const DB_VERSION = 1;

export interface LocalQuotation {
  id: string;
  location: string; // e.g. Chennai, Madurai, Kerala, Custom
  purity: '24K' | '22K' | '18K';
  pricePer10g: number;
  pricePerGram: number;
  sourceType: 'WHATSAPP_IMPORT' | 'MANUAL_ENTRY' | 'CSV_IMPORT';
  sourceLabel?: string;
  shopName?: string;
  notes?: string;
  messageTimestamp?: string;
  importedAt: string;
}

export interface PriceAlert {
  id: string;
  instrument: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW' | 'DAILY_MOVE_PCT';
  label: string;
  active: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('quotations')) {
        const store = db.createObjectStore('quotations', { keyPath: 'id' });
        store.createIndex('location', 'location', { unique: false });
        store.createIndex('importedAt', 'importedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('alerts')) {
        db.createObjectStore('alerts', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Snapshot Repository
export async function saveLastSnapshot(snapshot: LiveMarketSnapshot): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');
    store.put({ key: 'latest', snapshot, savedAt: new Date().toISOString() });
    // Also save light summary to localStorage for instantaneous paint
    localStorage.setItem('aurum_last_snapshot', JSON.stringify({
      goldUsd: snapshot.goldUsdPerOz.value,
      usdInr: snapshot.usdInrRate.value,
      theo24k: snapshot.theoretical24kInr10g.value,
      theo22k: snapshot.theoretical22kInr10g.value,
      observedAt: snapshot.goldUsdPerOz.observedAt,
      fetchedAt: snapshot.lastSuccessfulFetch,
      provider: snapshot.provider
    }));
  } catch (err) {
    console.warn('Failed to save snapshot to IndexedDB:', err);
  }
}

export async function getLastSnapshot(): Promise<LiveMarketSnapshot | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const req = store.get('latest');
      req.onsuccess = () => {
        if (req.result && req.result.snapshot) {
          const snapshot = req.result.snapshot as LiveMarketSnapshot;
          // Mark freshness as CACHED
          snapshot.overallFreshness = 'CACHED';
          snapshot.goldUsdPerOz.freshness = 'CACHED';
          snapshot.usdInrRate.freshness = 'CACHED';
          snapshot.theoretical24kInr10g.freshness = 'CACHED';
          snapshot.theoretical22kInr10g.freshness = 'CACHED';
          snapshot.theoretical18kInr10g.freshness = 'CACHED';
          resolve(snapshot);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// History Repository
export async function saveHistoricalBars(bars: HistoricalBar[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    for (const b of bars) {
      store.put(b);
    }
  } catch (err) {
    console.warn('Failed to save historical bars to IndexedDB:', err);
  }
}

export async function getHistoricalBars(limit: number = 365): Promise<HistoricalBar[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result as HistoricalBar[];
        all.sort((a, b) => a.date.localeCompare(b.date));
        resolve(all.slice(-limit));
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

// Local Quotations Repository
export async function saveLocalQuotation(quote: LocalQuotation): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('quotations', 'readwrite');
  tx.objectStore('quotations').put(quote);
}

export async function getAllLocalQuotations(): Promise<LocalQuotation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('quotations', 'readonly');
      const req = tx.objectStore('quotations').getAll();
      req.onsuccess = () => {
        const res = req.result as LocalQuotation[];
        res.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
        resolve(res);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function deleteLocalQuotation(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('quotations', 'readwrite');
  tx.objectStore('quotations').delete(id);
}

// Price Alerts Repository
export async function savePriceAlert(alert: PriceAlert): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('alerts', 'readwrite');
  tx.objectStore('alerts').put(alert);
}

export async function getAllPriceAlerts(): Promise<PriceAlert[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('alerts', 'readonly');
      const req = tx.objectStore('alerts').getAll();
      req.onsuccess = () => resolve(req.result as PriceAlert[]);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function deletePriceAlert(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('alerts', 'readwrite');
  tx.objectStore('alerts').delete(id);
}

// Clear all local application data (Security & Privacy requirement)
export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['snapshots', 'history', 'quotations', 'alerts'], 'readwrite');
    tx.objectStore('snapshots').clear();
    tx.objectStore('history').clear();
    tx.objectStore('quotations').clear();
    tx.objectStore('alerts').clear();
  } catch (err) {
    console.error('Error clearing IndexedDB:', err);
  }
  localStorage.clear();
}

