/**
 * PocketBase 客戶端實例
 * 
 * 用於連接自架的 PocketBase 後端
 * 支援認證、資料同步、檔案上傳
 */

import PocketBase from 'pocketbase';
import type { RecordAuthResponse, RecordModel } from 'pocketbase';

// PocketBase URL 配置
// 從 localStorage 讀取使用者自訂的 URL
const STORAGE_KEY = 'cpd_pocketbase_url';

function getPocketBaseUrl(): string {
  // 優先使用使用者設定的 URL
  const customUrl = localStorage.getItem(STORAGE_KEY);
  if (customUrl) return customUrl;
  
  // 預設值（用於測試，實際使用時由使用者設定）
  return '';
}

// 建立 PocketBase 客戶端實例
export const pb = new PocketBase(getPocketBaseUrl());

// 啟用自動更新 Token
pb.autoCancellation(false); // 防止在快速請求時取消

// 從 localStorage 恢復認證狀態
pb.authStore.loadFromCookie(document.cookie);

/**
 * 設定 PocketBase URL（由使用者在設定頁面輸入）
 */
export function setPocketBaseUrl(url: string): void {
  const trimmedUrl = url.trim();
  
  if (trimmedUrl) {
    // 移除尾部的斜線
    const cleanUrl = trimmedUrl.replace(/\/$/, '');
    localStorage.setItem(STORAGE_KEY, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  
  // 重新載入頁面以套用新的 URL
  window.location.reload();
}

/**
 * 取得目前的 PocketBase URL
 */
export function getPocketBaseUrlSetting(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

/**
 * 檢查是否已設定 PocketBase URL
 */
export function hasPocketBaseUrl(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

/**
 * 類型定義：PocketBase Collections
 */

// 使用者資料
export interface PBUser extends RecordModel {
  email: string;
  verified: boolean;
  avatar?: string;
}

// 資產資料（對應 Dexie PhysicalAsset）
export interface PBAsset extends RecordModel {
  name: string;
  category: 'Tech' | 'Music' | 'Life' | 'Others';
  price: number;
  currency: 'TWD' | 'USD' | 'JPY';
  purchase_date: string; // ISO 8601 格式
  target_lifespan: number;
  status: 'Active' | 'Sold' | 'Retired';
  role: 'Standalone' | 'System' | 'Component' | 'Accessory';
  system_id?: string; // Relation ID
  linked_asset_id?: string; // Relation ID
  photo?: string; // 檔案名稱
  notes?: string;
  sold_price?: number;
  power_watts: number;
  daily_usage_hours: number;
  recurring_maintenance_cost: number;
  maintenance_log: Array<{
    date: string;
    note: string;
    cost: number;
  }>;
  user: string; // Relation ID (必填)
  synced: boolean;
  local_id?: string; // Dexie 本地 UUID
}

// 訂閱資料（對應 Dexie Subscription）
export interface PBSubscription extends RecordModel {
  name: string;
  cost: number;
  currency: 'TWD' | 'USD' | 'JPY';
  billing_cycle: 'Monthly' | 'Quarterly' | 'Yearly';
  start_date: string; // ISO 8601 格式
  category: 'Software' | 'Service' | 'Entertainment';
  status: 'Active' | 'Cancelled';
  cancelled_date?: string;
  notes?: string;
  user: string; // Relation ID (必填)
  synced: boolean;
  local_id?: string;
}

// 使用者設定
export interface PBSettings extends RecordModel {
  electricity_rate: number;
  default_currency: 'TWD' | 'USD' | 'JPY';
  locale: string;
  user: string; // Relation ID (必填, Unique)
}

/**
 * Collection 名稱常數
 */
export const COLLECTIONS = {
  USERS: 'users',
  ASSETS: 'assets',
  SUBSCRIPTIONS: 'subscriptions',
  SETTINGS: 'settings',
} as const;

/**
 * 認證輔助函數
 */

// 註冊新使用者
export async function register(email: string, password: string): Promise<RecordAuthResponse<PBUser>> {
  return await pb.collection(COLLECTIONS.USERS).create<PBUser>({
    email,
    password,
    passwordConfirm: password,
  }) as unknown as RecordAuthResponse<PBUser>;
}

// 登入
export async function login(email: string, password: string): Promise<RecordAuthResponse<PBUser>> {
  return await pb.collection(COLLECTIONS.USERS).authWithPassword<PBUser>(email, password);
}

// 登出
export function logout(): void {
  pb.authStore.clear();
}

// 檢查是否已登入
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

// 取得當前使用者
export function getCurrentUser(): PBUser | null {
  return pb.authStore.model as PBUser | null;
}

// 刷新認證 Token
export async function refreshAuth(): Promise<RecordAuthResponse<PBUser> | null> {
  if (!pb.authStore.isValid) return null;
  
  try {
    return await pb.collection(COLLECTIONS.USERS).authRefresh<PBUser>();
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout();
    return null;
  }
}

/**
 * 監聽認證狀態變更
 */
export function onAuthChange(callback: (token: string, model: RecordModel | null) => void): () => void {
  return pb.authStore.onChange((token, model) => {
    callback(token, model);
    
    // 保存到 cookie (7天有效期)
    if (token) {
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    }
  });
}

/**
 * 檔案上傳輔助函數
 */

// 上傳資產照片
export async function uploadAssetPhoto(assetId: string, file: File): Promise<PBAsset> {
  const formData = new FormData();
  formData.append('photo', file);
  
  return await pb.collection(COLLECTIONS.ASSETS).update<PBAsset>(assetId, formData);
}

// 取得照片 URL
export function getPhotoUrl(asset: PBAsset, thumbnail: '100x100' | '500x500' | '0x0' = '500x500'): string | null {
  if (!asset.photo) return null;
  
  return pb.files.getUrl(asset, asset.photo, { thumb: thumbnail });
}

/**
 * 連線狀態檢查
 */

// 檢查 PocketBase 是否在線
export async function checkPocketBaseHealth(): Promise<boolean> {
  const url = getPocketBaseUrl();
  if (!url) return false;
  
  try {
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 秒超時
    });
    return response.ok;
  } catch (error) {
    console.error('PocketBase health check failed:', error);
    return false;
  }
}

/**
 * Real-time Subscriptions (即時更新)
 * 
 * 當其他裝置修改資料時，自動同步到本地
 */

// 訂閱資產變更
export function subscribeToAssets(callback: (data: { action: string; record: PBAsset }) => void): () => void {
  pb.collection(COLLECTIONS.ASSETS).subscribe<PBAsset>('*', (data) => {
    callback(data);
  });
  
  return () => {
    pb.collection(COLLECTIONS.ASSETS).unsubscribe('*');
  };
}

// 訂閱訂閱服務變更
export function subscribeToSubscriptions(callback: (data: { action: string; record: PBSubscription }) => void): () => void {
  pb.collection(COLLECTIONS.SUBSCRIPTIONS).subscribe<PBSubscription>('*', (data) => {
    callback(data);
  });
  
  return () => {
    pb.collection(COLLECTIONS.SUBSCRIPTIONS).unsubscribe('*');
  };
}

/**
 * 批次操作輔助函數
 */

// 批次取得資產（分頁）
export async function fetchAssetsBatch(page = 1, perPage = 50): Promise<{
  items: PBAsset[];
  totalItems: number;
  totalPages: number;
}> {
  const user = getCurrentUser();
  if (!user) throw new Error('未登入');
  
  const result = await pb.collection(COLLECTIONS.ASSETS).getList<PBAsset>(page, perPage, {
    filter: `user = "${user.id}"`,
    sort: '-updated',
  });
  
  return {
    items: result.items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}

// 批次取得訂閱服務（分頁）
export async function fetchSubscriptionsBatch(page = 1, perPage = 50): Promise<{
  items: PBSubscription[];
  totalItems: number;
  totalPages: number;
}> {
  const user = getCurrentUser();
  if (!user) throw new Error('未登入');
  
  const result = await pb.collection(COLLECTIONS.SUBSCRIPTIONS).getList<PBSubscription>(page, perPage, {
    filter: `user = "${user.id}"`,
    sort: '-updated',
  });
  
  return {
    items: result.items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}

/**
 * 錯誤處理輔助函數
 */

// 解析 PocketBase 錯誤訊息
export function parsePocketBaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const pbError = error as { message?: string; data?: Record<string, unknown> };
    
    if (pbError.message) {
      return pbError.message;
    }
    
    if (pbError.data) {
      const firstError = Object.values(pbError.data)[0];
      if (firstError && typeof firstError === 'object' && 'message' in firstError) {
        return String((firstError as { message: string }).message);
      }
    }
  }
  
  return '未知錯誤';
}

// 匯出預設實例
export default pb;
