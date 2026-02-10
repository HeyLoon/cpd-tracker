import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSubscription } from '../hooks/useDatabase';
import { calculateSubscriptionDetails, formatCurrency } from '../hooks/useCostCalculations';
import { deleteSubscription, updateSubscription } from '../db';
import { format, differenceInMonths } from 'date-fns';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const subscription = useSubscription(id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  if (!subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }
  
  const details = calculateSubscriptionDetails(subscription);
  
  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteSubscription(id);
      navigate('/subscriptions');
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請重試');
    }
  };
  
  const handleCancel = async () => {
    if (!id) return;
    try {
      await updateSubscription(id, {
        status: 'Cancelled',
        cancelledDate: new Date()
      });
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('取消訂閱失敗:', error);
      alert('取消失敗，請重試');
    }
  };
  
  const categoryEmoji: { [key: string]: string } = {
    'Software': '💻',
    'Service': '🔧',
    'Entertainment': '🎬'
  };
  
  const monthsSubscribed = differenceInMonths(
    subscription.cancelledDate || new Date(),
    subscription.startDate
  );
  
  return (
    <div className="min-h-screen bg-background pb-20 pt-12">
      <div className="max-w-2xl mx-auto p-4">
        {/* 標題 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/subscriptions')}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            ← 返回
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{categoryEmoji[subscription.category]}</span>
              <div>
                <h1 className="text-3xl font-bold mb-1">{subscription.name}</h1>
                <p className="text-muted-foreground">{subscription.category}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/subscriptions/${id}/edit`)}
              className="bg-secondary px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              編輯
            </button>
          </div>
        </div>
        
        {/* 每日成本大卡片 */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg p-6 mb-4">
          <div className="text-sm opacity-90 mb-2">每日成本</div>
          <div className="text-5xl font-bold mb-4">
            {formatCurrency(details.dailyCost, subscription.currency)}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="opacity-75">計費週期</div>
              <div className="font-semibold">
                {subscription.billingCycle === 'Monthly' ? '每月' : '每年'} {formatCurrency(subscription.cost, subscription.currency)}
              </div>
            </div>
            <div>
              <div className="opacity-75">訂閱時長</div>
              <div className="font-semibold">{Math.round(details.monthsActive)} 個月</div>
            </div>
          </div>
        </div>
        
        {/* 累積花費驚人卡片 */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-muted-foreground mb-2">💸 累積花費</h3>
              <div className="text-4xl font-bold text-orange-500 mb-2">
                {formatCurrency(details.totalSpent, subscription.currency)}
              </div>
              <p className="text-sm text-muted-foreground">
                從 {format(subscription.startDate, 'yyyy-MM-dd')} 開始
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-muted-foreground">
                {monthsSubscribed}
              </div>
              <div className="text-xs text-muted-foreground">個月</div>
            </div>
          </div>
        </div>
        
        {/* 基本資訊 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">基本資訊</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">開始日期</span>
              <span className="font-medium">{format(subscription.startDate, 'yyyy-MM-dd')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">狀態</span>
              <span className="font-medium">
                {subscription.status === 'Active' ? '✓ 訂閱中' : '✗ 已取消'}
              </span>
            </div>
            {subscription.cancelledDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">取消日期</span>
                <span className="font-medium">{format(subscription.cancelledDate, 'yyyy-MM-dd')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">貨幣</span>
              <span className="font-medium">{subscription.currency}</span>
            </div>
          </div>
        </div>
        
        {/* 成本分析 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">成本分析</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">每日成本</span>
              <span className="font-semibold">{formatCurrency(details.dailyCost, subscription.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">每月成本</span>
              <span className="font-semibold">
                {formatCurrency(
                  subscription.billingCycle === 'Monthly' ? subscription.cost : subscription.cost / 12,
                  subscription.currency
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">每年成本</span>
              <span className="font-semibold">
                {formatCurrency(
                  subscription.billingCycle === 'Yearly' ? subscription.cost : subscription.cost * 12,
                  subscription.currency
                )}
              </span>
            </div>
          </div>
        </div>
        
        {/* 備註 */}
        {subscription.notes && (
          <div className="bg-card border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">備註</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{subscription.notes}</p>
          </div>
        )}
        
        {/* 取消訂閱按鈕 (僅啟用狀態顯示) */}
        {subscription.status === 'Active' && (
          <div className="bg-card border border-yellow-500/20 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-500 mb-2">取消訂閱</h3>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
              >
                取消此訂閱
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">確定要取消此訂閱嗎？</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 bg-secondary px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    不取消
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    確定取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 刪除按鈕 */}
        <div className="bg-card border border-red-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-red-500 mb-2">危險操作</h3>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              刪除訂閱記錄
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">確定要刪除此訂閱記錄嗎？此操作無法復原。</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-secondary px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  確定刪除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
