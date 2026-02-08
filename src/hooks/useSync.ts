/**
 * PocketBase 同步 React Hooks
 * 
 * 提供便利的 React 整合
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, type SyncStatus, type SyncResult } from '../syncService';
import type { SyncDirection } from '../syncService';
import { isAuthenticated, onAuthChange, getCurrentUser, type PBUser } from '../pocketbase';

/**
 * Hook: 監聽同步狀態
 */
export function useSyncStatus(): SyncStatus & { sync: (direction?: SyncDirection) => Promise<SyncResult> } {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSyncAt: null,
    pendingUploads: 0,
    error: null,
  });

  useEffect(() => {
    // 訂閱狀態變更
    const unsubscribe = syncService.onStatusChange(setStatus);

    // 監聽網路狀態
    const handleOnline = () => {
      syncService.getStatus().then(setStatus);
    };
    const handleOffline = () => {
      syncService.getStatus().then(setStatus);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async (direction?: SyncDirection) => {
    return await syncService.sync(direction);
  }, []);

  return { ...status, sync };
}

/**
 * Hook: 監聽認證狀態
 */
export function useAuth(): {
  isAuthenticated: boolean;
  user: PBUser | null;
  isLoading: boolean;
} {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [user, setUser] = useState<PBUser | null>(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化
    setIsAuth(isAuthenticated());
    setUser(getCurrentUser());
    setIsLoading(false);

    // 監聽認證狀態變更
    const unsubscribe = onAuthChange((token, model) => {
      setIsAuth(!!token);
      setUser(model as PBUser | null);
    });

    return unsubscribe;
  }, []);

  return { isAuthenticated: isAuth, user, isLoading };
}

/**
 * Hook: 自動同步管理
 */
export function useAutoSync(enabled = true, intervalMinutes = 5): void {
  useEffect(() => {
    if (!enabled) return;

    syncService.startAutoSync(intervalMinutes);

    return () => {
      syncService.stopAutoSync();
    };
  }, [enabled, intervalMinutes]);
}

/**
 * Hook: 網路狀態
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
