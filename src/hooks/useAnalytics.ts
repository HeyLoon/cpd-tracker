import { useMemo } from 'react';
import { differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, format } from 'date-fns';
import type { PhysicalAsset, Subscription } from '../types';

export interface MonthlyTrend {
  month: string; // "2024-01"
  monthLabel: string; // "Jan 2024"
  assetsCost: number;
  subscriptionsCost: number;
  totalCost: number;
}

export interface CategoryTrend {
  category: string;
  color: string;
  trend: {
    month: string;
    cost: number;
  }[];
  totalCost: number;
}

export interface TopExpense {
  type: 'asset' | 'subscription';
  name: string;
  dailyCost: number;
  category: string;
  totalSpent: number;
}

export interface Insight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

export interface AnalyticsData {
  monthlyTrends: MonthlyTrend[];
  categoryTrends: CategoryTrend[];
  topExpenses: TopExpense[];
  insights: Insight[];
  totalAssetsValue: number;
  totalSubscriptionsSpent: number;
}

/**
 * Advanced analytics hook - calculates trends and insights
 */
export function useAnalytics(
  assets: PhysicalAsset[],
  subscriptions: Subscription[],
  monthsToShow: number = 6
): AnalyticsData {
  return useMemo(() => {
    const now = new Date();
    const startDate = subMonths(startOfMonth(now), monthsToShow - 1);
    
    // Generate array of months to analyze
    const months = eachMonthOfInterval({
      start: startDate,
      end: now
    });

    // Category colors
    const categoryColors: { [key: string]: string } = {
      'Tech': '#3b82f6',
      'Music': '#8b5cf6',
      'Life': '#10b981',
      'Others': '#6b7280',
      'Software': '#ec4899',
      'Service': '#f59e0b',
      'Entertainment': '#ef4444'
    };

    // Calculate monthly trends
    const monthlyTrends: MonthlyTrend[] = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthStr = format(month, 'yyyy-MM');
      const monthLabel = format(month, 'MMM yyyy');

      // Assets cost for this month
      const assetsCost = assets
        .filter(asset => {
          const purchased = asset.purchaseDate <= monthEnd;
          // Include active assets, or sold/retired assets that were purchased before this month
          const stillActive = asset.status === 'Active' || 
            ((asset.status === 'Sold' || asset.status === 'Retired') && asset.purchaseDate <= monthEnd);
          return purchased && stillActive;
        })
        .reduce((total, asset) => {
          const daysOwned = Math.max(1, differenceInDays(monthEnd, asset.purchaseDate));
          const maintenanceCost = asset.maintenanceLog
            .filter(log => log.date <= monthEnd)
            .reduce((sum, log) => sum + log.cost, 0);
          const totalCost = asset.price + maintenanceCost;
          const dailyCost = totalCost / daysOwned;
          return total + dailyCost;
        }, 0);

      // Subscriptions cost for this month
      const subscriptionsCost = subscriptions
        .filter(sub => {
          const started = sub.startDate <= monthEnd;
          const notCancelled = sub.status === 'Active' || 
            (sub.cancelledDate && sub.cancelledDate >= monthStart);
          return started && notCancelled;
        })
        .reduce((total, sub) => {
          const dailyCost = sub.billingCycle === 'Monthly' 
            ? sub.cost / 30 
            : sub.cost / 365;
          return total + dailyCost;
        }, 0);

      return {
        month: monthStr,
        monthLabel,
        assetsCost,
        subscriptionsCost,
        totalCost: assetsCost + subscriptionsCost
      };
    });

    // Calculate category trends
    const categoryMap = new Map<string, { month: string; cost: number }[]>();
    
    months.forEach(month => {
      const monthEnd = endOfMonth(month);
      const monthStr = format(month, 'yyyy-MM');

      // Assets by category
      assets
        .filter(asset => {
          const purchased = asset.purchaseDate <= monthEnd;
          // Include active assets, or sold/retired assets that were purchased before this month
          const stillActive = asset.status === 'Active' || 
            ((asset.status === 'Sold' || asset.status === 'Retired') && asset.purchaseDate <= monthEnd);
          return purchased && stillActive;
        })
        .forEach(asset => {
          const daysOwned = Math.max(1, differenceInDays(monthEnd, asset.purchaseDate));
          const maintenanceCost = asset.maintenanceLog
            .filter(log => log.date <= monthEnd)
            .reduce((sum, log) => sum + log.cost, 0);
          const totalCost = asset.price + maintenanceCost;
          const dailyCost = totalCost / daysOwned;

          const existing = categoryMap.get(asset.category) || [];
          const monthEntry = existing.find(e => e.month === monthStr);
          if (monthEntry) {
            monthEntry.cost += dailyCost;
          } else {
            existing.push({ month: monthStr, cost: dailyCost });
            categoryMap.set(asset.category, existing);
          }
        });

      // Subscriptions by category
      subscriptions
        .filter(sub => {
          const monthStart = startOfMonth(month);
          const started = sub.startDate <= monthEnd;
          const notCancelled = sub.status === 'Active' || 
            (sub.cancelledDate && sub.cancelledDate >= monthStart);
          return started && notCancelled;
        })
        .forEach(sub => {
          const dailyCost = sub.billingCycle === 'Monthly' 
            ? sub.cost / 30 
            : sub.cost / 365;

          const existing = categoryMap.get(sub.category) || [];
          const monthEntry = existing.find(e => e.month === monthStr);
          if (monthEntry) {
            monthEntry.cost += dailyCost;
          } else {
            existing.push({ month: monthStr, cost: dailyCost });
            categoryMap.set(sub.category, existing);
          }
        });
    });

    const categoryTrends: CategoryTrend[] = Array.from(categoryMap.entries())
      .map(([category, trend]) => ({
        category,
        color: categoryColors[category] || '#6b7280',
        trend,
        totalCost: trend.reduce((sum, t) => sum + t.cost, 0)
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Calculate top expenses
    const topExpenses: TopExpense[] = [];

    // Add assets
    assets
      .filter(asset => asset.status === 'Active')
      .forEach(asset => {
        const daysOwned = Math.max(1, differenceInDays(now, asset.purchaseDate));
        const maintenanceCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
        const totalCost = asset.price + maintenanceCost;
        const dailyCost = totalCost / daysOwned;

        topExpenses.push({
          type: 'asset',
          name: asset.name,
          dailyCost,
          category: asset.category,
          totalSpent: totalCost
        });
      });

    // Add subscriptions
    subscriptions
      .filter(sub => sub.status === 'Active')
      .forEach(sub => {
        const daysActive = Math.max(1, differenceInDays(now, sub.startDate));
        const dailyCost = sub.billingCycle === 'Monthly' 
          ? sub.cost / 30 
          : sub.cost / 365;
        const totalSpent = dailyCost * daysActive;

        topExpenses.push({
          type: 'subscription',
          name: sub.name,
          dailyCost,
          category: sub.category,
          totalSpent
        });
      });

    // Sort by daily cost
    topExpenses.sort((a, b) => b.dailyCost - a.dailyCost);

    // Generate insights
    const insights: Insight[] = [];

    // Total calculations
    const totalAssetsValue = assets
      .filter(a => a.status === 'Active')
      .reduce((sum, a) => sum + a.price, 0);
    
    const totalSubscriptionsSpent = subscriptions
      .filter(s => s.status === 'Active')
      .reduce((sum, s) => {
        const days = Math.max(1, differenceInDays(now, s.startDate));
        const daily = s.billingCycle === 'Monthly' ? s.cost / 30 : s.cost / 365;
        return sum + (daily * days);
      }, 0);

    // Insight: High subscription costs
    const monthlySubsCost = subscriptions
      .filter(s => s.status === 'Active')
      .reduce((sum, s) => {
        const daily = s.billingCycle === 'Monthly' ? s.cost / 30 : s.cost / 365;
        return sum + (daily * 30);
      }, 0);

    if (monthlySubsCost > 2000) {
      insights.push({
        type: 'warning',
        title: '訂閱支出偏高',
        message: `你的月訂閱費用高達 NT$${Math.round(monthlySubsCost).toLocaleString()}，考慮取消不常用的服務。`
      });
    }

    // Insight: Assets nearing target lifespan
    const nearingBreakeven = assets.filter(a => {
      if (a.status !== 'Active') return false;
      const days = differenceInDays(now, a.purchaseDate);
      const progress = (days / a.targetLifespan) * 100;
      return progress >= 80 && progress < 100;
    });

    if (nearingBreakeven.length > 0) {
      insights.push({
        type: 'success',
        title: '即將回本',
        message: `你有 ${nearingBreakeven.length} 件資產即將達到目標壽命，恭喜回本！`
      });
    }

    // Insight: Increasing trend
    if (monthlyTrends.length >= 3) {
      const last3Months = monthlyTrends.slice(-3);
      const isIncreasing = last3Months.every((month, i) => {
        if (i === 0) return true;
        return month.totalCost > last3Months[i - 1].totalCost;
      });

      if (isIncreasing) {
        const increase = last3Months[2].totalCost - last3Months[0].totalCost;
        const percentIncrease = ((increase / last3Months[0].totalCost) * 100).toFixed(1);
        insights.push({
          type: 'warning',
          title: '支出持續增加',
          message: `過去 3 個月你的每日成本增加了 ${percentIncrease}%，注意控制開支。`
        });
      }
    }

    // Insight: Good diversification
    if (categoryTrends.length >= 3) {
      insights.push({
        type: 'info',
        title: '多元化支出',
        message: `你的支出分散在 ${categoryTrends.length} 個類別，風險分散良好。`
      });
    }

    // Insight: Top expense
    if (topExpenses.length > 0) {
      const topExpense = topExpenses[0];
      const percentOfTotal = monthlyTrends.length > 0 
        ? ((topExpense.dailyCost / monthlyTrends[monthlyTrends.length - 1].totalCost) * 100).toFixed(1)
        : 0;
      
      if (parseFloat(percentOfTotal.toString()) > 30) {
        insights.push({
          type: 'info',
          title: '最大支出項目',
          message: `「${topExpense.name}」佔你每日總支出的 ${percentOfTotal}%，是最大的開銷來源。`
        });
      }
    }

    // Insight: Electricity and maintenance costs (v0.4.0)
    const assetsWithPower = assets.filter(a => 
      a.status === 'Active' && a.powerWatts > 0 && a.dailyUsageHours > 0
    );
    const assetsWithMaintenance = assets.filter(a => 
      a.status === 'Active' && a.recurringMaintenanceCost > 0
    );
    
    if (assetsWithPower.length > 0 || assetsWithMaintenance.length > 0) {
      const parts = [];
      if (assetsWithPower.length > 0) {
        parts.push(`${assetsWithPower.length} 件資產有電費`);
      }
      if (assetsWithMaintenance.length > 0) {
        parts.push(`${assetsWithMaintenance.length} 件需定期維護`);
      }
      
      insights.push({
        type: 'info',
        title: '隱形成本提醒',
        message: `你有${parts.join('、')}。這些隱形成本會在主頁面顯示，記得納入預算考量。`
      });
    }

    return {
      monthlyTrends,
      categoryTrends,
      topExpenses: topExpenses.slice(0, 10), // Top 10
      insights,
      totalAssetsValue,
      totalSubscriptionsSpent
    };
  }, [assets, subscriptions, monthsToShow]);
}
