import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { calculateAssetDetails, formatCurrency } from '../hooks/useCostCalculations';
import { getCategoryLabel, getStatusLabel } from '../utils/costCalculations';
import { getSettings } from '../db';
import type { PhysicalAsset } from '../types';

interface AssetCardProps {
  asset: PhysicalAsset;
  allAssets: PhysicalAsset[];
}

export default function AssetCard({ asset, allAssets }: AssetCardProps) {
  const [electricityRate, setElectricityRate] = useState(4.0);
  
  useEffect(() => {
    getSettings().then(s => setElectricityRate(s.electricityRate));
  }, []);
  
  const details = calculateAssetDetails(asset, allAssets, electricityRate);
  
  const categoryEmoji: { [key: string]: string } = {
    'Tech': '💻',
    'Music': '🎵',
    'Life': '🏠',
    'Others': '📦'
  };
  
  const statusColor: { [key: string]: string } = {
    'Active': 'text-emerald-400 bg-emerald-500/10',
    'Sold': 'text-blue-400 bg-blue-500/10',
    'Retired': 'text-slate-400 bg-slate-500/10'
  };
  
  // Composite asset gets special styling
  const isComposite = asset.isComposite && details.children.length > 0;
  
  return (
    <Link
      to={`/assets/${asset.id}`}
      className={`
        block glass rounded-2xl p-5 card-hover
        ${isComposite ? 'border-l-4 border-cyan-500' : 'border border-white/10'}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon with special treatment for composite */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${isComposite 
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
              : 'bg-white/5'
            }
          `}>
            {isComposite ? '📦' : categoryEmoji[asset.category]}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">{asset.name}</h3>
              {isComposite && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold uppercase tracking-wider">
                  System
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400">{getCategoryLabel(asset.category)}</p>
              {isComposite && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-cyan-400 font-medium">
                    {details.children.length} 個組件
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Status badge */}
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${statusColor[asset.status]}`}>
          {getStatusLabel(asset.status)}
        </span>
      </div>
      
      {/* Daily cost - HUGE and prominent */}
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 mb-4 border border-orange-500/20">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-orange-400 mb-1 uppercase tracking-wide font-medium">
              每日成本
            </div>
            <div className="text-3xl font-black text-orange-400">
              {formatCurrency(details.dailyCost + details.dailyElectricityCost, asset.currency).replace('NT$', '')}
            </div>
            <div className="text-xs text-slate-500 mt-1">NT$ / 日</div>
          </div>
          
          {/* Electricity indicator */}
          {details.dailyElectricityCost > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-yellow-400 mb-1">
                <span>⚡</span>
                <span>{formatCurrency(details.dailyElectricityCost, asset.currency)}</span>
              </div>
              <div className="text-[10px] text-slate-500">電費/日</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">持有天數</div>
          <div className="text-xl font-bold text-white">{details.daysOwned}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">總成本</div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(details.totalCost, asset.currency).replace('NT$', '')}
          </div>
        </div>
      </div>
      
      {/* Progress bar - sleek design */}
      {asset.status === 'Active' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">目標進度</span>
            <span className="text-sm font-bold text-primary">
              {Math.round(details.progressPercentage)}%
            </span>
          </div>
          
          <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            {/* Animated gradient bar */}
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
                <span>✓</span>
                <span>已達成目標</span>
              </p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
