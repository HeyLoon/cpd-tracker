import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset, useAllAssets } from '../hooks/useDatabase';
import { calculateAssetDetails, formatCurrency } from '../hooks/useCostCalculations';
import { deleteAsset, updateAsset, getSettings } from '../db';
import { format } from 'date-fns';
import type { MaintenanceLog } from '../types';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Server, 
  Cpu, 
  Zap,
  Link as LinkIcon,
  ChevronRight
} from 'lucide-react';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = useAsset(id);
  const allAssets = useAllAssets() || [];
  const [electricityRate, setElectricityRate] = useState(4.0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  
  useEffect(() => {
    getSettings().then(s => setElectricityRate(s.electricityRate));
  }, []);
  
  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }
  
  const details = calculateAssetDetails(asset, allAssets, electricityRate);
  
  // v0.5.0: 分开 Components 和 Accessories
  const components = details.children.filter(c => c.role === 'Component');
  const accessories = details.children.filter(c => c.role === 'Accessory');
  
  // 計算組件總價（用於 System）
  const componentsTotalPrice = components.reduce((sum, c) => sum + c.price, 0);
  
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
    <div className="min-h-screen bg-background pb-20 pt-12">
      <div className="max-w-2xl mx-auto p-4">
        {/* 标题 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/assets')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* System 特殊图标 */}
              {asset.role === 'System' ? (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Server className="w-7 h-7 text-cyan-400" />
                </div>
              ) : (
                <span className="text-5xl">{categoryEmoji[asset.category]}</span>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold">{asset.name}</h1>
                  {asset.role === 'System' && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold uppercase tracking-widest border border-cyan-500/30">
                      System
                    </span>
                  )}
                </div>
                <p className="text-slate-400">{asset.category}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/assets/${id}/edit`)}
              className="flex items-center gap-2 bg-white/5 border border-slate-800 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>編輯</span>
            </button>
          </div>
        </div>
        
        {/* 每日成本大卡片 */}
        <div className="glass rounded-2xl p-6 mb-4 border border-slate-800 bg-gradient-to-br from-orange-500/10 to-red-500/10">
          <div className="flex items-center gap-2 text-orange-400 mb-2 text-sm uppercase tracking-wide font-medium">
            <Zap className="w-4 h-4" />
            <span>每日成本</span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl text-slate-400">NT$</span>
            <span className="text-6xl font-black">{Math.round(details.dailyCost + details.dailyElectricityCost).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500 mb-1">持有天数</div>
              <div className="font-semibold text-white">{details.daysOwned} 天</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">总成本</div>
              <div className="font-semibold text-white">{formatCurrency(details.totalCost, asset.currency)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">
                {asset.role === 'System' ? '組件總價' : '購買價格'}
              </div>
              <div className="font-semibold text-white">
                {asset.role === 'System' 
                  ? formatCurrency(componentsTotalPrice, asset.currency)
                  : formatCurrency(asset.price, asset.currency)
                }
              </div>
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
        
        {/* v0.4.0 新增：電力規格 */}
        {(asset.powerWatts > 0 || asset.dailyUsageHours > 0 || asset.recurringMaintenanceCost > 0) && (
          <div className="bg-card border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">⚡ 電力與維護</h3>
            <div className="space-y-2 text-sm">
              {asset.powerWatts > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">功率</span>
                  <span className="font-medium">{asset.powerWatts} W</span>
                </div>
              )}
              {asset.dailyUsageHours > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">每日使用</span>
                  <span className="font-medium">{asset.dailyUsageHours} 小時</span>
                </div>
              )}
              {details.dailyElectricityCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">預估電費</span>
                  <span className="font-medium text-orange-500">
                    {formatCurrency(details.dailyElectricityCost * 30, asset.currency)} / 月
                  </span>
                </div>
              )}
              {asset.recurringMaintenanceCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">年度維護</span>
                  <span className="font-medium">
                    {formatCurrency(asset.recurringMaintenanceCost, asset.currency)} / 年
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* v0.5.0 新增：內部組件列表（僅 System 顯示）*/}
        {asset.role === 'System' && (
          <div className="glass rounded-2xl p-6 mb-4 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-lg">內部組件</h3>
              </div>
              <button
                onClick={() => navigate(`/assets/new?parent=${asset.id}`)}
                className="flex items-center gap-2 text-sm bg-cyan-500/20 text-cyan-400 px-3 py-2 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
              >
                <Plus className="w-4 h-4" />
                <span>新增組件</span>
              </button>
            </div>
            
            {components.length > 0 ? (
              <div className="space-y-2">
                {components.map(child => (
                  <div 
                    key={child.id}
                    onClick={() => navigate(`/assets/${child.id}`)}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-slate-800 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-medium">{child.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatCurrency(child.price, child.currency)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">組件總價值</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-slate-400">NT$</span>
                      <span className="text-2xl font-black text-cyan-400">
                        {componentsTotalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-1">尚未添加任何組件</p>
                <p className="text-xs">點擊上方「新增組件」按鈕開始組裝</p>
              </div>
            )}
          </div>
        )}
        
        {/* v0.5.0 新增：外接配件列表 */}
        {accessories.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-lg">外接配件</h3>
            </div>
            
            <div className="space-y-2">
              {accessories.map(accessory => (
                <div 
                  key={accessory.id}
                  onClick={() => navigate(`/assets/${accessory.id}`)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <LinkIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium">{accessory.name}</div>
                      <div className="text-xs text-slate-500">
                        {formatCurrency(accessory.price, accessory.currency)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
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
        <div className="glass rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-red-400">危险操作</h3>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500/10 text-red-400 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30"
            >
              刪除資產
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-slate-300 mb-2">確定要刪除此資產嗎？此操作無法撤銷。</p>
                {asset.role === 'System' && components.length > 0 && (
                  <p className="text-xs text-red-400 font-medium">
                    ⚠️ 警告：此系統包含 {components.length} 個組件，刪除後所有組件也會一併刪除。
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white/5 border border-slate-700 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
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
