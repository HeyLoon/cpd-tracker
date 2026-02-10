/**
 * Supabase 客戶端實例
 * 
 * 用於連接 Supabase 後端
 * 支援認證、資料同步、即時訂閱
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// Supabase 配置
const STORAGE_KEY_URL = 'cpd_supabase_url';
const STORAGE_KEY_ANON = 'cpd_supabase_anon_key';

/**
 * 取得 Supabase URL
 */
function getSupabaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY_URL) || '';
}

/**
 * 取得 Supabase Anon Key
 */
function getSupabaseAnonKey(): string {
  return localStorage.getItem(STORAGE_KEY_ANON) || '';
}

/**
 * 檢查是否已設定 Supabase
 */
export function hasSupabaseConfig(): boolean {
  return !!getSupabaseUrl() && !!getSupabaseAnonKey();
}

/**
 * 設定 Supabase 配置
 */
export function setSupabaseConfig(url: string, anonKey: string): void {
  const trimmedUrl = url.trim().replace(/\/$/, '');
  const trimmedKey = anonKey.trim();
  
  if (trimmedUrl && trimmedKey) {
    localStorage.setItem(STORAGE_KEY_URL, trimmedUrl);
    localStorage.setItem(STORAGE_KEY_ANON, trimmedKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  
  // 重新載入頁面以套用新配置
  window.location.reload();
}

/**
 * 取得目前的 Supabase 配置
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
  };
}

// 建立 Supabase 客戶端實例
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) {
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  
  return supabase;
}

export const supabaseClient = {
  get client() {
    return getSupabaseClient();
  }
};

/**
 * 類型定義：Supabase Tables
 */

// 資產資料
export interface SupabaseAsset {
  id: string;
  name: string;
  category: 'Tech' | 'Music' | 'Life' | 'Others';
  price: number;
  currency: 'TWD' | 'USD' | 'JPY';
  purchase_date: string; // ISO 8601
  target_lifespan: number | null;
  status: 'Active' | 'Sold' | 'Retired';
  role: 'Standalone' | 'System' | 'Component' | 'Accessory';
  system_id: string | null;
  linked_asset_id: string | null;
  photo_url: string | null;
  notes: string | null;
  sold_price: number | null;
  power_watts: number;
  daily_usage_hours: number;
  recurring_maintenance_cost: number;
  maintenance_log: Array<{
    date: string;
    note: string;
    cost: number;
  }>;
  user_id: string;
  synced: boolean;
  local_id: string | null;
  created_at: string;
  updated_at: string;
}

// 訂閱資料
export interface SupabaseSubscription {
  id: string;
  name: string;
  cost: number;
  currency: 'TWD' | 'USD' | 'JPY';
  billing_cycle: 'Monthly' | 'Quarterly' | 'Yearly';
  start_date: string; // ISO 8601
  category: 'Software' | 'Service' | 'Entertainment';
  status: 'Active' | 'Cancelled';
  cancelled_date: string | null;
  notes: string | null;
  user_id: string;
  synced: boolean;
  local_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 認證輔助函數
 */

// 註冊新使用者
export async function register(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, error: new Error('Supabase 尚未設定') };
  }
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  
  return { user: data.user, error };
}

// 登入
export async function login(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, error: new Error('Supabase 尚未設定') };
  }
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  return { user: data.user, error };
}

// 登出
export async function logout(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
}

// 檢查是否已登入（同步版本 - 不推薦使用）
// 注意：Supabase 的 session 檢查是非同步的，這個函數可能返回過時的狀態
export function isAuthenticated(): boolean {
  // 因為 Supabase 的 getSession 是異步的，這裡無法準確判斷
  // 建議使用 isAuthenticatedAsync() 或 useAuth() hook
  return hasSupabaseConfig();
}

// 檢查是否已登入（非同步版本，推薦）
export async function isAuthenticatedAsync(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  
  const { data } = await client.auth.getSession();
  return !!(data.session);
}

// 取得當前使用者
export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data: { user } } = await client.auth.getUser();
  return user;
}

// 監聽認證狀態變更
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * 連線狀態檢查
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  
  try {
    // 嘗試查詢 assets 表（不需要認證的操作）
    const { error } = await client.from('assets').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return false;
  }
}

/**
 * 資料操作輔助函數
 */

// 取得所有資產
export async function fetchAssets(): Promise<SupabaseAsset[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  
  const user = await getCurrentUser();
  if (!user) return [];
  
  const { data, error } = await client
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch assets:', error);
    return [];
  }
  
  return data || [];
}

// 創建資產
export async function createAsset(asset: Omit<SupabaseAsset, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseAsset | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data, error } = await client
    .from('assets')
    .insert(asset)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create asset:', error);
    throw error;
  }
  
  return data;
}

// 更新資產
export async function updateAsset(id: string, updates: Partial<SupabaseAsset>): Promise<SupabaseAsset | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data, error } = await client
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to update asset:', error);
    throw error;
  }
  
  return data;
}

// 刪除資產
export async function deleteAsset(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  
  const { error } = await client
    .from('assets')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Failed to delete asset:', error);
    return false;
  }
  
  return true;
}

// 取得所有訂閱
export async function fetchSubscriptions(): Promise<SupabaseSubscription[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  
  const user = await getCurrentUser();
  if (!user) return [];
  
  const { data, error } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    return [];
  }
  
  return data || [];
}

// 創建訂閱
export async function createSubscription(subscription: Omit<SupabaseSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseSubscription | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data, error } = await client
    .from('subscriptions')
    .insert(subscription)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
  
  return data;
}

// 更新訂閱
export async function updateSubscription(id: string, updates: Partial<SupabaseSubscription>): Promise<SupabaseSubscription | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data, error } = await client
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
  
  return data;
}

// 刪除訂閱
export async function deleteSubscription(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  
  const { error } = await client
    .from('subscriptions')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Failed to delete subscription:', error);
    return false;
  }
  
  return true;
}

/**
 * 匯出主要客戶端
 */
export default supabaseClient;
