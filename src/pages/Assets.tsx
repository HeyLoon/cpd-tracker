import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllAssets } from '../hooks/useDatabase';
import AssetCard from '../components/AssetCard';
import type { AssetStatus, AssetCategory } from '../types';

export default function Assets() {
  const assets = useAllAssets();
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'All'>('All');
  
  const isLoading = !assets;
  
  // 過濾資產
  const filteredAssets = assets?.filter(asset => {
    if (statusFilter !== 'All' && asset.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && asset.category !== categoryFilter) return false;
    return true;
  }) || [];
  
  // 統計
  const stats = {
    total: assets?.length || 0,
    active: assets?.filter(a => a.status === 'Active').length || 0,
    sold: assets?.filter(a => a.status === 'Sold').length || 0,
    retired: assets?.filter(a => a.status === 'Retired').length || 0
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* 標題與新增按鈕 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">資產管理</h1>
            <p className="text-muted-foreground">管理你的實體資產與設備</p>
          </div>
          <Link
            to="/assets/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            ＋ 新增
          </Link>
        </div>
        
        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">總計</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <div className="text-xs text-muted-foreground">使用中</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.sold}</div>
            <div className="text-xs text-muted-foreground">已售出</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.retired}</div>
            <div className="text-xs text-muted-foreground">已退役</div>
          </div>
        </div>
        
        {/* 篩選器 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <div className="space-y-3">
            {/* 狀態篩選 */}
            <div>
              <label className="text-sm font-medium mb-2 block">狀態</label>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Active', 'Sold', 'Retired'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as AssetStatus | 'All')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {status === 'All' ? '全部' : 
                     status === 'Active' ? '使用中' : 
                     status === 'Sold' ? '已售出' : '已退役'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 分類篩選 */}
            <div>
              <label className="text-sm font-medium mb-2 block">分類</label>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Tech', 'Music', 'Life', 'Others'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category as AssetCategory | 'All')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      categoryFilter === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {category === 'All' ? '全部' :
                     category === 'Tech' ? '💻 科技' :
                     category === 'Music' ? '🎵 音樂' :
                     category === 'Life' ? '🏠 生活' : '📦 其他'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 資產列表 */}
        {filteredAssets.length > 0 ? (
          <div className="space-y-3">
            {filteredAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} allAssets={assets || []} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg p-8 border text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="font-semibold mb-2">
              {assets.length === 0 ? '還沒有任何資產' : '沒有符合條件的資產'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {assets.length === 0 
                ? '新增你的第一個資產，開始追蹤每日成本'
                : '試著調整篩選條件'}
            </p>
            {assets.length === 0 && (
              <Link
                to="/assets/new"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                新增資產
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
