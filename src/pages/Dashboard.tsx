import { Link } from 'react-router-dom';
import { useAllAssets, useAllSubscriptions } from '../hooks/useDatabase';
import { useCostCalculations, formatCurrency } from '../hooks/useCostCalculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../db';
import { getCategoryLabel } from '../utils/costCalculations';

async function addTestData() {
  // v0.4.0 新增測試資產（含電力規格）
  const serverId = crypto.randomUUID();
  await db.assets.bulkAdd([
    {
      id: serverId,
      name: 'Orange Pi 5 Plus 主機',
      category: 'Tech',
      purchaseDate: new Date('2024-01-15'),
      price: 3500,
      currency: 'TWD',
      maintenanceLog: [{ date: new Date('2024-06-10'), note: '更換散熱膏', cost: 200 }],
      targetLifespan: 1095,
      status: 'Active',
      notes: '用來跑各種服務的小主機',
      // v0.4.0
      parentId: null,
      isComposite: true, // 組合資產
      powerWatts: 15,
      dailyUsageHours: 24, // 24 小時運作
      recurringMaintenanceCost: 300, // 年度化
    },
    {
      id: crypto.randomUUID(),
      name: '記憶體 16GB DDR5',
      category: 'Tech',
      purchaseDate: new Date('2024-01-15'),
      price: 1200,
      currency: 'TWD',
      maintenanceLog: [],
      targetLifespan: 1095,
      status: 'Active',
      notes: '',
      // v0.4.0
      parentId: serverId, // 子組件
      isComposite: false,
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0,
    },
    {
      id: crypto.randomUUID(),
      name: 'NVMe SSD 256GB',
      category: 'Tech',
      purchaseDate: new Date('2024-01-15'),
      price: 800,
      currency: 'TWD',
      maintenanceLog: [],
      targetLifespan: 1095,
      status: 'Active',
      notes: '',
      // v0.4.0
      parentId: serverId, // 子組件
      isComposite: false,
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0,
    },
    {
      id: crypto.randomUUID(),
      name: 'Yamaha F310 吉他',
      category: 'Music',
      purchaseDate: new Date('2023-08-20'),
      price: 4500,
      currency: 'TWD',
      maintenanceLog: [{ date: new Date('2024-01-05'), note: '更換琴弦', cost: 350 }],
      targetLifespan: 3650,
      status: 'Active',
      notes: '初學者練習吉他',
      // v0.4.0
      parentId: null,
      isComposite: false,
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 500, // 琴弦、保養
    },
    {
      id: crypto.randomUUID(),
      name: 'MacBook Pro M1',
      category: 'Tech',
      purchaseDate: new Date('2022-03-10'),
      price: 45000,
      currency: 'TWD',
      maintenanceLog: [],
      targetLifespan: 1825,
      status: 'Active',
      notes: '主力開發機器',
      // v0.4.0
      parentId: null,
      isComposite: false,
      powerWatts: 30,
      dailyUsageHours: 10, // 每天用 10 小時
      recurringMaintenanceCost: 0,
    }
  ]);
  
  // v0.4.0 新增測試訂閱（含季度）
  await db.subscriptions.bulkAdd([
    {
      id: crypto.randomUUID(),
      name: 'Spotify Premium',
      billingCycle: 'Monthly',
      cost: 149,
      currency: 'TWD',
      startDate: new Date('2023-01-01'),
      category: 'Entertainment',
      status: 'Active',
      notes: '音樂串流服務'
    },
    {
      id: crypto.randomUUID(),
      name: 'Vultr VPS',
      billingCycle: 'Monthly',
      cost: 180,
      currency: 'TWD',
      startDate: new Date('2023-06-15'),
      category: 'Service',
      status: 'Active',
      notes: '用來跑網站的 VPS'
    },
    {
      id: crypto.randomUUID(),
      name: 'ChatGPT Plus',
      billingCycle: 'Monthly',
      cost: 600,
      currency: 'TWD',
      startDate: new Date('2024-01-01'),
      category: 'Software',
      status: 'Active',
      notes: 'AI 助手訂閱'
    },
    {
      id: crypto.randomUUID(),
      name: 'Netflix',
      billingCycle: 'Quarterly', // v0.4.0 季度計費
      cost: 1050,
      currency: 'TWD',
      startDate: new Date('2022-09-01'),
      category: 'Entertainment',
      status: 'Active',
      notes: '影片串流服務（季繳優惠）'
    }
  ]);
}

export default function Dashboard() {
  const assets = useAllAssets() || [];
  const subscriptions = useAllSubscriptions() || [];
  
  const calculations = useCostCalculations(assets, subscriptions);
  
  // 準備圖表資料（Traditional Chinese）
  const chartData = calculations.costByCategory.map(item => ({
    name: getCategoryLabel(item.category),
    value: item.dailyCost,
    color: item.color
  }));
  
  const { invisibleCosts } = calculations;
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 主要指標 - 每日燒錢速率 */}
      <div className="bg-gradient-to-br from-red-500 to-orange-600 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-medium opacity-90">每日燒錢速率</h1>
            <Link
              to="/settings"
              className="text-white/70 hover:text-white transition-colors"
              aria-label="設定"
            >
              ⚙️
            </Link>
          </div>
          <div className="text-6xl font-bold mb-4">
            {formatCurrency(calculations.totalDailyBurn)}
          </div>
          <p className="text-sm opacity-90">
            每一天，這些錢就這樣消失了...
          </p>
        </div>
      </div>
      
      {/* 統計卡片 */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* v0.4.0 新增：隱形成本卡片 */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border-2 border-purple-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-1">💸 隱形成本</h3>
              <p className="text-xs text-muted-foreground">電費 + 訂閱 + 經常性維護</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-300">
                {formatCurrency(invisibleCosts.totalMonthly)}
              </div>
              <div className="text-xs text-muted-foreground">每月</div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">⚡ 電費</span>
              <span className="font-semibold">{formatCurrency(invisibleCosts.totalElectricityCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">📱 訂閱</span>
              <span className="font-semibold">{formatCurrency(invisibleCosts.totalSubscriptionsCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">🔧 維護</span>
              <span className="font-semibold">{formatCurrency(invisibleCosts.totalRecurringMaintenance)}</span>
            </div>
          </div>
        </div>
        
        {/* 成本拆解 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground mb-1">資產折舊</div>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(calculations.assetsDailyCost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {assets.filter(a => a.status === 'Active').length} 個資產
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground mb-1">訂閱費用</div>
            <div className="text-2xl font-bold text-purple-500">
              {formatCurrency(calculations.subscriptionsDailyCost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {subscriptions.filter(s => s.status === 'Active').length} 個訂閱
            </div>
          </div>
        </div>
        
        {/* 月度/年度預估 */}
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-semibold mb-3">成本預估</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">每月成本</span>
              <span className="font-semibold text-lg">
                {formatCurrency(calculations.totalMonthlyCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">每年成本</span>
              <span className="font-semibold text-lg">
                {formatCurrency(calculations.totalYearlyCost)}
              </span>
            </div>
          </div>
        </div>
        
        {/* 分類圖表 */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-4">成本分佈</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${formatCurrency(entry.value)})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* 分類列表 */}
            <div className="mt-4 space-y-2">
              {calculations.costByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{getCategoryLabel(item.category)}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.dailyCost)}/日</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 空狀態 */}
        {chartData.length === 0 && (
          <div className="bg-card rounded-lg p-8 border text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-semibold mb-2">還沒有任何資料</h3>
            <p className="text-sm text-muted-foreground mb-4">
              新增你的第一個資產或訂閱，開始追蹤每日成本
            </p>
            <button
              onClick={() => addTestData()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              新增測試資料
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
