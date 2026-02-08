import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAsset, useAllAssets } from '../hooks/useDatabase';
import { addAsset, updateAsset, getSettings } from '../db';
import { calculateMonthlyElectricityCost } from '../utils/costCalculations';
import type { AssetCategory, Currency, AssetStatus } from '../types';

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingAsset = useAsset(id);
  const allAssets = useAllAssets() || [];
  const isEditing = !!id;
  
  // 從 URL 取得父資產 ID（用於「新增組件」流程）
  const parentIdFromUrl = searchParams.get('parent');
  
  // 電費單價
  const [electricityRate, setElectricityRate] = useState(4.0);
  
  useEffect(() => {
    getSettings().then(s => setElectricityRate(s.electricityRate));
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tech' as AssetCategory,
    purchaseDate: new Date().toISOString().split('T')[0],
    price: '',
    currency: 'TWD' as Currency,
    targetLifespan: '1095', // 3年
    status: 'Active' as AssetStatus,
    notes: '',
    // v0.5.0 角色系統
    role: 'Standalone' as 'Standalone' | 'System' | 'Component' | 'Accessory',
    systemId: null as string | null,
    linkedAssetId: null as string | null,
    powerWatts: '0',
    dailyUsageHours: '0',
    recurringMaintenanceCost: '0'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 載入現有資產資料 或 從 URL 預填父資產
  useEffect(() => {
    if (existingAsset) {
      setFormData({
        name: existingAsset.name,
        category: existingAsset.category,
        purchaseDate: new Date(existingAsset.purchaseDate).toISOString().split('T')[0],
        price: existingAsset.price.toString(),
        currency: existingAsset.currency,
        targetLifespan: existingAsset.targetLifespan.toString(),
        status: existingAsset.status,
        notes: existingAsset.notes || '',
        // v0.5.0
        role: existingAsset.role || 'Standalone',
        systemId: existingAsset.systemId || null,
        linkedAssetId: existingAsset.linkedAssetId || null,
        powerWatts: existingAsset.powerWatts?.toString() || '0',
        dailyUsageHours: existingAsset.dailyUsageHours?.toString() || '0',
        recurringMaintenanceCost: existingAsset.recurringMaintenanceCost?.toString() || '0'
      });
    } else if (parentIdFromUrl) {
      // 新增組件時，自動填入父資產
      setFormData(prev => ({ ...prev, role: 'Component', systemId: parentIdFromUrl }));
    }
  }, [existingAsset, parentIdFromUrl]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const assetData = {
        name: formData.name,
        category: formData.category,
        purchaseDate: new Date(formData.purchaseDate),
        price: parseFloat(formData.price),
        currency: formData.currency,
        targetLifespan: parseInt(formData.targetLifespan),
        status: formData.status,
        notes: formData.notes,
        maintenanceLog: existingAsset?.maintenanceLog || [],
        soldPrice: existingAsset?.soldPrice,
        // v0.5.0 角色系統
        role: formData.role,
        systemId: formData.systemId,
        linkedAssetId: formData.linkedAssetId,
        powerWatts: parseFloat(formData.powerWatts),
        dailyUsageHours: parseFloat(formData.dailyUsageHours),
        recurringMaintenanceCost: parseFloat(formData.recurringMaintenanceCost)
      };
      
      if (isEditing && id) {
        await updateAsset(id, assetData);
      } else {
        await addAsset(assetData);
      }
      
      navigate('/assets');
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <h1 className="text-3xl font-bold mb-2">
            {isEditing ? '編輯資產' : '新增資產'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? '更新資產資訊' : '記錄你的新資產'}
          </p>
        </div>
        
        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本資訊 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">基本資訊</h3>
            
            {/* 名稱 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="例如：MacBook Pro M1"
                required
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            {/* 分類 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                分類 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Tech">💻 科技</option>
                <option value="Music">🎵 音樂</option>
                <option value="Life">🏠 生活</option>
                <option value="Others">📦 其他</option>
              </select>
            </div>
            
            {/* 購買日期 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                購買日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                required
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          {/* 成本資訊 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">成本資訊</h3>
            
            {/* 價格與貨幣 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  購買價格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">貨幣</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="TWD">TWD</option>
                  <option value="USD">USD</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>
            
            {/* 目標使用期限 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                目標使用天數 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="targetLifespan"
                value={formData.targetLifespan}
                onChange={handleChange}
                min="1"
                required
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              {/* 智能建議：根據價格和每日成本 */}
              {formData.price && parseFloat(formData.price) > 0 && (
                <div className="mt-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-blue-400">💡 智能建議</span>
                    <span className="text-xs text-muted-foreground">
                      根據你願意承擔的每日成本
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const price = parseFloat(formData.price);
                      // 根據價格範圍動態生成建議選項
                      let dailyCostOptions: number[] = [];
                      
                      if (price < 1000) {
                        // 低價商品：NT$5, 10, 20, 30
                        dailyCostOptions = [5, 10, 20, 30];
                      } else if (price < 5000) {
                        // 中低價：NT$10, 20, 30, 50
                        dailyCostOptions = [10, 20, 30, 50];
                      } else if (price < 20000) {
                        // 中價：NT$20, 30, 50, 100
                        dailyCostOptions = [20, 30, 50, 100];
                      } else if (price < 50000) {
                        // 中高價：NT$30, 50, 100, 150
                        dailyCostOptions = [30, 50, 100, 150];
                      } else {
                        // 高價：NT$50, 100, 200, 300
                        dailyCostOptions = [50, 100, 200, 300];
                      }
                      
                      return dailyCostOptions.map(dailyCost => {
                        const suggestedDays = Math.round(price / dailyCost);
                        const years = (suggestedDays / 365).toFixed(1);
                        const isSelected = formData.targetLifespan === suggestedDays.toString();
                        
                        return (
                          <button
                            key={dailyCost}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, targetLifespan: suggestedDays.toString() }))}
                            className={`relative overflow-hidden text-left p-3 rounded-lg transition-all ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary' 
                                : 'bg-card hover:bg-accent border'
                            }`}
                          >
                            <div className="text-xs opacity-70 mb-1">每天願付</div>
                            <div className="text-lg font-bold">NT${dailyCost}</div>
                            <div className="text-xs opacity-70 mt-1">
                              = {suggestedDays} 天 ({years} 年)
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                  
                  <div className="mt-3 text-xs text-center text-muted-foreground">
                    點擊卡片即可自動填入建議天數
                  </div>
                </div>
              )}
              
              {!formData.price && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 填寫購買價格後，會顯示智能建議
                </p>
              )}
            </div>
          </div>
          
          {/* v0.5.0 新增：資產角色設定 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">🔧 資產角色</h3>
            
            {/* 角色選擇器 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                資產類型
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  role: e.target.value as any,
                  // 重置相關欄位
                  systemId: e.target.value === 'Component' ? prev.systemId : null,
                  linkedAssetId: e.target.value === 'Accessory' ? prev.linkedAssetId : null
                }))}
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Standalone">獨立資產（一般物品）</option>
                <option value="System">系統（可包含多個組件）</option>
                <option value="Component">內部組件（屬於某個系統）</option>
                <option value="Accessory">外接配件（可連結資產）</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                選擇此資產的角色類型
              </p>
            </div>
            
            {/* Component: 選擇所屬系統 */}
            {formData.role === 'Component' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  所屬系統 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.systemId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemId: e.target.value || null }))}
                  className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">請選擇系統</option>
                  {allAssets
                    .filter(a => a.role === 'System' && a.id !== id)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  此組件屬於哪個系統（例如：RAM 屬於主機）
                </p>
              </div>
            )}
            
            {/* Accessory: 選擇連結資產 */}
            {formData.role === 'Accessory' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  連結資產（選填）
                </label>
                <select
                  value={formData.linkedAssetId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedAssetId: e.target.value || null }))}
                  className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">無（獨立配件）</option>
                  {allAssets
                    .filter(a => (a.role === 'Standalone' || a.role === 'System') && a.id !== id)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  可選擇連結到某個資產（例如：USB Hub 連結到筆電）
                </p>
              </div>
            )}
          </div>
          
          {/* v0.4.0 新增：電力規格 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">⚡ 電力規格（選填）</h3>
            <p className="text-xs text-muted-foreground -mt-2 mb-3">
              用於計算電費成本。如果這是零件，可以留空（電費會計入父資產）
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* 功率 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  功率（瓦特 W）
                </label>
                <input
                  type="number"
                  name="powerWatts"
                  value={formData.powerWatts}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  例：筆電 30W，伺服器 100W
                </p>
              </div>
              
              {/* 每日使用時數 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  每日使用時數
                </label>
                <input
                  type="number"
                  name="dailyUsageHours"
                  value={formData.dailyUsageHours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  例：24 小時不關機，或 8 小時
                </p>
              </div>
            </div>
            
            {/* 預估電費顯示 */}
            {parseFloat(formData.powerWatts) > 0 && parseFloat(formData.dailyUsageHours) > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="text-sm font-medium text-orange-400">
                  💰 預估電費
                </div>
                <div className="text-2xl font-bold text-orange-500 mt-1">
                  NT${Math.round(calculateMonthlyElectricityCost(
                    parseFloat(formData.powerWatts),
                    parseFloat(formData.dailyUsageHours),
                    electricityRate
                  ))} / 月
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  基於 {electricityRate} 元/度的電價計算
                </p>
              </div>
            )}
          </div>
          
          {/* v0.4.0 新增：經常性維護成本 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">🔧 經常性維護（選填）</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                年度維護成本（NT$）
              </label>
              <input
                type="number"
                name="recurringMaintenanceCost"
                value={formData.recurringMaintenanceCost}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="1"
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                預估一年需要花多少錢維護？例如：散熱膏、琴弦、保養費等
              </p>
              {parseFloat(formData.recurringMaintenanceCost) > 0 && (
                <p className="text-xs text-green-500 mt-2">
                  ≈ NT${Math.round(parseFloat(formData.recurringMaintenanceCost) / 12)} / 月
                </p>
              )}
            </div>
          </div>
          
          {/* 狀態 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">狀態</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">目前狀態</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Active">使用中</option>
                <option value="Sold">已售出</option>
                <option value="Retired">已退役</option>
              </select>
            </div>
          </div>
          
          {/* 備註 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">備註</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">備註 (選填)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="記錄一些額外資訊..."
                rows={3}
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
          
          {/* 按鈕 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="flex-1 bg-secondary text-foreground px-4 py-3 rounded-lg hover:bg-secondary/80 transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '儲存中...' : isEditing ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
