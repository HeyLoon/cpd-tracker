import Dexie, { type Table } from 'dexie';
import type { PhysicalAsset, Subscription } from './types';

export class CPDDatabase extends Dexie {
  // 定義資料表
  assets!: Table<PhysicalAsset>;
  subscriptions!: Table<Subscription>;

  constructor() {
    super('CPDTrackerDB');
    
    this.version(1).stores({
      assets: 'id, name, category, purchaseDate, status',
      subscriptions: 'id, name, category, startDate, status'
    });
  }
}

// 建立全域資料庫實例
export const db = new CPDDatabase();

// 工具函數：新增資產
export async function addAsset(asset: Omit<PhysicalAsset, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.assets.add({ ...asset, id });
  return id;
}

// 工具函數：更新資產
export async function updateAsset(id: string, changes: Partial<PhysicalAsset>): Promise<void> {
  await db.assets.update(id, changes);
}

// 工具函數：刪除資產
export async function deleteAsset(id: string): Promise<void> {
  await db.assets.delete(id);
}

// 工具函數：取得所有啟用的資產
export async function getActiveAssets(): Promise<PhysicalAsset[]> {
  return await db.assets.where('status').equals('Active').toArray();
}

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

// 工具函數：匯出所有資料為 JSON
export async function exportData(): Promise<string> {
  const assets = await db.assets.toArray();
  const subscriptions = await db.subscriptions.toArray();
  
  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    assets,
    subscriptions
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
      await db.assets.bulkAdd(data.assets);
    }
    
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      await db.subscriptions.bulkAdd(data.subscriptions);
    }
  } catch (error) {
    console.error('匯入資料失敗:', error);
    throw new Error('資料格式不正確或匯入失敗');
  }
}
