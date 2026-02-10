/**
 * 同步 React Hooks
 * 
 * 支援 PocketBase 和 Supabase 兩種後端
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService as pbSyncService, type SyncStatus, type SyncResult } from '../syncService';
import { supabaseSyncService } from '../supabaseSyncService';
import type { SyncDirection } from '../syncService';
import { 
  isAuthenticated as pbIsAuthenticated, 
  onAuthChange as pbOnAuthChange, 
  getCurrentUser as pbGetCurrentUser, 
  type PBUser,
  hasPocketBaseUrl 
} from '../pocketbase';
import { 
  isAuthenticatedAsync,
  getCurrentUser as sbGetCurrentUser,
  onAuthChange as sbOnAuthChange,
  hasSupabaseConfig
} from '../supabase';

/**
 * 取得當前使用的同步服務
 */
function getSyncService() {
  if (hasSupabaseConfig()) {
    return supabaseSyncService;
  } else if (hasPocketBaseUrl()) {
    return pbSyncService;
  }
  return null;
}

/**
 * 檢查是否已認證（支援兩種後端）- 非同步版本
 */
async function isUserAuthenticated(): Promise<boolean> {
  if (hasSupabaseConfig()) {
    return await isAuthenticatedAsync();
  } else if (hasPocketBaseUrl()) {
    return pbIsAuthenticated();
  }
  return false;
}

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
    const syncService = getSyncService();
    if (!syncService) {
      return;
    }

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
    const syncService = getSyncService();
    if (!syncService) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['未設定同步伺服器'],
      };
    }
    return await syncService.sync(direction);
  }, []);

  return { ...status, sync };
}

/**
 * Hook: 監聽認證狀態
 */
export function useAuth(): {
  isAuthenticated: boolean;
  user: PBUser | any | null;
  isLoading: boolean;
} {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<PBUser | any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // 非同步初始化
    const initialize = async () => {
      const authenticated = await isUserAuthenticated();
      if (!mounted) return;
      
      setIsAuth(authenticated);
      setIsLoading(false);

      // 根據後端類型設定使用者和監聽器
      if (hasSupabaseConfig()) {
        // Supabase
        const currentUser = await sbGetCurrentUser();
        if (mounted) setUser(currentUser);
        
        const unsubscribe = sbOnAuthChange((user) => {
          if (!mounted) return;
          setIsAuth(!!user);
          setUser(user);
        });
        return unsubscribe;
      } else if (hasPocketBaseUrl()) {
        // PocketBase
        if (mounted) setUser(pbGetCurrentUser());
        
        const unsubscribe = pbOnAuthChange((token, model) => {
          if (!mounted) return;
          setIsAuth(!!token);
          setUser(model as PBUser | null);
        });
        return unsubscribe;
      }
    };

    const cleanupPromise = initialize();
    
    return () => {
      mounted = false;
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, []);

  return { isAuthenticated: isAuth, user, isLoading };
}

/**
 * Hook: 自動同步管理
 */
export function useAutoSync(enabled = true, intervalMinutes = 5): void {
  useEffect(() => {
    if (!enabled) return;

    const syncService = getSyncService();
    if (!syncService) return;

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
