import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset } from '../hooks/useDatabase';
import { calculateAssetDetails, formatCurrency } from '../hooks/useCostCalculations';
import { deleteAsset, updateAsset } from '../db';
import { format } from 'date-fns';
import type { MaintenanceLog } from '../types';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = useAsset(id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  
  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }
  
  const details = calculateAssetDetails(asset);
  
  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteAsset(id);
      navigate('/assets');
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請重試');
    }
  };
  
  const handleAddMaintenance = async (log: Omit<MaintenanceLog, 'date'> & { date: string }) => {
    if (!id) return;
    try {
      const newLog: MaintenanceLog = {
        ...log,
        date: new Date(log.date)
      };
      await updateAsset(id, {
        maintenanceLog: [...asset.maintenanceLog, newLog]
      });
      setShowMaintenanceForm(false);
    } catch (error) {
      console.error('新增維護記錄失敗:', error);
      alert('新增失敗，請重試');
    }
  };
  
  const categoryEmoji: { [key: string]: string } = {
    'Tech': '💻',
    'Music': '🎵',
    'Life': '🏠',
    'Others': '📦'
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* 標題 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/assets')}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            ← 返回
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{categoryEmoji[asset.category]}</span>
              <div>
                <h1 className="text-3xl font-bold mb-1">{asset.name}</h1>
                <p className="text-muted-foreground">{asset.category}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/assets/${id}/edit`)}
              className="bg-secondary px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              編輯
            </button>
          </div>
        </div>
        
        {/* 每日成本大卡片 */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg p-6 mb-4">
          <div className="text-sm opacity-90 mb-2">每日成本</div>
          <div className="text-5xl font-bold mb-4">
            {formatCurrency(details.dailyCost, asset.currency)}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="opacity-75">持有天數</div>
              <div className="font-semibold">{details.daysOwned} 天</div>
            </div>
            <div>
              <div className="opacity-75">總成本</div>
              <div className="font-semibold">{formatCurrency(details.totalCost, asset.currency)}</div>
            </div>
            <div>
              <div className="opacity-75">購買價格</div>
              <div className="font-semibold">{formatCurrency(asset.price, asset.currency)}</div>
            </div>
          </div>
        </div>
        
        {/* Break-Even 進度 */}
        {asset.status === 'Active' && (
          <div className="bg-card border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">使用目標進度</h3>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>目標: {asset.targetLifespan} 天</span>
              <span>{Math.round(details.progressPercentage)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-primary to-green-500 h-full transition-all"
                style={{ width: `${Math.min(100, details.progressPercentage)}%` }}
              />
            </div>
            {details.remainingDays > 0 ? (
              <p className="text-sm text-muted-foreground">
                還需使用 <span className="font-semibold text-foreground">{details.remainingDays}</span> 天達成目標
              </p>
            ) : (
              <p className="text-sm text-green-500 font-semibold">
                ✓ 恭喜！已達成使用目標
              </p>
            )}
          </div>
        )}
        
        {/* 基本資訊 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">基本資訊</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">購買日期</span>
              <span className="font-medium">{format(asset.purchaseDate, 'yyyy-MM-dd')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">狀態</span>
              <span className="font-medium">
                {asset.status === 'Active' ? '✓ 使用中' : 
                 asset.status === 'Sold' ? '💰 已售出' : '📦 已退役'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">貨幣</span>
              <span className="font-medium">{asset.currency}</span>
            </div>
            {asset.soldPrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">售出價格</span>
                <span className="font-medium">{formatCurrency(asset.soldPrice, asset.currency)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 備註 */}
        {asset.notes && (
          <div className="bg-card border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">備註</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{asset.notes}</p>
          </div>
        )}
        
        {/* 維護記錄 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">維護記錄</h3>
            <button
              onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
              className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:opacity-90 transition-opacity"
            >
              {showMaintenanceForm ? '取消' : '＋ 新增'}
            </button>
          </div>
          
          {/* 新增維護記錄表單 */}
          {showMaintenanceForm && (
            <MaintenanceForm onSubmit={handleAddMaintenance} />
          )}
          
          {/* 維護記錄列表 */}
          {asset.maintenanceLog.length > 0 ? (
            <div className="space-y-3">
              {asset.maintenanceLog
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log, index) => (
                  <div key={index} className="border-l-2 border-primary pl-3 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">{log.note}</span>
                      <span className="text-sm font-semibold text-orange-500">
                        {formatCurrency(log.cost, asset.currency)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(log.date, 'yyyy-MM-dd')}
                    </span>
                  </div>
                ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">維護總成本</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0),
                      asset.currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              尚無維護記錄
            </p>
          )}
        </div>
        
        {/* 刪除按鈕 */}
        <div className="bg-card border border-red-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-red-500 mb-2">危險操作</h3>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              刪除資產
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">確定要刪除此資產嗎？此操作無法復原。</p>
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

// 維護記錄表單組件
function MaintenanceForm({ onSubmit }: { 
  onSubmit: (log: { date: string; note: string; cost: number }) => void 
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
    cost: ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: formData.date,
      note: formData.note,
      cost: parseFloat(formData.cost)
    });
    setFormData({
      date: new Date().toISOString().split('T')[0],
      note: '',
      cost: ''
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-secondary/50 rounded-lg p-3 mb-3 space-y-2">
      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
        className="w-full bg-background border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="text"
        placeholder="維護項目 (例如：更換電池)"
        value={formData.note}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        required
        className="w-full bg-background border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="number"
        placeholder="維護成本"
        value={formData.cost}
        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
        min="0"
        step="0.01"
        required
        className="w-full bg-background border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground px-3 py-2 rounded text-sm hover:opacity-90 transition-opacity"
      >
        新增維護記錄
      </button>
    </form>
  );
}
