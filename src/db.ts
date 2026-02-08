import Dexie, { type Table } from 'dexie';
import type { PhysicalAsset, Subscription, GlobalSettings } from './types';

export class CPDDatabase extends Dexie {
  // 定義資料表
  assets!: Table<PhysicalAsset>;
  subscriptions!: Table<Subscription>;
  settings!: Table<GlobalSettings & { id: string }>;

  constructor() {
    super('CPDTrackerDB');
    
    // Version 1: 原始結構
    this.version(1).stores({
      assets: 'id, name, category, purchaseDate, status',
      subscriptions: 'id, name, category, startDate, status'
    });
    
    // Version 2: v0.4.0 升級 - 新增親子關係、電力、隱形成本
    this.version(2).stores({
      assets: 'id, name, category, purchaseDate, status, parentId, isComposite',
      subscriptions: 'id, name, category, startDate, status, billingCycle',
      settings: 'id'
    }).upgrade(async (trans) => {
      // 為所有現有資產新增預設值
      await trans.table('assets').toCollection().modify((asset: any) => {
        asset.parentId = asset.parentId ?? null;
        asset.isComposite = asset.isComposite ?? false;
        asset.powerWatts = asset.powerWatts ?? 0;
        asset.dailyUsageHours = asset.dailyUsageHours ?? 0;
        asset.recurringMaintenanceCost = asset.recurringMaintenanceCost ?? 0;
      });
      
      // 初始化全域設定
      const existingSettings = await trans.table('settings').toArray();
      if (existingSettings.length === 0) {
        await trans.table('settings').add({
          id: 'global',
          electricityRate: 4.0, // NT$ / kWh
          locale: 'zh-TW',
          defaultCurrency: 'TWD'
        });
      }
    });
    
    // Version 3: v0.5.0 重構 - 角色系統（取代親子關係）
    this.version(3).stores({
      assets: 'id, name, category, purchaseDate, status, role, systemId, linkedAssetId',
      subscriptions: 'id, name, category, startDate, status, billingCycle',
      settings: 'id'
    }).upgrade(async (trans) => {
      // 遷移 v0.4.0 的 parentId/isComposite 到 v0.5.0 的 role/systemId
      await trans.table('assets').toCollection().modify((asset: any) => {
        // 判斷角色
        if (asset.isComposite === true) {
          // 組合資產 → System
          asset.role = 'System';
          asset.systemId = null;
        } else if (asset.parentId !== null && asset.parentId !== undefined) {
          // 有父資產 → Component
          asset.role = 'Component';
          asset.systemId = asset.parentId;
        } else {
          // 其他 → Standalone
          asset.role = 'Standalone';
          asset.systemId = null;
        }
        
        // 初始化新欄位
        asset.linkedAssetId = null;
        
        // 保留舊欄位作為相容性（標記為 optional）
        // 不刪除 parentId 和 isComposite，以防需要回滾
      });
    });
    
    // Version 4: v0.6.0 PocketBase 同步支援
    this.version(4).stores({
      assets: 'id, name, category, purchaseDate, status, role, systemId, linkedAssetId, remoteId, synced, lastSyncedAt',
      subscriptions: 'id, name, category, startDate, status, billingCycle, remoteId, synced, lastSyncedAt',
      settings: 'id'
    }).upgrade(async (trans) => {
      // 為所有現有資料新增同步欄位
      await trans.table('assets').toCollection().modify((asset: any) => {
        asset.remoteId = asset.remoteId ?? null; // PocketBase record ID
        asset.synced = asset.synced ?? false; // 是否已同步到遠端
        asset.lastSyncedAt = asset.lastSyncedAt ?? null; // 最後同步時間
      });
      
      await trans.table('subscriptions').toCollection().modify((sub: any) => {
        sub.remoteId = sub.remoteId ?? null;
        sub.synced = sub.synced ?? false;
        sub.lastSyncedAt = sub.lastSyncedAt ?? null;
      });
    });
  }
}

// 建立全域資料庫實例
export const db = new CPDDatabase();

// === 全域設定相關 ===

export async function getSettings(): Promise<GlobalSettings> {
  const settings = await db.settings.get('global');
  return settings || {
    electricityRate: 4.0,
    locale: 'zh-TW',
    defaultCurrency: 'TWD'
  };
}

export async function updateSettings(changes: Partial<GlobalSettings>): Promise<void> {
  await db.settings.update('global', changes);
}

// === 資產相關 ===

// 工具函數：新增資產
export async function addAsset(asset: Omit<PhysicalAsset, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  const newAsset: PhysicalAsset = {
    ...asset,
    id,
    // v0.5.0 確保新欄位有預設值
    role: asset.role ?? 'Standalone',
    systemId: asset.systemId ?? null,
    linkedAssetId: asset.linkedAssetId ?? null,
    powerWatts: asset.powerWatts ?? 0,
    dailyUsageHours: asset.dailyUsageHours ?? 0,
    recurringMaintenanceCost: asset.recurringMaintenanceCost ?? 0,
    // v0.6.0 同步標記
    synced: false,
    lastSyncedAt: null,
  };
  await db.assets.add(newAsset);
  return id;
}

// 工具函數：更新資產
export async function updateAsset(id: string, changes: Partial<PhysicalAsset>): Promise<void> {
  // 標記為未同步（除非是同步服務自己在更新）
  if (!changes.synced) {
    changes.synced = false;
  }
  await db.assets.update(id, changes);
}

// 工具函數：刪除資產（遞迴刪除子組件）
export async function deleteAsset(id: string): Promise<void> {
  // v0.5.0: 刪除所有屬於此 System 的 Components
  const components = await db.assets.where('systemId').equals(id).toArray();
  for (const component of components) {
    await deleteAsset(component.id); // 遞迴刪除
  }
  
  // 解除所有連結到此資產的 Accessories
  const linkedAccessories = await db.assets.where('linkedAssetId').equals(id).toArray();
  for (const accessory of linkedAccessories) {
    await updateAsset(accessory.id, { linkedAssetId: null });
  }
  
  // 刪除本身
  await db.assets.delete(id);
}

// 工具函數：取得所有啟用的資產
export async function getActiveAssets(): Promise<PhysicalAsset[]> {
  return await db.assets.where('status').equals('Active').toArray();
}

// v0.5.0 新增：取得系統的所有組件
export async function getSystemComponents(systemId: string): Promise<PhysicalAsset[]> {
  return await db.assets.where('systemId').equals(systemId).toArray();
}

// v0.5.0 新增：取得資產的所有連結配件
export async function getLinkedAccessories(assetId: string): Promise<PhysicalAsset[]> {
  return await db.assets.where('linkedAssetId').equals(assetId).toArray();
}

// v0.5.0 新增：取得所有獨立資產（不包含 Components）
export async function getStandaloneAssets(): Promise<PhysicalAsset[]> {
  return await db.assets.filter(asset => 
    asset.role === 'Standalone' || asset.role === 'System' || asset.role === 'Accessory'
  ).toArray();
}

// v0.5.0 更新：計算系統的總成本（所有組件價格總和）
export async function calculateSystemPrice(systemId: string): Promise<number> {
  const components = await getSystemComponents(systemId);
  return components.reduce((sum, comp) => sum + comp.price, 0);
}

// v0.5.0 更新：計算資產的總成本
export async function calculateAssetTotalCost(assetId: string): Promise<number> {
  const asset = await db.assets.get(assetId);
  if (!asset) return 0;
  
  let total = 0;
  
  // 如果是 System，價格 = 所有 Components 價格總和
  if (asset.role === 'System') {
    total = await calculateSystemPrice(assetId);
  } else {
    total = asset.price;
  }
  
  // 加上維護成本
  total += asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
  
  return total;
}

// === 訂閱相關 ===

// 工具函數：新增訂閱
export async function addSubscription(subscription: Omit<Subscription, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.subscriptions.add({ 
    ...subscription, 
    id,
    // v0.6.0 同步標記
    synced: false,
    lastSyncedAt: null,
  });
  return id;
}

// 工具函數：更新訂閱
export async function updateSubscription(id: string, changes: Partial<Subscription>): Promise<void> {
  // 標記為未同步（除非是同步服務自己在更新）
  if (!changes.synced) {
    changes.synced = false;
  }
  await db.subscriptions.update(id, changes);
}

// 工具函數：刪除訂閱
export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

// 工具函數：取得所有啟用的訂閱
export async function getActiveSubscriptions(): Promise<Subscription[]> {
  return await db.subscriptions.where('status').equals('Active').toArray();
}

// === 資料匯出/匯入 ===

// 工具函數：匯出所有資料為 JSON
export async function exportData(): Promise<string> {
  const assets = await db.assets.toArray();
  const subscriptions = await db.subscriptions.toArray();
  const settings = await db.settings.get('global');
  
    return JSON.stringify({
    version: 3, // v0.5.0
    exportDate: new Date().toISOString(),
    assets,
    subscriptions,
    settings
  }, null, 2);
}

// 工具函數：從 JSON 匯入資料
export async function importData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    
    // 清空現有資料
    await db.assets.clear();
    await db.subscriptions.clear();
    
    // 匯入新資料
    if (data.assets && Array.isArray(data.assets)) {
      // 確保舊版本資料也能匯入（自動遷移）
      const assetsWithDefaults = data.assets.map((asset: any) => ({
        ...asset,
        // v0.5.0 欄位
        role: asset.role ?? (asset.isComposite ? 'System' : asset.parentId ? 'Component' : 'Standalone'),
        systemId: asset.systemId ?? asset.parentId ?? null,
        linkedAssetId: asset.linkedAssetId ?? null,
        // v0.4.0 欄位
        powerWatts: asset.powerWatts ?? 0,
        dailyUsageHours: asset.dailyUsageHours ?? 0,
        recurringMaintenanceCost: asset.recurringMaintenanceCost ?? 0,
      }));
      await db.assets.bulkAdd(assetsWithDefaults);
    }
    
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      await db.subscriptions.bulkAdd(data.subscriptions);
    }
    
    // 匯入設定（如果有）
    if (data.settings) {
      await db.settings.put({ ...data.settings, id: 'global' });
    }
  } catch (error) {
    console.error('匯入資料失敗:', error);
    throw new Error('資料格式不正確或匯入失敗');
  }
}
