import { Link } from 'react-router-dom';
import { useAllAssets, useAllSubscriptions } from '../hooks/useDatabase';
import { useCostCalculations, formatCurrency } from '../hooks/useCostCalculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../db';
import { getCategoryLabel } from '../utils/costCalculations';
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  Zap, 
  CreditCard, 
  Wrench,
  Package,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';

// Professional price display component
function PriceDisplay({ amount, size = 'default', currency = 'TWD' }: { 
  amount: number; 
  size?: 'small' | 'default' | 'large' | 'hero'; 
  currency?: string;
}) {
  const formatted = formatCurrency(amount, currency);
  const [symbol, ...numberParts] = formatted.split(/(?=\d)/);
  const number = numberParts.join('');
  
  const sizeClasses = {
    small: { symbol: 'text-xs', number: 'text-lg' },
    default: { symbol: 'text-sm', number: 'text-2xl' },
    large: { symbol: 'text-base', number: 'text-4xl' },
    hero: { symbol: 'text-2xl', number: 'text-7xl md:text-8xl' }
  };
  
  const classes = sizeClasses[size];
  
  return (
    <div className="flex items-baseline gap-1">
      <span className={`${classes.symbol} text-slate-400 font-medium`}>{symbol}</span>
      <span className={`${classes.number} font-black`}>{number}</span>
    </div>
  );
}

async function addTestData() {
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
      parentId: null,
      isComposite: true,
      powerWatts: 15,
      dailyUsageHours: 24,
      recurringMaintenanceCost: 300,
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
      parentId: serverId,
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
      parentId: serverId,
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
      parentId: null,
      isComposite: false,
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 500,
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
      parentId: null,
      isComposite: false,
      powerWatts: 30,
      dailyUsageHours: 10,
      recurringMaintenanceCost: 0,
    }
  ]);
  
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
      billingCycle: 'Quarterly',
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
  
  const chartData = calculations.costByCategory.map(item => ({
    name: getCategoryLabel(item.category),
    value: item.dailyCost,
    color: item.color
  }));
  
  const { invisibleCosts } = calculations;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ========== HERO SECTION - Professional Burn Rate ========== */}
      <div className="relative overflow-hidden border-b border-slate-800">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-6 pt-8 pb-12">
          {/* Header with settings */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Real-Time Monitor
              </span>
            </div>
            <Link
              to="/settings"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="設定"
            >
              <Settings className="w-5 h-5 text-slate-400" />
            </Link>
          </div>

          {/* Main metric */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              你的數位生活每日成本
            </h2>
            <div className="flex items-baseline gap-3">
              <PriceDisplay amount={calculations.totalDailyBurn} size="hero" />
              <span className="text-2xl font-bold text-slate-500 mb-2">/ 日</span>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>每一天，這些成本正在消耗中</span>
            </p>
          </div>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="text-xs text-slate-400 uppercase tracking-wide">月支出</div>
              </div>
              <PriceDisplay amount={calculations.totalMonthlyCost} size="default" />
            </div>
            <div className="glass rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <div className="text-xs text-slate-400 uppercase tracking-wide">年支出</div>
              </div>
              <PriceDisplay amount={calculations.totalYearlyCost} size="default" />
            </div>
            <div className="glass rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-slate-400" />
                <div className="text-xs text-slate-400 uppercase tracking-wide">活躍項目</div>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {assets.filter(a => a.status === 'Active').length + subscriptions.filter(s => s.status === 'Active').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== INVISIBLE COSTS - Stat Blocks Style ========== */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="glass rounded-2xl p-6 border border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">隱形成本</h3>
                <p className="text-xs text-slate-400">經常性支出項目</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">每月總計</div>
              <PriceDisplay amount={invisibleCosts.totalMonthly} size="large" />
            </div>
          </div>

          {/* Stat blocks grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Electricity */}
            <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl p-4 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">電費</span>
              </div>
              <PriceDisplay amount={invisibleCosts.totalElectricityCost} size="default" />
              <div className="text-xs text-slate-500 mt-2">/ 月</div>
            </div>

            {/* Subscriptions */}
            <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">訂閱</span>
              </div>
              <PriceDisplay amount={invisibleCosts.totalSubscriptionsCost} size="default" />
              <div className="text-xs text-slate-500 mt-2">/ 月</div>
            </div>

            {/* Maintenance */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">維護</span>
              </div>
              <PriceDisplay amount={invisibleCosts.totalRecurringMaintenance} size="default" />
              <div className="text-xs text-slate-500 mt-2">/ 月</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== COST BREAKDOWN ========== */}
      <div className="max-w-4xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Assets */}
          <Link to="/assets" className="card-hover">
            <div className="glass rounded-2xl p-6 border border-slate-800 hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-blue-400" />
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  資產折舊
                </div>
              </div>
              <PriceDisplay amount={calculations.assetsDailyCost} size="large" />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500">
                  {assets.filter(a => a.status === 'Active').length} 個資產
                </div>
                <div className="text-primary">→</div>
              </div>
            </div>
          </Link>

          {/* Subscriptions */}
          <Link to="/subscriptions" className="card-hover">
            <div className="glass rounded-2xl p-6 border border-slate-800 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  訂閱費用
                </div>
              </div>
              <PriceDisplay amount={calculations.subscriptionsDailyCost} size="large" />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500">
                  {subscriptions.filter(s => s.status === 'Active').length} 個訂閱
                </div>
                <div className="text-primary">→</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ========== ANALYTICS - Pie Chart ========== */}
      {chartData.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pb-6">
          <div className="glass rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <LayoutDashboard className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                資產分佈
              </h3>
            </div>
            
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '0.75rem',
                      backdropFilter: 'blur(12px)'
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Category list */}
            <div className="space-y-3">
              {calculations.costByCategory.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full ring-2 ring-white/20" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-200">
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriceDisplay amount={item.dailyCost} size="small" />
                    <span className="text-xs text-slate-500">/ 日</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== EMPTY STATE ========== */}
      {chartData.length === 0 && (
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass rounded-2xl p-12 text-center border border-slate-800">
            <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-bold mb-2">還沒有任何資料</h3>
            <p className="text-sm text-slate-400 mb-6">
              新增你的第一個資產或訂閱，開始追蹤每日成本
            </p>
            <button
              onClick={() => addTestData()}
              className="px-6 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
            >
              新增測試資料
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
