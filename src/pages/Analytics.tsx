import { useState } from 'react';
import { useAllAssets, useAllSubscriptions } from '../hooks/useDatabase';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatCurrency } from '../hooks/useCostCalculations';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TimeRange = 3 | 6 | 12;

export default function Analytics() {
  const assets = useAllAssets() || [];
  const subscriptions = useAllSubscriptions() || [];
  const [timeRange, setTimeRange] = useState<TimeRange>(6);
  
  const analytics = useAnalytics(assets, subscriptions, timeRange);

  // Format data for stacked bar chart
  const categoryChartData = analytics.monthlyTrends.map(month => {
    const dataPoint: any = { month: month.monthLabel };
    
    analytics.categoryTrends.forEach(cat => {
      const monthData = cat.trend.find(t => t.month === month.month);
      dataPoint[cat.category] = monthData ? Math.round(monthData.cost) : 0;
    });
    
    return dataPoint;
  });

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'success': return 'border-green-500 bg-green-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  // No data state
  if (assets.length === 0 && subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">數據分析</h1>
            <p className="text-muted-foreground">深入了解你的開銷模式</p>
          </div>
          
          <div className="bg-card rounded-lg p-8 border text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-semibold mb-2">尚無數據</h3>
            <p className="text-sm text-muted-foreground">
              新增資產或訂閱後即可查看分析報告
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentDailyCost = analytics.monthlyTrends.length > 0 
    ? analytics.monthlyTrends[analytics.monthlyTrends.length - 1].totalCost 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">數據分析</h1>
          <p className="text-muted-foreground">深入了解你的開銷模式</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {[3, 6, 12].map((months) => (
            <button
              key={months}
              onClick={() => setTimeRange(months as TimeRange)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === months
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border hover:bg-accent'
              }`}
            >
              {months} 個月
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground mb-1">當前每日成本</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(currentDailyCost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              月支出約 {formatCurrency(currentDailyCost * 30)}
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground mb-1">資產總價值</div>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(analytics.totalAssetsValue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {assets.filter((a: any) => a.status === 'Active').length} 件活躍資產
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground mb-1">訂閱累計支出</div>
            <div className="text-2xl font-bold text-purple-500">
              {formatCurrency(analytics.totalSubscriptionsSpent)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {subscriptions.filter((s: any) => s.status === 'Active').length} 個活躍訂閱
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-card rounded-lg p-6 border mb-6">
          <h2 className="text-xl font-semibold mb-4">每日成本趨勢</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#888"
                fontSize={12}
              />
              <YAxis 
                stroke="#888"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
                formatter={(value: number | undefined) => value !== undefined ? [`NT$${Math.round(value).toLocaleString()}`, ''] : ['', '']}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="assetsCost" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="資產"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="subscriptionsCost" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="訂閱"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalCost" 
                stroke="#10b981" 
                strokeWidth={3}
                name="總計"
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        {categoryChartData.length > 0 && (
          <div className="bg-card rounded-lg p-6 border mb-6">
            <h2 className="text-xl font-semibold mb-4">分類支出分佈</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#888"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? `NT$${Math.round(value).toLocaleString()}` : ''}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {analytics.categoryTrends.map(cat => (
                  <Bar 
                    key={cat.category}
                    dataKey={cat.category}
                    stackId="a"
                    fill={cat.color}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Expenses */}
        {analytics.topExpenses.length > 0 && (
          <div className="bg-card rounded-lg p-6 border mb-6">
            <h2 className="text-xl font-semibold mb-4">最大支出項目（前 10）</h2>
            <div className="space-y-3">
              {analytics.topExpenses.map((expense, index) => (
                <div 
                  key={`${expense.type}-${expense.name}`}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{expense.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {expense.type === 'asset' ? '資產' : '訂閱'} • {expense.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      {formatCurrency(expense.dailyCost)}/天
                    </div>
                    <div className="text-xs text-muted-foreground">
                      總支出 {formatCurrency(expense.totalSpent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {analytics.insights.length > 0 && (
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">💡 智能洞察</h2>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{insight.title}</div>
                      <div className="text-sm text-muted-foreground">{insight.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
