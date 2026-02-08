import { useMemo, useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import type { PhysicalAsset, Subscription, InvisibleCosts } from '../types';
import { 
  calculateSubscriptionDailyCost,
  calculateAssetElectricityCostRecursive
} from '../utils/costCalculations';
import { getSettings } from '../db';

export interface CostCalculations {
  // 總每日燃燒率（包含隱形成本）
  totalDailyBurn: number;
  
  // 資產每日成本（折舊）
  assetsDailyCost: number;
  
  // 訂閱每日成本
  subscriptionsDailyCost: number;
  
  // v0.4.0 新增：隱形成本
  invisibleCosts: InvisibleCosts;
  
  // 每月總支出
  totalMonthlyCost: number;
  
  // 每年總支出
  totalYearlyCost: number;
  
  // 各分類的每日成本
  costByCategory: {
    category: string;
    dailyCost: number;
    color: string;
  }[];
}

export interface AssetCalculation {
  asset: PhysicalAsset;
  daysOwned: number;
  dailyCost: number; // 折舊成本
  dailyElectricityCost: number; // v0.4.0 新增：電費
  totalCost: number; // 含子組件的總成本
  progressPercentage: number;
  remainingDays: number;
  children: PhysicalAsset[]; // v0.4.0 新增：子組件列表
}

export interface SubscriptionCalculation {
  subscription: Subscription;
  daysActive: number;
  dailyCost: number;
  totalSpent: number;
  monthsActive: number;
}

/**
 * v0.5.0 升級：核心計算 Hook - 支援角色系統、電費、隱形成本
 */
export function useCostCalculations(
  assets: PhysicalAsset[],
  subscriptions: Subscription[]
): CostCalculations {
  const [electricityRate, setElectricityRate] = useState(4.0);
  
  // 載入電費設定
  useEffect(() => {
    getSettings().then(settings => {
      setElectricityRate(settings.electricityRate);
    });
  }, []);
  
  return useMemo(() => {
    const now = new Date();
    const activeAssets = assets.filter(asset => asset.status === 'Active');
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'Active');
    
    // === 1. 計算資產折舊成本（只計算非 Component 資產，避免重複） ===
    const visibleAssets = activeAssets.filter(a => a.role !== 'Component');
    const assetsDailyCost = visibleAssets.reduce((total, asset) => {
      return total + calculateAssetDepreciationRecursive(asset, activeAssets, now);
    }, 0);
    
    // === 2. 計算訂閱每日成本（支援季度） ===
    const subscriptionsDailyCost = activeSubscriptions.reduce((total, sub) => {
      return total + calculateSubscriptionDailyCost(sub);
    }, 0);
    
    // === 3. 計算隱形成本（同步版本，用於立即顯示） ===
    const invisibleCosts = calculateInvisibleCostsSync(
      activeAssets,
      activeSubscriptions,
      electricityRate
    );
    
    // === 4. 總每日燃燒率 = 折舊 + 隱形成本 ===
    const totalDailyBurn = assetsDailyCost + invisibleCosts.totalDaily;
    
    // === 5. 月度/年度支出 ===
    const totalMonthlyCost = totalDailyBurn * 30;
    const totalYearlyCost = totalDailyBurn * 365;
    
    // === 6. 計算各分類的每日成本 ===
    const categoryMap = new Map<string, number>();
    
    // 資產分類成本（只計算可見資產）
    visibleAssets.forEach(asset => {
      const dailyCost = calculateAssetDepreciationRecursive(asset, activeAssets, now);
      const current = categoryMap.get(asset.category) || 0;
      categoryMap.set(asset.category, current + dailyCost);
    });
    
    // 訂閱分類成本
    activeSubscriptions.forEach(sub => {
      const dailyCost = calculateSubscriptionDailyCost(sub);
      const current = categoryMap.get(sub.category) || 0;
      categoryMap.set(sub.category, current + dailyCost);
    });
    
    // 定義分類顏色
    const categoryColors: { [key: string]: string } = {
      'Tech': '#3b82f6',      // blue
      'Music': '#8b5cf6',     // purple
      'Life': '#10b981',      // green
      'Others': '#6b7280',    // gray
      'Software': '#ec4899',  // pink
      'Service': '#f59e0b',   // amber
      'Entertainment': '#ef4444' // red
    };
    
    const costByCategory = Array.from(categoryMap.entries())
      .map(([category, dailyCost]) => ({
        category,
        dailyCost,
        color: categoryColors[category] || '#6b7280'
      }))
      .sort((a, b) => b.dailyCost - a.dailyCost);
    
    return {
      totalDailyBurn,
      assetsDailyCost,
      subscriptionsDailyCost,
      invisibleCosts,
      totalMonthlyCost,
      totalYearlyCost,
      costByCategory
    };
  }, [assets, subscriptions, electricityRate]);
}

/**
 * v0.5.0 新增：遞迴計算資產及組件的折舊成本
 * - System: 價格 = 所有 Components 價格總和
 * - Component: 獨立計算（但不在主列表顯示）
 * - Standalone/Accessory: 正常計算
 */
function calculateAssetDepreciationRecursive(
  asset: PhysicalAsset,
  allAssets: PhysicalAsset[],
  now: Date
): number {
  const daysOwned = Math.max(1, differenceInDays(now, asset.purchaseDate));
  const maintenanceCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
  
  let totalCost = maintenanceCost; // 先加維護成本
  
  // 如果是 System，價格 = 所有 Components 的價格總和
  if (asset.role === 'System') {
    const components = allAssets.filter(a => a.systemId === asset.id);
    totalCost += components.reduce((sum, comp) => sum + comp.price, 0);
  } else {
    // 其他角色使用自己的價格
    totalCost += asset.price;
  }
  
  return totalCost / daysOwned;
}

/**
 * v0.5.0 更新：同步版本的隱形成本計算
 */
function calculateInvisibleCostsSync(
  assets: PhysicalAsset[],
  subscriptions: Subscription[],
  electricityRate: number
): InvisibleCosts {
  // 1. 電費總計（月）- 只計算非 Component 資產
  let totalElectricityDaily = 0;
  const visibleAssets = assets.filter(a => a.role !== 'Component');
  for (const asset of visibleAssets) {
    totalElectricityDaily += calculateAssetElectricityCostRecursive(
      asset,
      assets,
      electricityRate
    );
  }
  const totalElectricityCost = totalElectricityDaily * 30;
  
  // 2. 訂閱總計（月）
  const totalSubscriptionsCost = subscriptions.reduce((sum, sub) => {
    return sum + (calculateSubscriptionDailyCost(sub) * 30);
  }, 0);
  
  // 3. 經常性維護（月）
  const totalRecurringMaintenance = assets.reduce((sum, asset) => {
    return sum + (asset.recurringMaintenanceCost / 12);
  }, 0);
  
  // 4. 總計
  const totalMonthly = totalElectricityCost + totalSubscriptionsCost + totalRecurringMaintenance;
  const totalDaily = totalMonthly / 30;
  
  return {
    totalElectricityCost,
    totalSubscriptionsCost,
    totalRecurringMaintenance,
    totalMonthly,
    totalDaily
  };
}

/**
 * v0.5.0 升級：計算單一資產的詳細資訊（含組件）
 */
export function calculateAssetDetails(
  asset: PhysicalAsset,
  allAssets: PhysicalAsset[],
  electricityRate: number
): AssetCalculation {
  const now = new Date();
  const daysOwned = Math.max(1, differenceInDays(now, asset.purchaseDate));
  const maintenanceCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
  
  // 計算總成本
  let totalCost = maintenanceCost;
  
  // 取得子項目（Components 或 linked Accessories）
  const children = allAssets.filter(a => 
    (a.role === 'Component' && a.systemId === asset.id) ||
    (a.role === 'Accessory' && a.linkedAssetId === asset.id)
  );
  
  // 如果是 System，價格 = 所有 Components 的價格總和
  if (asset.role === 'System') {
    const components = allAssets.filter(a => a.systemId === asset.id);
    totalCost += components.reduce((sum, comp) => sum + comp.price, 0);
  } else {
    totalCost += asset.price;
  }
  
  // 折舊成本
  const dailyCost = totalCost / daysOwned;
  
  // 電費（含子組件）
  const dailyElectricityCost = calculateAssetElectricityCostRecursive(
    asset,
    allAssets,
    electricityRate
  );
  
  const progressPercentage = Math.min(100, (daysOwned / asset.targetLifespan) * 100);
  const remainingDays = Math.max(0, asset.targetLifespan - daysOwned);
  
  return {
    asset,
    daysOwned,
    dailyCost,
    dailyElectricityCost,
    totalCost,
    progressPercentage,
    remainingDays,
    children
  };
}

/**
 * v0.4.0 升級：計算單一訂閱的詳細資訊（支援季度）
 */
export function calculateSubscriptionDetails(subscription: Subscription): SubscriptionCalculation {
  const now = new Date();
  const endDate = subscription.status === 'Cancelled' && subscription.cancelledDate
    ? subscription.cancelledDate
    : now;
  
  const daysActive = Math.max(1, differenceInDays(endDate, subscription.startDate));
  const monthsActive = daysActive / 30;
  
  const dailyCost = calculateSubscriptionDailyCost(subscription);
  const totalSpent = dailyCost * daysActive;
  
  return {
    subscription,
    daysActive,
    dailyCost,
    totalSpent,
    monthsActive
  };
}

/**
 * 格式化貨幣顯示（保留向後兼容）
 */
export function formatCurrency(amount: number, currency: string = 'TWD'): string {
  const currencySymbols: { [key: string]: string } = {
    'TWD': 'NT$',
    'JPY': '¥',
    'USD': '$'
  };
  
  const symbol = currencySymbols[currency] || currency;
  const rounded = Math.round(amount);
  
  return `${symbol}${rounded.toLocaleString()}`;
}
