/**
 * Market Data Refresh Manager for AURUM PULSE.
 * Coordinates live requests, exponential backoff retries, request deduplication,
 * offline caching fallback, and freshness calculation.
 */

import { LiveMarketSnapshot, HistoricalBar, FreshnessState } from './types';
import { fetchCorganoLatest, fetchCorganoHistory } from './providers/corganoProvider';
import { fetchGoldPriceDevLatest } from './providers/goldPriceDevProvider';
import { fetchFrankfurterUsdInr } from './providers/frankfurterProvider';
import { saveLastSnapshot, getLastSnapshot, saveHistoricalBars, getHistoricalBars } from '../../storage/database';

export interface RefreshStatus {
  isRefreshing: boolean;
  lastSuccessTime: string | null;
  lastAttemptTime: string | null;
  lastError: string | null;
  activeProvider: 'corgano' | 'goldprice_dev';
}

type Subscriber = (snapshot: LiveMarketSnapshot | null, status: RefreshStatus) => void;

class RefreshManager {
  private currentSnapshot: LiveMarketSnapshot | null = null;
  private subscribers: Set<Subscriber> = new Set();
  private inFlightPromise: Promise<LiveMarketSnapshot> | null = null;
  private refreshTimer: any = null;
  private activeProvider: 'corgano' | 'goldprice_dev' = 'corgano';

  private status: RefreshStatus = {
    isRefreshing: false,
    lastSuccessTime: null,
    lastAttemptTime: null,
    lastError: null,
    activeProvider: 'corgano'
  };

  constructor() {
    const savedProvider = localStorage.getItem('aurum_active_provider');
    if (savedProvider === 'goldprice_dev' || savedProvider === 'corgano') {
      this.activeProvider = savedProvider;
      this.status.activeProvider = savedProvider;
    }
  }

  public setProvider(provider: 'corgano' | 'goldprice_dev') {
    this.activeProvider = provider;
    this.status.activeProvider = provider;
    localStorage.setItem('aurum_active_provider', provider);
    this.refreshNow(true);
  }

  public subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    // Send current state immediately
    cb(this.currentSnapshot, { ...this.status });

    // If no data loaded yet, load cached snapshot or fetch
    if (!this.currentSnapshot) {
      this.initializeData();
    }

    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    for (const sub of this.subscribers) {
      sub(this.currentSnapshot, { ...this.status });
    }
  }

  private async initializeData() {
    // 1. Instantly paint cached data from IndexedDB
    const cached = await getLastSnapshot();
    if (cached) {
      this.currentSnapshot = cached;
      this.status.lastSuccessTime = cached.lastSuccessfulFetch;
      this.notify();
    }

    // 2. Fetch fresh live data
    await this.refreshNow(false);

    // 3. Start auto-refresh interval (every 60s, respecting API quotas)
    this.startAutoRefresh();
  }

  public startAutoRefresh(intervalMs: number = 60000) {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      // Only refresh if window is active/visible
      if (typeof document !== 'undefined' && document.hidden) return;
      this.refreshNow(false);
    }, intervalMs);
  }

  public stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Manual refresh trigger or scheduled refresh
   */
  public async refreshNow(force: boolean = false): Promise<LiveMarketSnapshot | null> {
    // Prevent duplicate concurrent requests
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.status.isRefreshing = true;
    this.status.lastAttemptTime = new Date().toISOString();
    this.notify();

    this.inFlightPromise = this.executeFetchWithRetry(3, 1000);

    try {
      const freshSnapshot = await this.inFlightPromise;
      this.currentSnapshot = freshSnapshot;
      this.status.isRefreshing = false;
      this.status.lastSuccessTime = freshSnapshot.lastSuccessfulFetch;
      this.status.lastError = null;

      // Persist to IndexedDB
      await saveLastSnapshot(freshSnapshot);

      // Trigger background history fetch if history is empty
      this.checkAndFetchHistory();

      this.notify();
      return freshSnapshot;
    } catch (err: any) {
      console.warn('Refresh notice:', err?.message || err);
      this.status.isRefreshing = false;
      this.status.lastError = err?.message || 'Network request failed';

      // NEVER replace valid saved data with an invalid response!
      // If we already have a snapshot, mark its freshness as STALE or ERROR but preserve values
      if (this.currentSnapshot) {
        this.currentSnapshot = {
          ...this.currentSnapshot,
          overallFreshness: 'STALE'
        };
      }
      this.notify();
      return this.currentSnapshot;
    } finally {
      this.inFlightPromise = null;
    }
  }

  private async executeFetchWithRetry(maxRetries: number, initialDelayMs: number): Promise<LiveMarketSnapshot> {
    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt < maxRetries) {
      attempt++;
      try {
        if (this.activeProvider === 'goldprice_dev') {
          return await fetchGoldPriceDevLatest(8000);
        } else {
          return await fetchCorganoLatest(8000);
        }
      } catch (err) {
        if (attempt >= maxRetries) {
          // If primary provider fails, try fallback to the alternate provider
          try {
            if (this.activeProvider === 'corgano') {
              console.warn('Corgano failed, attempting fallback to goldprice.dev');
              return await fetchGoldPriceDevLatest(8000);
            } else if (this.activeProvider === 'goldprice_dev') {
              console.warn('goldprice.dev failed, attempting fallback to Corgano');
              return await fetchCorganoLatest(8000);
            }
          } catch (fallbackErr) {
            console.warn('Fallback provider also failed:', fallbackErr);
          }
          throw err;
        }
        // Exponential backoff with jitter
        const jitter = Math.random() * 200;
        await new Promise(r => setTimeout(r, delay + jitter));
        delay *= 2;
      }
    }
    throw new Error('All retry attempts exhausted');
  }

  private async checkAndFetchHistory() {
    try {
      const existing = await getHistoricalBars(10);
      if (existing.length < 50) {
        // Fetch from Corgano history API or fallback
        const bars = await fetchCorganoHistory();
        if (bars.length > 0) {
          await saveHistoricalBars(bars);
        }
      }
    } catch (err) {
      console.warn('History background fetch non-critical failure:', err);
    }
  }
}

export const refreshManager = new RefreshManager();

