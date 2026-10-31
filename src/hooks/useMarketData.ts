import { useState, useEffect } from 'react';
import { refreshManager, RefreshStatus } from '../services/marketData/refreshManager';
import { LiveMarketSnapshot } from '../services/marketData/types';

export function useMarketData() {
  const [snapshot, setSnapshot] = useState<LiveMarketSnapshot | null>(null);
  const [status, setStatus] = useState<RefreshStatus>({
    isRefreshing: true,
    lastSuccessTime: null,
    lastAttemptTime: null,
    lastError: null,
    activeProvider: 'corgano'
  });

  useEffect(() => {
    const unsubscribe = refreshManager.subscribe((newSnapshot, newStatus) => {
      setSnapshot(newSnapshot);
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = () => refreshManager.refreshNow(true);
  const setProvider = (p: 'corgano' | 'goldprice_dev') => refreshManager.setProvider(p);

  return {
    snapshot,
    status,
    refresh,
    setProvider,
    isLive: snapshot?.overallFreshness === 'LIVE',
    isCached: snapshot?.overallFreshness === 'CACHED',
    isStale: snapshot?.overallFreshness === 'STALE',
    isError: Boolean(status.lastError)
  };
}

