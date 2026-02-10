import { Link } from 'react-router-dom';
import { useAllAssets, useAllSubscriptions } from '../hooks/useDatabase';
import { useCostCalculations, formatCurrency } from '../hooks/useCostCalculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getCategoryLabel } from '../utils/costCalculations';
import { seedComprehensiveTestData } from '../testData';
import { runPerformanceTests, quickPerformanceCheck } from '../performanceTest';
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

/**
 * 載入完整測試資料
 */
async function loadTestData() {
  try {
    await seedComprehensiveTestData();
    alert('✅ 測試資料載入成功！請檢查控制台查看詳細統計。');
    window.location.reload();
  } catch (error) {
    console.error('載入測試資料失敗:', error);
    alert('❌ 載入失敗，請檢查控制台。');
  }
}

/**
 * 執行性能測試
 */
async function runTests() {
  console.clear();
  try {
    await runPerformanceTests();
    alert('✅ 性能測試完成！請查看控制台檢視詳細報告。');
  } catch (error) {
    console.error('性能測試失敗:', error);
    alert('❌ 測試失敗，請檢查控制台。');
  }
}

/**
 * 快速檢查
 */
async function quickCheck() {
  console.clear();
  await quickPerformanceCheck();
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
    <div className="min-h-screen bg-background pb-24 pt-12">
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
            <div className="flex gap-3 justify-center">
              <button
                onClick={loadTestData}
                className="px-6 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
              >
                載入完整測試資料
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DEV TOOLS (Show when data exists) ========== */}
      {chartData.length > 0 && import.meta.env.DEV && (
        <div className="max-w-4xl mx-auto px-6 mt-6">
          <div className="glass rounded-xl p-4 border border-slate-800">
            <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">開發工具</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={quickCheck}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
              >
                快速檢查
              </button>
              <button
                onClick={runTests}
                className="px-4 py-2 bg-purple-500/20 text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30"
              >
                執行性能測試
              </button>
              <button
                onClick={loadTestData}
                className="px-4 py-2 bg-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30"
              >
                重新載入測試資料
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
