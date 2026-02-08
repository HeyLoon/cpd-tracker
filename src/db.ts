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
    // 確保新欄位有預設值
    parentId: asset.parentId ?? null,
    isComposite: asset.isComposite ?? false,
    powerWatts: asset.powerWatts ?? 0,
    dailyUsageHours: asset.dailyUsageHours ?? 0,
    recurringMaintenanceCost: asset.recurringMaintenanceCost ?? 0,
  };
  await db.assets.add(newAsset);
  return id;
}

// 工具函數：更新資產
export async function updateAsset(id: string, changes: Partial<PhysicalAsset>): Promise<void> {
  await db.assets.update(id, changes);
}

// 工具函數：刪除資產（遞迴刪除子組件）
export async function deleteAsset(id: string): Promise<void> {
  // 先刪除所有子組件
  const children = await db.assets.where('parentId').equals(id).toArray();
  for (const child of children) {
    await deleteAsset(child.id); // 遞迴刪除
  }
  // 再刪除本身
  await db.assets.delete(id);
}

// 工具函數：取得所有啟用的資產
export async function getActiveAssets(): Promise<PhysicalAsset[]> {
  return await db.assets.where('status').equals('Active').toArray();
}

// v0.4.0 新增：取得子組件
export async function getChildAssets(parentId: string): Promise<PhysicalAsset[]> {
  return await db.assets.where('parentId').equals(parentId).toArray();
}

// v0.4.0 新增：取得所有頂層資產（沒有父資產）
export async function getTopLevelAssets(): Promise<PhysicalAsset[]> {
  return await db.assets.filter(asset => asset.parentId === null).toArray();
}

// v0.4.0 新增：計算資產的總成本（包含所有子組件）
export async function calculateAssetTotalCost(assetId: string): Promise<number> {
  const asset = await db.assets.get(assetId);
  if (!asset) return 0;
  
  let total = asset.price;
  
  // 加上維護成本
  total += asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
  
  // 如果是組合資產，加上所有子組件的成本
  if (asset.isComposite) {
    const children = await getChildAssets(assetId);
    for (const child of children) {
      total += await calculateAssetTotalCost(child.id); // 遞迴
    }
  }
  
  return total;
}

// === 訂閱相關 ===

// 工具函數：新增訂閱
export async function addSubscription(subscription: Omit<Subscription, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.subscriptions.add({ ...subscription, id });
  return id;
}

// 工具函數：更新訂閱
export async function updateSubscription(id: string, changes: Partial<Subscription>): Promise<void> {
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
    version: 2, // v0.4.0
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
      // 確保舊版本資料也能匯入
      const assetsWithDefaults = data.assets.map((asset: any) => ({
        ...asset,
        parentId: asset.parentId ?? null,
        isComposite: asset.isComposite ?? false,
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
