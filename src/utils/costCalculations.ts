import type { PhysicalAsset, Subscription, InvisibleCosts } from '../types';
import { differenceInDays } from 'date-fns';

/**
 * v0.4.0 新增：電費計算工具
 */

/**
 * 計算每月電費
 * @param watts 功率（瓦特）
 * @param hoursPerDay 每日使用時數
 * @param ratePerKwh 電費單價（NT$ / kWh）
 * @returns 每月電費（NT$）
 */
export function calculateMonthlyElectricityCost(
  watts: number,
  hoursPerDay: number,
  ratePerKwh: number
): number {
  if (watts <= 0 || hoursPerDay <= 0) return 0;
  
  // (瓦特 * 時數 / 1000) * 電費單價 * 30天
  const kwh = (watts * hoursPerDay / 1000);
  const monthlyCost = kwh * ratePerKwh * 30;
  
  return monthlyCost;
}

/**
 * 計算每日電費
 * @param watts 功率（瓦特）
 * @param hoursPerDay 每日使用時數
 * @param ratePerKwh 電費單價（NT$ / kWh）
 * @returns 每日電費（NT$）
 */
export function calculateDailyElectricityCost(
  watts: number,
  hoursPerDay: number,
  ratePerKwh: number
): number {
  return calculateMonthlyElectricityCost(watts, hoursPerDay, ratePerKwh) / 30;
}

/**
 * v0.5.0 更新：遞迴計算資產及其所有組件的電費
 * @param asset 資產物件
 * @param allAssets 所有資產列表（用於查找組件）
 * @param ratePerKwh 電費單價
 * @returns 每日電費總計
 */
export function calculateAssetElectricityCostRecursive(
  asset: PhysicalAsset,
  allAssets: PhysicalAsset[],
  ratePerKwh: number
): number {
  // 本身的電費
  let totalDailyCost = calculateDailyElectricityCost(
    asset.powerWatts,
    asset.dailyUsageHours,
    ratePerKwh
  );
  
  // 如果是 System，加上所有 Components 的電費
  if (asset.role === 'System') {
    const components = allAssets.filter(a => a.systemId === asset.id);
    for (const component of components) {
      totalDailyCost += calculateAssetElectricityCostRecursive(component, allAssets, ratePerKwh);
    }
  }
  
  return totalDailyCost;
}

/**
 * v0.4.0 新增：訂閱每日成本計算（支援季度）
 */
export function calculateSubscriptionDailyCost(subscription: Subscription): number {
  switch (subscription.billingCycle) {
    case 'Monthly':
      return subscription.cost / 30;
    case 'Quarterly':
      return subscription.cost / 90; // 每季 = 90 天
    case 'Yearly':
      return subscription.cost / 365;
    default:
      return 0;
  }
}

/**
 * v0.5.0 更新：計算隱形成本總覽
 * @param assets 所有資產
 * @param subscriptions 所有訂閱
 * @param electricityRate 電費單價
 * @returns 隱形成本分析
 */
export async function calculateInvisibleCosts(
  assets: PhysicalAsset[],
  subscriptions: Subscription[],
  electricityRate: number
): Promise<InvisibleCosts> {
  // 1. 電費總計（月）
  let totalElectricityDaily = 0;
  const activeAssets = assets.filter(a => a.status === 'Active');
  
  // 只計算非 Component 資產（Components 會在 System 遞迴中處理）
  const visibleAssets = activeAssets.filter(a => a.role !== 'Component');
  for (const asset of visibleAssets) {
    totalElectricityDaily += calculateAssetElectricityCostRecursive(
      asset,
      activeAssets,
      electricityRate
    );
  }
  const totalElectricityCost = totalElectricityDaily * 30;
  
  // 2. 訂閱總計（月）
  const activeSubscriptions = subscriptions.filter(s => s.status === 'Active');
  const totalSubscriptionsCost = activeSubscriptions.reduce((sum, sub) => {
    return sum + (calculateSubscriptionDailyCost(sub) * 30);
  }, 0);
  
  // 3. 經常性維護（月）
  const totalRecurringMaintenance = activeAssets.reduce((sum, asset) => {
    return sum + (asset.recurringMaintenanceCost / 12); // 年度化 ÷ 12
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
 * v0.4.0 新增：貨幣格式化（Traditional Chinese）
 */
export function formatCurrencyZhTW(amount: number, currency: string = 'TWD'): string {
  // 使用 Intl.NumberFormat 進行本地化
  const formatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(Math.round(amount));
}

/**
 * v0.4.0 新增：日期格式化（Traditional Chinese）
 */
export function formatDateZhTW(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * v0.4.0 新增：相對日期格式化（例如：3 個月前）
 */
export function formatRelativeDateZhTW(date: Date): string {
  const now = new Date();
  const days = differenceInDays(now, date);
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 週前`;
  if (days < 365) return `${Math.floor(days / 30)} 個月前`;
  return `${Math.floor(days / 365)} 年前`;
}

/**
 * v0.4.0 新增：取得計費週期顯示文字
 */
export function getBillingCycleLabel(cycle: string): string {
  switch (cycle) {
    case 'Monthly': return '每月';
    case 'Quarterly': return '每季';
    case 'Yearly': return '每年';
    default: return cycle;
  }
}

/**
 * v0.4.0 新增：取得分類顯示文字
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'Tech': '科技',
    'Music': '音樂',
    'Life': '生活',
    'Others': '其他',
    'Software': '軟體',
    'Service': '服務',
    'Entertainment': '娛樂',
  };
  return labels[category] || category;
}

/**
 * v0.4.0 新增：取得狀態顯示文字
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'Active': '使用中',
    'Sold': '已出售',
    'Retired': '已退役',
    'Cancelled': '已取消',
  };
  return labels[status] || status;
}
