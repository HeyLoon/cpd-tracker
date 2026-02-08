// 測試資料生成腳本
// 在瀏覽器 Console 中執行此腳本來新增測試資料

import { db } from './db';

export async function seedTestData() {
  console.log('🌱 開始新增測試資料...');
  
  // 清空現有資料
  await db.assets.clear();
  await db.subscriptions.clear();
  
  // 新增測試資產（v0.5.0 角色系統）
  const serverId = crypto.randomUUID();
  const assets = [
    {
      id: serverId,
      name: 'Orange Pi 5 Plus 主機',
      category: 'Tech' as const,
      purchaseDate: new Date('2024-01-15'),
      price: 3500,
      currency: 'TWD' as const,
      maintenanceLog: [
        {
          date: new Date('2024-06-10'),
          note: '更換散熱膏',
          cost: 200
        }
      ],
      targetLifespan: 1095, // 3年
      status: 'Active' as const,
      notes: '用來跑各種服務的小主機',
      // v0.5.0
      role: 'System' as const,
      systemId: null,
      linkedAssetId: null,
      powerWatts: 15,
      dailyUsageHours: 24,
      recurringMaintenanceCost: 300
    },
    {
      id: crypto.randomUUID(),
      name: '記憶體 16GB DDR5',
      category: 'Tech' as const,
      purchaseDate: new Date('2024-01-15'),
      price: 1200,
      currency: 'TWD' as const,
      maintenanceLog: [],
      targetLifespan: 1095,
      status: 'Active' as const,
      notes: '',
      // v0.5.0
      role: 'Component' as const,
      systemId: serverId,
      linkedAssetId: null,
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      id: crypto.randomUUID(),
      name: 'Yamaha F310 吉他',
      category: 'Music' as const,
      purchaseDate: new Date('2023-08-20'),
      price: 4500,
      currency: 'TWD' as const,
      maintenanceLog: [
        {
          date: new Date('2024-01-05'),
          note: '更換琴弦',
          cost: 350
        }
      ],
      targetLifespan: 3650, // 10年
      status: 'Active' as const,
      notes: '初學者練習吉他',
      // v0.5.0
      role: 'Standalone' as const,
      systemId: null,
      linkedAssetId: null,
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 500
    },
    {
      id: crypto.randomUUID(),
      name: 'MacBook Pro M1',
      category: 'Tech' as const,
      purchaseDate: new Date('2022-03-10'),
      price: 45000,
      currency: 'TWD' as const,
      maintenanceLog: [],
      targetLifespan: 1825, // 5年
      status: 'Active' as const,
      notes: '主力開發機器',
      // v0.5.0
      role: 'Standalone' as const,
      systemId: null,
      linkedAssetId: null,
      powerWatts: 30,
      dailyUsageHours: 10,
      recurringMaintenanceCost: 0
    }
  ];
  
  await db.assets.bulkAdd(assets);
  console.log(`✅ 新增了 ${assets.length} 個資產`);
  
  // 新增測試訂閱
  const subscriptions = [
    {
      id: crypto.randomUUID(),
      name: 'Spotify Premium',
      billingCycle: 'Monthly' as const,
      cost: 149,
      currency: 'TWD' as const,
      startDate: new Date('2023-01-01'),
      category: 'Entertainment' as const,
      status: 'Active' as const,
      notes: '音樂串流服務'
    },
    {
      id: crypto.randomUUID(),
      name: 'Vultr VPS',
      billingCycle: 'Monthly' as const,
      cost: 180,
      currency: 'TWD' as const,
      startDate: new Date('2023-06-15'),
      category: 'Service' as const,
      status: 'Active' as const,
      notes: '用來跑網站的 VPS'
    },
    {
      id: crypto.randomUUID(),
      name: 'ChatGPT Plus',
      billingCycle: 'Monthly' as const,
      cost: 600,
      currency: 'TWD' as const,
      startDate: new Date('2024-01-01'),
      category: 'Software' as const,
      status: 'Active' as const,
      notes: 'AI 助手訂閱'
    },
    {
      id: crypto.randomUUID(),
      name: 'Netflix',
      billingCycle: 'Monthly' as const,
      cost: 390,
      currency: 'TWD' as const,
      startDate: new Date('2022-09-01'),
      category: 'Entertainment' as const,
      status: 'Active' as const,
      notes: '影片串流服務'
    }
  ];
  
  await db.subscriptions.bulkAdd(subscriptions);
  console.log(`✅ 新增了 ${subscriptions.length} 個訂閱`);
  
  console.log('🎉 測試資料新增完成！重新整理頁面即可看到結果。');
}

// 在瀏覽器 Console 執行：
// import('./seed').then(m => m.seedTestData())
