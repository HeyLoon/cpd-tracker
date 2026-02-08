import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { PhysicalAsset, Subscription } from '../types';

/**
 * Hook 用於讀取所有啟用的資產
 */
export function useAssets() {
  return useLiveQuery(
    () => db.assets.where('status').equals('Active').toArray(),
    []
  ) as PhysicalAsset[] | undefined;
}

/**
 * Hook 用於讀取所有資產（包含非啟用）
 */
export function useAllAssets() {
  return useLiveQuery(
    () => db.assets.toArray(),
    []
  ) as PhysicalAsset[] | undefined;
}

/**
 * Hook 用於讀取單一資產
 */
export function useAsset(id: string | undefined) {
  return useLiveQuery(
    () => id ? db.assets.get(id) : undefined,
    [id]
  ) as PhysicalAsset | undefined;
}

/**
 * Hook 用於讀取所有啟用的訂閱
 */
export function useSubscriptions() {
  return useLiveQuery(
    () => db.subscriptions.where('status').equals('Active').toArray(),
    []
  ) as Subscription[] | undefined;
}

/**
 * Hook 用於讀取所有訂閱（包含非啟用）
 */
export function useAllSubscriptions() {
  return useLiveQuery(
    () => db.subscriptions.toArray(),
    []
  ) as Subscription[] | undefined;
}

/**
 * Hook 用於讀取單一訂閱
 */
export function useSubscription(id: string | undefined) {
  return useLiveQuery(
    () => id ? db.subscriptions.get(id) : undefined,
    [id]
  ) as Subscription | undefined;
}
