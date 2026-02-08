import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset } from '../hooks/useDatabase';
import { addAsset, updateAsset } from '../db';
import type { AssetCategory, Currency, AssetStatus } from '../types';

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existingAsset = useAsset(id);
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tech' as AssetCategory,
    purchaseDate: new Date().toISOString().split('T')[0],
    price: '',
    currency: 'TWD' as Currency,
    targetLifespan: '1095', // 3年
    status: 'Active' as AssetStatus,
    notes: '',
    // v0.4.0 新增
    parentId: null as string | null,
    isComposite: false,
    powerWatts: '0',
    dailyUsageHours: '0',
    recurringMaintenanceCost: '0'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 載入現有資產資料
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
        // v0.4.0
        parentId: existingAsset.parentId,
        isComposite: existingAsset.isComposite,
        powerWatts: existingAsset.powerWatts?.toString() || '0',
        dailyUsageHours: existingAsset.dailyUsageHours?.toString() || '0',
        recurringMaintenanceCost: existingAsset.recurringMaintenanceCost?.toString() || '0'
      });
    }
  }, [existingAsset]);
  
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
        // v0.4.0 新增
        parentId: formData.parentId,
        isComposite: formData.isComposite,
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
              <p className="text-xs text-muted-foreground mt-1">
                預期使用多久？(1年 = 365天, 3年 = 1095天)
              </p>
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
