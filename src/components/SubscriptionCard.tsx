import { Link } from 'react-router-dom';
import { calculateSubscriptionDetails, formatCurrency } from '../hooks/useCostCalculations';
import type { Subscription } from '../types';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const details = calculateSubscriptionDetails(subscription);
  
  const categoryEmoji: { [key: string]: string } = {
    'Software': '💻',
    'Service': '🔧',
    'Entertainment': '🎬'
  };
  
  const statusColor: { [key: string]: string } = {
    'Active': 'bg-green-500/10 text-green-500',
    'Cancelled': 'bg-red-500/10 text-red-500'
  };
  
  return (
    <Link
      to={`/subscriptions/${subscription.id}`}
      className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryEmoji[subscription.category]}</span>
          <div>
            <h3 className="font-semibold text-lg">{subscription.name}</h3>
            <p className="text-xs text-muted-foreground">{subscription.category}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${statusColor[subscription.status]}`}>
          {subscription.status === 'Active' ? '訂閱中' : '已取消'}
        </span>
      </div>
      
      {/* 每日成本 */}
      <div className="bg-purple-500/10 rounded-lg p-3 mb-3">
        <div className="text-xs text-purple-400 mb-1">每日成本</div>
        <div className="text-2xl font-bold text-purple-500">
          {formatCurrency(details.dailyCost, subscription.currency)}
        </div>
      </div>
      
      {/* 統計資訊 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">計費週期</div>
          <div className="font-medium">
            {subscription.billingCycle === 'Monthly' ? '每月' : '每年'} {formatCurrency(subscription.cost, subscription.currency)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">累積花費</div>
          <div className="font-medium text-orange-500">
            {formatCurrency(details.totalSpent, subscription.currency)}
          </div>
        </div>
      </div>
      
      {/* 訂閱時長 */}
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        已訂閱 {Math.round(details.monthsActive)} 個月
      </div>
    </Link>
  );
}
