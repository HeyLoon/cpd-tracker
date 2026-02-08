import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { calculateAssetDetails, formatCurrency } from '../hooks/useCostCalculations';
import { getCategoryLabel, getStatusLabel } from '../utils/costCalculations';
import { getSettings } from '../db';
import type { PhysicalAsset } from '../types';
import { 
  Laptop, 
  Music, 
  Home, 
  Package, 
  Server,
  Zap,
  Calendar,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface AssetCardProps {
  asset: PhysicalAsset;
  allAssets: PhysicalAsset[];
}

// Professional price display
function PriceDisplay({ amount, currency = 'TWD', size = 'default' }: { 
  amount: number; 
  currency?: string;
  size?: 'small' | 'default' | 'large';
}) {
  const formatted = formatCurrency(amount, currency);
  const [symbol, ...numberParts] = formatted.split(/(?=\d)/);
  const number = numberParts.join('');
  
  const sizeClasses = {
    small: { symbol: 'text-xs', number: 'text-lg' },
    default: { symbol: 'text-sm', number: 'text-2xl' },
    large: { symbol: 'text-base', number: 'text-4xl' }
  };
  
  const classes = sizeClasses[size];
  
  return (
    <div className="flex items-baseline gap-1">
      <span className={`${classes.symbol} text-slate-400 font-medium`}>{symbol}</span>
      <span className={`${classes.number} font-black`}>{number}</span>
    </div>
  );
}

export default function AssetCard({ asset, allAssets }: AssetCardProps) {
  const [electricityRate, setElectricityRate] = useState(4.0);
  
  useEffect(() => {
    getSettings().then(s => setElectricityRate(s.electricityRate));
  }, []);
  
  const details = calculateAssetDetails(asset, allAssets, electricityRate);
  
  // Icon mapping - professional Lucide icons
  const categoryIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'Tech': Laptop,
    'Music': Music,
    'Life': Home,
    'Others': Package
  };
  
  const CategoryIcon = categoryIcons[asset.category];
  
  const statusColors: { [key: string]: { bg: string; text: string } } = {
    'Active': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'Sold': { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    'Retired': { bg: 'bg-slate-500/10', text: 'text-slate-400' }
  };
  
  const statusStyle = statusColors[asset.status];
  const isSystem = asset.role === 'System' && details.children.length > 0;
  
  return (
    <Link
      to={`/assets/${asset.id}`}
      className={`
        block glass rounded-2xl p-5 card-hover border
        ${isSystem ? 'border-cyan-500/50' : 'border-slate-800'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${isSystem 
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
              : 'bg-white/5 border border-slate-800'
            }
          `}>
            {isSystem ? (
              <Server className="w-6 h-6 text-cyan-400" />
            ) : (
              <CategoryIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">{asset.name}</h3>
              {isSystem && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold uppercase tracking-widest border border-cyan-500/30">
                  System
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{getCategoryLabel(asset.category)}</span>
              {isSystem && (
                <>
                  <span className="text-slate-700">•</span>
                  <span className="text-cyan-400 font-medium">
                    {details.children.length} 個組件
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Status badge */}
        <span className={`
          text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest
          ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.text.replace('text-', 'border-')}/30
        `}>
          {getStatusLabel(asset.status)}
        </span>
      </div>
      
      {/* Daily cost - prominent display */}
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 mb-4 border border-orange-500/20">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-orange-400 font-medium uppercase tracking-wide">
                每日成本
              </span>
            </div>
            <PriceDisplay 
              amount={details.dailyCost + details.dailyElectricityCost} 
              currency={asset.currency}
              size="large"
            />
            <div className="text-xs text-slate-500 mt-1">/ 日</div>
          </div>
          
          {/* Electricity indicator */}
          {details.dailyElectricityCost > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <PriceDisplay 
                  amount={details.dailyElectricityCost} 
                  currency={asset.currency}
                  size="small"
                />
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">電費/日</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">持有天數</div>
          </div>
          <div className="text-xl font-black text-white">{details.daysOwned}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">總成本</div>
          </div>
          <PriceDisplay amount={details.totalCost} currency={asset.currency} size="default" />
        </div>
      </div>
      
      {/* Progress bar */}
      {asset.status === 'Active' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">目標進度</span>
            <span className="text-sm font-bold text-primary">
              {Math.round(details.progressPercentage)}%
            </span>
          </div>
          
          <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(100, details.progressPercentage)}%`,
                boxShadow: '0 0 10px rgba(14, 165, 233, 0.5)'
              }}
            />
          </div>
          
          {/* Status text */}
          <div className="mt-2">
            {details.remainingDays > 0 ? (
              <p className="text-xs text-slate-500">
                還需 <span className="text-white font-semibold">{details.remainingDays}</span> 天達標
              </p>
            ) : (
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>已達成目標</span>
              </p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
