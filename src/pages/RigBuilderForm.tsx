import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addAsset } from '../db';
import type { AssetCategory, Currency } from '../types';
import { ArrowLeft, Plus, Trash2, Server } from 'lucide-react';

interface ComponentEntry {
  id: string;
  name: string;
  price: string;
  targetLifespan: string;
}

export default function RigBuilderForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // System 基本资料
  const [systemData, setSystemData] = useState({
    name: '',
    category: 'Tech' as AssetCategory,
    purchaseDate: new Date().toISOString().split('T')[0],
    currency: 'TWD' as Currency,
    targetLifespan: '1095', // 3年
    notes: '',
    powerWatts: '0',
    dailyUsageHours: '0',
    recurringMaintenanceCost: '0'
  });
  
  // Components 列表
  const [components, setComponents] = useState<ComponentEntry[]>([
    { id: crypto.randomUUID(), name: '', price: '', targetLifespan: '1095' }
  ]);
  
  const handleAddComponent = () => {
    setComponents([
      ...components,
      { id: crypto.randomUUID(), name: '', price: '', targetLifespan: systemData.targetLifespan }
    ]);
  };
  
  const handleRemoveComponent = (id: string) => {
    if (components.length > 1) {
      setComponents(components.filter(c => c.id !== id));
    }
  };
  
  const handleComponentChange = (id: string, field: keyof ComponentEntry, value: string) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 验证：至少有一个组件有名称
      const validComponents = components.filter(c => c.name.trim() !== '');
      if (validComponents.length === 0) {
        alert('请至少添加一个组件');
        setIsSubmitting(false);
        return;
      }
      
      // 1. 创建 System
      const systemId = await addAsset({
        name: systemData.name,
        category: systemData.category,
        purchaseDate: new Date(systemData.purchaseDate),
        price: 0, // System 的价格会从组件自动计算
        currency: systemData.currency,
        targetLifespan: parseInt(systemData.targetLifespan),
        status: 'Active',
        notes: systemData.notes,
        maintenanceLog: [],
        role: 'System',
        systemId: null,
        linkedAssetId: null,
        powerWatts: parseFloat(systemData.powerWatts),
        dailyUsageHours: parseFloat(systemData.dailyUsageHours),
        recurringMaintenanceCost: parseFloat(systemData.recurringMaintenanceCost)
      });
      
      // 2. 创建所有 Components
      for (const comp of validComponents) {
        await addAsset({
          name: comp.name,
          category: systemData.category, // 继承 System 的分类
          purchaseDate: new Date(systemData.purchaseDate),
          price: parseFloat(comp.price) || 0,
          currency: systemData.currency,
          targetLifespan: parseInt(comp.targetLifespan),
          status: 'Active',
          notes: '',
          maintenanceLog: [],
          role: 'Component',
          systemId: systemId,
          linkedAssetId: null,
          powerWatts: 0,
          dailyUsageHours: 0,
          recurringMaintenanceCost: 0
        });
      }
      
      // 导航到系统详情页
      navigate(`/assets/${systemId}`);
    } catch (error) {
      console.error('创建系统失败:', error);
      alert('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 计算总价
  const totalPrice = components.reduce((sum, c) => {
    const price = parseFloat(c.price) || 0;
    return sum + price;
  }, 0);
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* 标题 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Server className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">组装系统</h1>
              <p className="text-slate-400 text-sm">批量建立系统与组件</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: 系统基本资料 */}
          <div className="glass rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span>
              系统资料
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  系统名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={systemData.name}
                  onChange={(e) => setSystemData({ ...systemData, name: e.target.value })}
                  placeholder="例如：游戏主机、Orange Pi 集群"
                  className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">分类</label>
                  <select
                    value={systemData.category}
                    onChange={(e) => setSystemData({ ...systemData, category: e.target.value as AssetCategory })}
                    className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Tech">科技</option>
                    <option value="Music">音乐</option>
                    <option value="Life">生活</option>
                    <option value="Others">其他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">购买日期</label>
                  <input
                    type="date"
                    value={systemData.purchaseDate}
                    onChange={(e) => setSystemData({ ...systemData, purchaseDate: e.target.value })}
                    className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">币别</label>
                  <select
                    value={systemData.currency}
                    onChange={(e) => setSystemData({ ...systemData, currency: e.target.value as Currency })}
                    className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="TWD">新台币 (NT$)</option>
                    <option value="USD">美元 ($)</option>
                    <option value="JPY">日元 (¥)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">目标寿命（天）</label>
                  <input
                    type="number"
                    value={systemData.targetLifespan}
                    onChange={(e) => setSystemData({ ...systemData, targetLifespan: e.target.value })}
                    className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">备注（选填）</label>
                <textarea
                  value={systemData.notes}
                  onChange={(e) => setSystemData({ ...systemData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Step 2: 组件列表 */}
          <div className="glass rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
              组件列表
            </h2>
            
            <div className="space-y-3 mb-4">
              {components.map((comp, index) => (
                <div key={comp.id} className="bg-white/5 rounded-lg p-4 border border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleComponentChange(comp.id, 'name', e.target.value)}
                        placeholder={`组件 ${index + 1} 名称（例如：RAM 16GB、CPU i5）`}
                        className="w-full bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={comp.price}
                          onChange={(e) => handleComponentChange(comp.id, 'price', e.target.value)}
                          placeholder="价格"
                          className="w-full bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="number"
                          value={comp.targetLifespan}
                          onChange={(e) => handleComponentChange(comp.id, 'targetLifespan', e.target.value)}
                          placeholder="寿命（天）"
                          className="w-full bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    
                    {components.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(comp.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={handleAddComponent}
              className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>新增组件</span>
            </button>
            
            {/* 总价显示 */}
            <div className="mt-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">系统总价</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-slate-400">NT$</span>
                  <span className="text-2xl font-black text-cyan-400">{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 3: 电力规格（选填）*/}
          <div className="glass rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">3</span>
              电力规格（选填）
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">功率（瓦）</label>
                <input
                  type="number"
                  value={systemData.powerWatts}
                  onChange={(e) => setSystemData({ ...systemData, powerWatts: e.target.value })}
                  placeholder="0"
                  className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">每日使用时数</label>
                <input
                  type="number"
                  value={systemData.dailyUsageHours}
                  onChange={(e) => setSystemData({ ...systemData, dailyUsageHours: e.target.value })}
                  placeholder="0"
                  className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">年度维护成本</label>
              <input
                type="number"
                value={systemData.recurringMaintenanceCost}
                onChange={(e) => setSystemData({ ...systemData, recurringMaintenanceCost: e.target.value })}
                placeholder="0"
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">例如：散热膏、定期保养等固定支出</p>
            </div>
          </div>
          
          {/* 提交按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-white/5 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? '创建中...' : '创建系统'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
