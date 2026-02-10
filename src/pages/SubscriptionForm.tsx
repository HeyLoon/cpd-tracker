import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSubscription } from '../hooks/useDatabase';
import { addSubscription, updateSubscription } from '../db';
import type { SubscriptionCategory, Currency, SubscriptionStatus, BillingCycle } from '../types';

export default function SubscriptionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existingSubscription = useSubscription(id);
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Software' as SubscriptionCategory,
    billingCycle: 'Monthly' as BillingCycle,
    cost: '',
    currency: 'TWD' as Currency,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active' as SubscriptionStatus,
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 載入現有訂閱資料
  useEffect(() => {
    if (existingSubscription) {
      setFormData({
        name: existingSubscription.name,
        category: existingSubscription.category,
        billingCycle: existingSubscription.billingCycle,
        cost: existingSubscription.cost.toString(),
        currency: existingSubscription.currency,
        startDate: new Date(existingSubscription.startDate).toISOString().split('T')[0],
        status: existingSubscription.status,
        notes: existingSubscription.notes || ''
      });
    }
  }, [existingSubscription]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const subscriptionData = {
        name: formData.name,
        category: formData.category,
        billingCycle: formData.billingCycle,
        cost: parseFloat(formData.cost),
        currency: formData.currency,
        startDate: new Date(formData.startDate),
        status: formData.status,
        notes: formData.notes,
        cancelledDate: existingSubscription?.cancelledDate
      };
      
      if (isEditing && id) {
        await updateSubscription(id, subscriptionData);
      } else {
        await addSubscription(subscriptionData);
      }
      
      navigate('/subscriptions');
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
          <h1 className="text-3xl font-bold mb-2">
            {isEditing ? '編輯訂閱' : '新增訂閱'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? '更新訂閱資訊' : '記錄你的新訂閱服務'}
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
                服務名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="例如：Netflix、Spotify"
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
                <option value="Software">💻 軟體</option>
                <option value="Service">🔧 服務</option>
                <option value="Entertainment">🎬 娛樂</option>
              </select>
            </div>
            
            {/* 開始日期 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                開始訂閱日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          {/* 費用資訊 */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold mb-3">費用資訊</h3>
            
            {/* 計費週期 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                計費週期 <span className="text-red-500">*</span>
              </label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className="w-full bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Monthly">每月</option>
                <option value="Yearly">每年</option>
              </select>
            </div>
            
            {/* 費用與貨幣 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  費用 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
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
            
            {/* 每日成本預覽 */}
            {formData.cost && (
              <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-400 mb-1">預估每日成本</div>
                <div className="text-2xl font-bold text-purple-500">
                  {formData.billingCycle === 'Monthly' 
                    ? `≈ NT$${(parseFloat(formData.cost) / 30).toFixed(2)}`
                    : `≈ NT$${(parseFloat(formData.cost) / 365).toFixed(2)}`}
                </div>
              </div>
            )}
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
                <option value="Active">訂閱中</option>
                <option value="Cancelled">已取消</option>
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
              onClick={() => navigate('/subscriptions')}
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
