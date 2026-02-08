import { Link } from 'react-router-dom';
import { calculateAssetDetails, formatCurrency } from '../hooks/useCostCalculations';
import type { PhysicalAsset } from '../types';

interface AssetCardProps {
  asset: PhysicalAsset;
}

export default function AssetCard({ asset }: AssetCardProps) {
  const details = calculateAssetDetails(asset);
  
  const categoryEmoji: { [key: string]: string } = {
    'Tech': '💻',
    'Music': '🎵',
    'Life': '🏠',
    'Others': '📦'
  };
  
  const statusColor: { [key: string]: string } = {
    'Active': 'bg-green-500/10 text-green-500',
    'Sold': 'bg-blue-500/10 text-blue-500',
    'Retired': 'bg-gray-500/10 text-gray-500'
  };
  
  return (
    <Link
      to={`/assets/${asset.id}`}
      className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryEmoji[asset.category]}</span>
          <div>
            <h3 className="font-semibold text-lg">{asset.name}</h3>
            <p className="text-xs text-muted-foreground">{asset.category}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${statusColor[asset.status]}`}>
          {asset.status === 'Active' ? '使用中' : asset.status === 'Sold' ? '已售出' : '已退役'}
        </span>
      </div>
      
      {/* 每日成本 - 大大顯示 */}
      <div className="bg-orange-500/10 rounded-lg p-3 mb-3">
        <div className="text-xs text-orange-400 mb-1">每日成本</div>
        <div className="text-2xl font-bold text-orange-500">
          {formatCurrency(details.dailyCost, asset.currency)}
        </div>
      </div>
      
      {/* 統計資訊 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">持有天數</div>
          <div className="font-medium">{details.daysOwned} 天</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">總成本</div>
          <div className="font-medium">{formatCurrency(details.totalCost, asset.currency)}</div>
        </div>
      </div>
      
      {/* 目標進度條 */}
      {asset.status === 'Active' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>使用目標</span>
            <span>{Math.round(details.progressPercentage)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all"
              style={{ width: `${Math.min(100, details.progressPercentage)}%` }}
            />
          </div>
          {details.remainingDays > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              還需 {details.remainingDays} 天達標
            </p>
          )}
          {details.remainingDays <= 0 && (
            <p className="text-xs text-green-500 mt-1">
              ✓ 已達成目標！
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
