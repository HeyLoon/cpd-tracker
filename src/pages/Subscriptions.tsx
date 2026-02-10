import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllSubscriptions } from '../hooks/useDatabase';
import SubscriptionCard from '../components/SubscriptionCard';
import { formatCurrency } from '../hooks/useCostCalculations';
import type { SubscriptionStatus, SubscriptionCategory } from '../types';

export default function Subscriptions() {
  const subscriptions = useAllSubscriptions();
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<SubscriptionCategory | 'All'>('All');
  
  const isLoading = !subscriptions;
  
  // 過濾訂閱
  const filteredSubscriptions = subscriptions?.filter(sub => {
    if (statusFilter !== 'All' && sub.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && sub.category !== categoryFilter) return false;
    return true;
  }) || [];
  
  // 統計
  const stats = {
    total: subscriptions?.length || 0,
    active: subscriptions?.filter(s => s.status === 'Active').length || 0,
    cancelled: subscriptions?.filter(s => s.status === 'Cancelled').length || 0,
    monthlyTotal: subscriptions
      ?.filter(s => s.status === 'Active')
      .reduce((sum, s) => {
        const monthlyCost = s.billingCycle === 'Monthly' ? s.cost : s.cost / 12;
        return sum + monthlyCost;
      }, 0) || 0
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-20 pt-12">
      <div className="max-w-4xl mx-auto p-4">
        {/* 標題與新增按鈕 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">訂閱管理</h1>
            <p className="text-muted-foreground">追蹤你的所有訂閱服務</p>
          </div>
          <Link
            to="/subscriptions/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            ＋ 新增
          </Link>
        </div>
        
        {/* 統計卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">總訂閱數</div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-xs text-green-500 mt-1">
              {stats.active} 個啟用中
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg p-4">
            <div className="text-xs opacity-90 mb-1">每月總支出</div>
            <div className="text-3xl font-bold">
              {formatCurrency(stats.monthlyTotal)}
            </div>
            <div className="text-xs opacity-75 mt-1">
              每年 {formatCurrency(stats.monthlyTotal * 12)}
            </div>
          </div>
        </div>
        
        {/* 篩選器 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <div className="space-y-3">
            {/* 狀態篩選 */}
            <div>
              <label className="text-sm font-medium mb-2 block">狀態</label>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Active', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as SubscriptionStatus | 'All')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {status === 'All' ? '全部' : 
                     status === 'Active' ? '訂閱中' : '已取消'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 分類篩選 */}
            <div>
              <label className="text-sm font-medium mb-2 block">分類</label>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Software', 'Service', 'Entertainment'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category as SubscriptionCategory | 'All')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      categoryFilter === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {category === 'All' ? '全部' :
                     category === 'Software' ? '💻 軟體' :
                     category === 'Service' ? '🔧 服務' : '🎬 娛樂'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 訂閱列表 */}
        {filteredSubscriptions.length > 0 ? (
          <div className="space-y-3">
            {filteredSubscriptions
              .sort((a, b) => {
                // 先顯示啟用的，再顯示取消的
                if (a.status !== b.status) {
                  return a.status === 'Active' ? -1 : 1;
                }
                // 同狀態按日期排序
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
              })
              .map(subscription => (
                <SubscriptionCard key={subscription.id} subscription={subscription} />
              ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg p-8 border text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="font-semibold mb-2">
              {subscriptions.length === 0 ? '還沒有任何訂閱' : '沒有符合條件的訂閱'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {subscriptions.length === 0 
                ? '新增你的第一個訂閱，開始追蹤每月花費'
                : '試著調整篩選條件'}
            </p>
            {subscriptions.length === 0 && (
              <Link
                to="/subscriptions/new"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                新增訂閱
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
