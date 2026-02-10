/**
 * PocketBase 同步服務
 * 
 * 實現 Dexie (本地) ↔ PocketBase (遠端) 的雙向同步
 * 策略：Offline-First, Background Sync
 */

import { db } from './db';
import { pb, COLLECTIONS, getCurrentUser, isAuthenticated, type PBAsset, type PBSubscription } from './pocketbase';
import type { PhysicalAsset, Subscription } from './types';

/**
 * 同步狀態
 */
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingUploads: number;
  error: string | null;
}

/**
 * 同步方向
 */
export type SyncDirection = 'upload' | 'download' | 'bidirectional';

/**
 * 同步結果
 */
export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}

/**
 * 同步服務類別
 */
class SyncService {
  private syncInProgress = false;
  private syncInterval: number | null = null;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private lastError: string | null = null;

  /**
   * 取得當前同步狀態
   */
  async getStatus(): Promise<SyncStatus> {
    const allAssets = await db.assets.toArray();
    const allSubs = await db.subscriptions.toArray();
    
    const pendingAssets = allAssets.filter(a => a.synced === false).length;
    const pendingSubs = allSubs.filter(s => s.synced === false).length;
    
    const settings = await db.settings.get('global');
    const lastSyncAt = (settings as any)?.lastSyncedAt ? new Date((settings as any).lastSyncedAt) : null;
    
    return {
      isOnline: navigator.onLine && isAuthenticated(),
      isSyncing: this.syncInProgress,
      lastSyncAt,
      pendingUploads: pendingAssets + pendingSubs,
      error: this.lastError,
    };
  }

  /**
   * 監聽同步狀態變更
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    
    // 立即執行一次
    this.getStatus().then(callback);
    
    // 返回取消訂閱函數
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有監聽者狀態變更
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(callback => callback(status));
  }

  /**
   * 啟動自動同步（每 5 分鐘）
   */
  startAutoSync(intervalMinutes = 5): void {
    if (this.syncInterval) {
      console.warn('自動同步已在執行中');
      return;
    }

    console.log(`🔄 啟動自動同步（間隔 ${intervalMinutes} 分鐘）`);
    
    // 立即執行一次
    this.sync('bidirectional');
    
    // 設定定時器
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && isAuthenticated()) {
        this.sync('bidirectional');
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * 停止自動同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️  自動同步已停止');
    }
  }

  /**
   * 手動觸發同步
   */
  async sync(direction: SyncDirection = 'bidirectional'): Promise<SyncResult> {
    // 檢查是否已在同步中
    if (this.syncInProgress) {
      console.warn('同步已在執行中，跳過本次請求');
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['同步已在執行中'],
      };
    }

    // 檢查網路連線
    if (!navigator.onLine) {
      console.log('📵 離線模式，跳過同步');
      this.lastError = '網路未連線';
      await this.notifyListeners();
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['網路未連線'],
      };
    }

    // 檢查認證狀態
    if (!isAuthenticated()) {
      console.log('🔒 未登入，跳過同步');
      this.lastError = '請先登入帳號';
      await this.notifyListeners();
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['請先登入帳號'],
      };
    }

    // 檢查 PocketBase URL
    if (!pb.baseUrl) {
      console.log('⚙️ 未設定 PocketBase URL，跳過同步');
      this.lastError = '請在設定頁面設定 PocketBase 伺服器 URL';
      await this.notifyListeners();
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['請在設定頁面設定 PocketBase 伺服器 URL'],
      };
    }

    this.syncInProgress = true;
    this.lastError = null; // 清除之前的錯誤
    await this.notifyListeners();

    const result: SyncResult = {
      success: true,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      console.log('🔄 開始同步...');

      // 上傳本地未同步資料
      if (direction === 'upload' || direction === 'bidirectional') {
        const uploadResult = await this.uploadPendingChanges();
        result.uploaded = uploadResult.uploaded;
        result.errors.push(...uploadResult.errors);
      }

      // 下載遠端更新
      if (direction === 'download' || direction === 'bidirectional') {
        const downloadResult = await this.downloadRemoteChanges();
        result.downloaded = downloadResult.downloaded;
        result.conflicts = downloadResult.conflicts;
        result.errors.push(...downloadResult.errors);
      }

      // 更新最後同步時間
      await db.settings.update('global', {
        lastSyncedAt: new Date() as any,
      } as any);

      console.log(`✅ 同步完成: 上傳 ${result.uploaded}, 下載 ${result.downloaded}, 衝突 ${result.conflicts}`);
      
      // 清除錯誤狀態
      if (result.errors.length === 0) {
        this.lastError = null;
      } else {
        this.lastError = result.errors[0];
      }
    } catch (error) {
      console.error('❌ 同步失敗:', error);
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : '未知錯誤';
      result.errors.push(errorMsg);
      this.lastError = errorMsg;
    } finally {
      this.syncInProgress = false;
      await this.notifyListeners();
    }

    return result;
  }

  /**
   * 上傳本地未同步的變更到 PocketBase
   */
  private async uploadPendingChanges(): Promise<{ uploaded: number; errors: string[] }> {
    const user = getCurrentUser();
    if (!user) throw new Error('未登入');

    let uploaded = 0;
    const errors: string[] = [];

    // 1. 上傳資產
    const allAssets = await db.assets.toArray();
    const pendingAssets = allAssets.filter(a => a.synced === false);
    
    for (const asset of pendingAssets) {
      try {
        const pbData = this.assetToPocketBase(asset, user.id);
        
        if (asset.remoteId) {
          // 更新現有記錄
          await pb.collection(COLLECTIONS.ASSETS).update(asset.remoteId, pbData);
          console.log(`📤 更新資產: ${asset.name}`);
        } else {
          // 建立新記錄
          const created = await pb.collection(COLLECTIONS.ASSETS).create<PBAsset>(pbData);
          
          // 儲存 remoteId
          await db.assets.update(asset.id, {
            remoteId: created.id,
          });
          
          console.log(`📤 建立資產: ${asset.name}`);
        }
        
        // 標記為已同步
        await db.assets.update(asset.id, {
          synced: true,
          lastSyncedAt: new Date(),
        });
        
        uploaded++;
      } catch (error) {
        console.error(`上傳資產失敗 (${asset.name}):`, error);
        const errorMsg = error instanceof Error ? error.message : '未知錯誤';
        
        // 特殊錯誤處理
        if (errorMsg.includes('Missing collection context') || errorMsg.includes('not found')) {
          errors.push('PocketBase 集合尚未建立，請先在 PocketBase Admin UI 建立 assets 集合');
          break; // 停止繼續嘗試
        }
        
        errors.push(`資產 "${asset.name}": ${errorMsg}`);
      }
    }

    // 2. 上傳訂閱
    const allSubs = await db.subscriptions.toArray();
    const pendingSubs = allSubs.filter(s => s.synced === false);
    
    for (const sub of pendingSubs) {
      try {
        const pbData = this.subscriptionToPocketBase(sub, user.id);
        
        if (sub.remoteId) {
          await pb.collection(COLLECTIONS.SUBSCRIPTIONS).update(sub.remoteId, pbData);
          console.log(`📤 更新訂閱: ${sub.name}`);
        } else {
          const created = await pb.collection(COLLECTIONS.SUBSCRIPTIONS).create<PBSubscription>(pbData);
          
          await db.subscriptions.update(sub.id, {
            remoteId: created.id,
          });
          
          console.log(`📤 建立訂閱: ${sub.name}`);
        }
        
        await db.subscriptions.update(sub.id, {
          synced: true,
          lastSyncedAt: new Date(),
        });
        
        uploaded++;
      } catch (error) {
        console.error(`上傳訂閱失敗 (${sub.name}):`, error);
        const errorMsg = error instanceof Error ? error.message : '未知錯誤';
        
        // 特殊錯誤處理
        if (errorMsg.includes('Missing collection context') || errorMsg.includes('not found')) {
          errors.push('PocketBase 集合尚未建立，請先在 PocketBase Admin UI 建立 subscriptions 集合');
          break; // 停止繼續嘗試
        }
        
        errors.push(`訂閱 "${sub.name}": ${errorMsg}`);
      }
    }

    return { uploaded, errors };
  }

  /**
   * 下載遠端變更到本地
   */
  private async downloadRemoteChanges(): Promise<{ downloaded: number; conflicts: number; errors: string[] }> {
    let downloaded = 0;
    let conflicts = 0;
    const errors: string[] = [];

    try {
      // 1. 下載資產
      const remoteAssets = await this.fetchAllRemoteAssets();
      
      for (const remoteAsset of remoteAssets) {
        try {
          // 檢查本地是否已存在
          const localAsset = await db.assets.where('remoteId').equals(remoteAsset.id).first();
          
          if (localAsset) {
            // 比較更新時間，處理衝突
            const remoteUpdated = new Date(remoteAsset.updated);
            const localUpdated = localAsset.lastSyncedAt || new Date(0);
            
            if (remoteUpdated > localUpdated) {
              // 遠端較新，更新本地
              await db.assets.update(localAsset.id, {
                ...this.pocketBaseToAsset(remoteAsset, localAsset.id),
                synced: true,
                lastSyncedAt: new Date(),
              });
              
              console.log(`📥 更新本地資產: ${remoteAsset.name}`);
              downloaded++;
            }
          } else {
            // 本地不存在，新增
            const newAsset = this.pocketBaseToAsset(remoteAsset);
            await db.assets.add(newAsset);
            
            console.log(`📥 下載新資產: ${remoteAsset.name}`);
            downloaded++;
          }
        } catch (error) {
          console.error(`下載資產失敗 (${remoteAsset.name}):`, error);
          errors.push(`資產 "${remoteAsset.name}": ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      }

      // 2. 下載訂閱
      const remoteSubs = await this.fetchAllRemoteSubscriptions();
      
      for (const remoteSub of remoteSubs) {
        try {
          const localSub = await db.subscriptions.where('remoteId').equals(remoteSub.id).first();
          
          if (localSub) {
            const remoteUpdated = new Date(remoteSub.updated);
            const localUpdated = localSub.lastSyncedAt || new Date(0);
            
            if (remoteUpdated > localUpdated) {
              await db.subscriptions.update(localSub.id, {
                ...this.pocketBaseToSubscription(remoteSub, localSub.id),
                synced: true,
                lastSyncedAt: new Date(),
              });
              
              console.log(`📥 更新本地訂閱: ${remoteSub.name}`);
              downloaded++;
            }
          } else {
            const newSub = this.pocketBaseToSubscription(remoteSub);
            await db.subscriptions.add(newSub);
            
            console.log(`📥 下載新訂閱: ${remoteSub.name}`);
            downloaded++;
          }
        } catch (error) {
          console.error(`下載訂閱失敗 (${remoteSub.name}):`, error);
          errors.push(`訂閱 "${remoteSub.name}": ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      }
    } catch (error) {
      console.error('下載遠端變更失敗:', error);
      errors.push(error instanceof Error ? error.message : '未知錯誤');
    }

    return { downloaded, conflicts, errors };
  }

  /**
   * 取得所有遠端資產（分頁處理）
   */
  private async fetchAllRemoteAssets(): Promise<PBAsset[]> {
    const allAssets: PBAsset[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await pb.collection(COLLECTIONS.ASSETS).getList<PBAsset>(page, perPage, {
        filter: `user = "${getCurrentUser()?.id}"`,
        sort: '-updated',
      });

      allAssets.push(...result.items);

      if (result.items.length < perPage) break;
      page++;
    }

    return allAssets;
  }

  /**
   * 取得所有遠端訂閱（分頁處理）
   */
  private async fetchAllRemoteSubscriptions(): Promise<PBSubscription[]> {
    const allSubs: PBSubscription[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await pb.collection(COLLECTIONS.SUBSCRIPTIONS).getList<PBSubscription>(page, perPage, {
        filter: `user = "${getCurrentUser()?.id}"`,
        sort: '-updated',
      });

      allSubs.push(...result.items);

      if (result.items.length < perPage) break;
      page++;
    }

    return allSubs;
  }

  /**
   * 轉換：Dexie PhysicalAsset → PocketBase 格式
   */
  private assetToPocketBase(asset: PhysicalAsset, userId: string): Partial<PBAsset> {
    return {
      name: asset.name,
      category: asset.category,
      price: asset.price,
      currency: asset.currency,
      purchase_date: asset.purchaseDate.toISOString(),
      target_lifespan: asset.targetLifespan,
      status: asset.status,
      role: asset.role,
      system_id: asset.systemId || undefined,
      linked_asset_id: asset.linkedAssetId || undefined,
      notes: asset.notes || '',
      sold_price: asset.soldPrice || 0,
      power_watts: asset.powerWatts,
      daily_usage_hours: asset.dailyUsageHours,
      recurring_maintenance_cost: asset.recurringMaintenanceCost,
      maintenance_log: asset.maintenanceLog.map(log => ({
        date: log.date.toISOString(),
        note: log.note,
        cost: log.cost,
      })),
      user: userId,
      synced: true,
      local_id: asset.id,
    };
  }

  /**
   * 轉換：PocketBase → Dexie PhysicalAsset
   */
  private pocketBaseToAsset(pbAsset: PBAsset, existingId?: string): PhysicalAsset {
    return {
      id: existingId || pbAsset.local_id || crypto.randomUUID(),
      name: pbAsset.name,
      category: pbAsset.category,
      price: pbAsset.price,
      currency: pbAsset.currency,
      purchaseDate: new Date(pbAsset.purchase_date),
      targetLifespan: pbAsset.target_lifespan,
      status: pbAsset.status,
      role: pbAsset.role,
      systemId: pbAsset.system_id || null,
      linkedAssetId: pbAsset.linked_asset_id || null,
      notes: pbAsset.notes || '',
      soldPrice: pbAsset.sold_price || undefined,
      powerWatts: pbAsset.power_watts,
      dailyUsageHours: pbAsset.daily_usage_hours,
      recurringMaintenanceCost: pbAsset.recurring_maintenance_cost,
      maintenanceLog: pbAsset.maintenance_log.map(log => ({
        date: new Date(log.date),
        note: log.note,
        cost: log.cost,
      })),
      remoteId: pbAsset.id,
      synced: true,
      lastSyncedAt: new Date(),
    };
  }

  /**
   * 轉換：Dexie Subscription → PocketBase 格式
   */
  private subscriptionToPocketBase(sub: Subscription, userId: string): Partial<PBSubscription> {
    return {
      name: sub.name,
      cost: sub.cost,
      currency: sub.currency,
      billing_cycle: sub.billingCycle,
      start_date: sub.startDate.toISOString(),
      category: sub.category,
      status: sub.status,
      cancelled_date: sub.cancelledDate?.toISOString(),
      notes: sub.notes || '',
      user: userId,
      synced: true,
      local_id: sub.id,
    };
  }

  /**
   * 轉換：PocketBase → Dexie Subscription
   */
  private pocketBaseToSubscription(pbSub: PBSubscription, existingId?: string): Subscription {
    return {
      id: existingId || pbSub.local_id || crypto.randomUUID(),
      name: pbSub.name,
      cost: pbSub.cost,
      currency: pbSub.currency,
      billingCycle: pbSub.billing_cycle,
      startDate: new Date(pbSub.start_date),
      category: pbSub.category,
      status: pbSub.status,
      cancelledDate: pbSub.cancelled_date ? new Date(pbSub.cancelled_date) : undefined,
      notes: pbSub.notes || '',
      remoteId: pbSub.id,
      synced: true,
      lastSyncedAt: new Date(),
    };
  }
}

// 匯出單例實例
export const syncService = new SyncService();

// 匯出便利函數
export const startAutoSync = (intervalMinutes = 5) => syncService.startAutoSync(intervalMinutes);
export const stopAutoSync = () => syncService.stopAutoSync();
export const manualSync = (direction?: SyncDirection) => syncService.sync(direction);
export const getSyncStatus = () => syncService.getStatus();
export const onSyncStatusChange = (callback: (status: SyncStatus) => void) => syncService.onStatusChange(callback);
