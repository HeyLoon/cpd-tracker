import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import type { PhysicalAsset, Subscription } from '../types';

export interface CostCalculations {
  // 總每日燃燒率
  totalDailyBurn: number;
  
  // 資產每日成本
  assetsDailyCost: number;
  
  // 訂閱每日成本
  subscriptionsDailyCost: number;
  
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
  dailyCost: number;
  totalCost: number;
  progressPercentage: number;
  remainingDays: number;
}

export interface SubscriptionCalculation {
  subscription: Subscription;
  daysActive: number;
  dailyCost: number;
  totalSpent: number;
  monthsActive: number;
}

/**
 * 核心計算 Hook - 計算所有成本相關數據
 */
export function useCostCalculations(
  assets: PhysicalAsset[],
  subscriptions: Subscription[]
): CostCalculations {
  return useMemo(() => {
    const now = new Date();
    
    // 計算資產每日成本
    const assetsDailyCost = assets
      .filter(asset => asset.status === 'Active')
      .reduce((total, asset) => {
        const daysOwned = Math.max(1, differenceInDays(now, asset.purchaseDate));
        const maintenanceCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
        const totalCost = asset.price + maintenanceCost;
        const dailyCost = totalCost / daysOwned;
        return total + dailyCost;
      }, 0);
    
    // 計算訂閱每日成本
    const subscriptionsDailyCost = subscriptions
      .filter(sub => sub.status === 'Active')
      .reduce((total, sub) => {
        const dailyCost = sub.billingCycle === 'Monthly' 
          ? sub.cost / 30 
          : sub.cost / 365;
        return total + dailyCost;
      }, 0);
    
    // 總每日燃燒率
    const totalDailyBurn = assetsDailyCost + subscriptionsDailyCost;
    
    // 每月和每年總支出
    const totalMonthlyCost = totalDailyBurn * 30;
    const totalYearlyCost = totalDailyBurn * 365;
    
    // 計算各分類的每日成本
    const categoryMap = new Map<string, number>();
    
    // 資產分類成本
    assets
      .filter(asset => asset.status === 'Active')
      .forEach(asset => {
        const daysOwned = Math.max(1, differenceInDays(now, asset.purchaseDate));
        const maintenanceCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
        const totalCost = asset.price + maintenanceCost;
        const dailyCost = totalCost / daysOwned;
        
        const current = categoryMap.get(asset.category) || 0;
        categoryMap.set(asset.category, current + dailyCost);
      });
    
    // 訂閱分類成本
    subscriptions
      .filter(sub => sub.status === 'Active')
      .forEach(sub => {
        const dailyCost = sub.billingCycle === 'Monthly' 
          ? sub.cost / 30 
          : sub.cost / 365;
        
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
      totalMonthlyCost,
      totalYearlyCost,
      costByCategory
    };
  }, [assets, subscriptions]);
}

/**
 * 計算單一資產的詳細資訊
 */
export function calculateAssetDetails(asset: PhysicalAsset): AssetCalculation {
  const now = new Date();
  const daysOwned = Math.max(1, differenceInDays(now, asset.purchaseDate));
  const maintenanceCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
  const totalCost = asset.price + maintenanceCost;
  const dailyCost = totalCost / daysOwned;
  
  const progressPercentage = Math.min(100, (daysOwned / asset.targetLifespan) * 100);
  const remainingDays = Math.max(0, asset.targetLifespan - daysOwned);
  
  return {
    asset,
    daysOwned,
    dailyCost,
    totalCost,
    progressPercentage,
    remainingDays
  };
}

/**
 * 計算單一訂閱的詳細資訊
 */
export function calculateSubscriptionDetails(subscription: Subscription): SubscriptionCalculation {
  const now = new Date();
  const endDate = subscription.status === 'Cancelled' && subscription.cancelledDate
    ? subscription.cancelledDate
    : now;
  
  const daysActive = Math.max(1, differenceInDays(endDate, subscription.startDate));
  const monthsActive = daysActive / 30;
  
  const dailyCost = subscription.billingCycle === 'Monthly'
    ? subscription.cost / 30
    : subscription.cost / 365;
  
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
 * 格式化貨幣顯示
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
