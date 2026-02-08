/**
 * 完整測試資料生成器
 * 用於驗證 v0.5.0 架構的所有功能：
 * - System + Components 批次創建
 * - Accessory 連結關係
 * - Standalone 資產
 * - 訂閱服務
 */

import { db } from './db';
import type { PhysicalAsset, Subscription } from './types';

/**
 * 清除所有現有資料並建立完整測試資料集
 */
export async function seedComprehensiveTestData() {
  console.log('🌱 開始建立完整測試資料...\n');
  
  try {
    // 1. 清除現有資料
    console.log('🗑️  清除現有資料...');
    await db.assets.clear();
    await db.subscriptions.clear();
    
    // 2. 建立遊戲主機系統（高階配置）
    console.log('🎮 建立遊戲主機系統...');
    await createGamingPC();
    
    // 3. 建立家用伺服器系統（低功耗）
    console.log('🖥️  建立 Orange Pi 叢集系統...');
    await createServerCluster();
    
    // 4. 建立 Standalone 資產
    console.log('💻 建立獨立資產...');
    const laptopId = await createStandaloneAssets();
    
    // 5. 建立 Accessory 連結到 MacBook
    console.log('🔌 建立配件資產...');
    await createAccessories(laptopId);
    
    // 6. 建立訂閱服務
    console.log('📱 建立訂閱服務...');
    await createSubscriptions();
    
    // 7. 統計資訊
    const stats = await getTestDataStats();
    console.log('\n✅ 測試資料建立完成！\n');
    console.log('📊 資料統計：');
    console.log(`   - 系統 (System): ${stats.systems} 個`);
    console.log(`   - 組件 (Component): ${stats.components} 個`);
    console.log(`   - 獨立資產 (Standalone): ${stats.standalone} 個`);
    console.log(`   - 配件 (Accessory): ${stats.accessories} 個`);
    console.log(`   - 訂閱服務: ${stats.subscriptions} 個`);
    console.log(`   - 總資產數: ${stats.totalAssets} 個`);
    console.log(`   - 總價值: NT$ ${stats.totalValue.toLocaleString()}\n`);
    
    return stats;
  } catch (error) {
    console.error('❌ 測試資料建立失敗:', error);
    throw error;
  }
}

/**
 * 建立遊戲主機系統（RTX 4080 配置）
 */
async function createGamingPC(): Promise<string> {
  const purchaseDate = new Date('2024-01-15');
  
  // 建立 System
  const systemId = crypto.randomUUID();
  const system: PhysicalAsset = {
    id: systemId,
    name: '遊戲主機 RTX 4080',
    category: 'Tech',
    price: 0, // System 價格由組件總和決定
    currency: 'TWD',
    purchaseDate,
    targetLifespan: 1825, // 5 years
    role: 'System',
    systemId: null,
    linkedAssetId: null,
    status: 'Active',
    maintenanceLog: [
      {
        date: new Date('2024-09-01'),
        note: '清理灰塵、更換散熱膏',
        cost: 500
      }
    ],
    powerWatts: 450,
    dailyUsageHours: 8,
    recurringMaintenanceCost: 2000 // 每年清潔保養
  };
  
  await db.assets.add(system);
  
  // 建立 Components
  const components: Omit<PhysicalAsset, 'id'>[] = [
    {
      name: 'Intel Core i7-13700K',
      category: 'Tech',
      price: 12500,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1825,
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'RTX 4080 顯示卡',
      category: 'Tech',
      price: 35000,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1460, // 4 years (GPU 更新較快)
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'DDR5 32GB RAM (16GB x2)',
      category: 'Tech',
      price: 4500,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 2190, // 6 years
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Samsung 980 Pro 1TB NVMe SSD',
      category: 'Tech',
      price: 3200,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1825,
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Corsair RM850x 電源供應器 (850W)',
      category: 'Tech',
      price: 3800,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 2555, // 7 years
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Fractal Design Torrent 機殼 + 風扇',
      category: 'Tech',
      price: 2500,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 3650, // 10 years
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    }
  ];
  
  for (const component of components) {
    await db.assets.add({ ...component, id: crypto.randomUUID() });
  }
  
  console.log(`   ✓ 系統總價: NT$ ${components.reduce((sum, c) => sum + c.price, 0).toLocaleString()}`);
  console.log(`   ✓ 組件數量: ${components.length} 個`);
  
  return systemId;
}

/**
 * 建立 Orange Pi 5 Plus 叢集伺服器
 */
async function createServerCluster(): Promise<string> {
  const purchaseDate = new Date('2024-03-20');
  
  // 建立 System
  const systemId = crypto.randomUUID();
  const system: PhysicalAsset = {
    id: systemId,
    name: 'Orange Pi 5 Plus 叢集',
    category: 'Tech',
    price: 0,
    currency: 'TWD',
    purchaseDate,
    targetLifespan: 1460, // 4 years
    role: 'System',
    systemId: null,
    linkedAssetId: null,
    status: 'Active',
    maintenanceLog: [],
    powerWatts: 45, // 3 個板子各 15W
    dailyUsageHours: 24, // 24/7 運行
    recurringMaintenanceCost: 800 // SD 卡備份、風扇更換
  };
  
  await db.assets.add(system);
  
  // 建立 Components
  const components: Omit<PhysicalAsset, 'id'>[] = [
    {
      name: 'Orange Pi 5 Plus (8GB) - Node 1',
      category: 'Tech',
      price: 3500,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1460,
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Orange Pi 5 Plus (8GB) - Node 2',
      category: 'Tech',
      price: 3500,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1460,
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Orange Pi 5 Plus (8GB) - Node 3',
      category: 'Tech',
      price: 3500,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1460,
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: '散熱器組 + 風扇',
      category: 'Tech',
      price: 800,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1095, // 3 years
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: '電源管理 + USB-C 供電',
      category: 'Tech',
      price: 1200,
      currency: 'TWD',
      purchaseDate,
      targetLifespan: 1825,
      role: 'Component',
      systemId,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    }
  ];
  
  for (const component of components) {
    await db.assets.add({ ...component, id: crypto.randomUUID() });
  }
  
  console.log(`   ✓ 系統總價: NT$ ${components.reduce((sum, c) => sum + c.price, 0).toLocaleString()}`);
  console.log(`   ✓ 組件數量: ${components.length} 個`);
  
  return systemId;
}

/**
 * 建立 Standalone 資產
 */
async function createStandaloneAssets(): Promise<string> {
  const assets: Omit<PhysicalAsset, 'id'>[] = [
    {
      name: 'MacBook Pro M1 14" (2021)',
      category: 'Tech',
      price: 45000,
      currency: 'TWD',
      purchaseDate: new Date('2022-03-10'),
      targetLifespan: 1825, // 5 years
      role: 'Standalone',
      systemId: null,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [
        {
          date: new Date('2023-11-20'),
          note: '更換原廠電池',
          cost: 4500
        }
      ],
      powerWatts: 65,
      dailyUsageHours: 10,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Yamaha F310 古典吉他',
      category: 'Music',
      price: 4500,
      currency: 'TWD',
      purchaseDate: new Date('2023-08-20'),
      targetLifespan: 3650, // 10 years
      role: 'Standalone',
      systemId: null,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [
        {
          date: new Date('2024-02-15'),
          note: '更換琴弦 (Elixir)',
          cost: 450
        }
      ],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Sony WH-1000XM5 降噪耳機',
      category: 'Tech',
      price: 10500,
      currency: 'TWD',
      purchaseDate: new Date('2024-05-10'),
      targetLifespan: 1095, // 3 years
      role: 'Standalone',
      systemId: null,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Herman Miller Aeron 人體工學椅',
      category: 'Life',
      price: 38000,
      currency: 'TWD',
      purchaseDate: new Date('2023-01-05'),
      targetLifespan: 4380, // 12 years (保固期)
      role: 'Standalone',
      systemId: null,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'LG 27" 4K 顯示器 (27UP850)',
      category: 'Tech',
      price: 12800,
      currency: 'TWD',
      purchaseDate: new Date('2023-07-15'),
      targetLifespan: 2190, // 6 years
      role: 'Standalone',
      systemId: null,
      linkedAssetId: null,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 40,
      dailyUsageHours: 10,
      recurringMaintenanceCost: 0
    }
  ];
  
  let macbookId = '';
  for (const asset of assets) {
    const id = crypto.randomUUID();
    await db.assets.add({ ...asset, id });
    if (asset.name.includes('MacBook')) {
      macbookId = id;
    }
  }
  
  console.log(`   ✓ 建立 ${assets.length} 個獨立資產`);
  
  return macbookId; // 返回 MacBook ID 供後續配件連結使用
}

/**
 * 建立配件並連結到主資產
 */
async function createAccessories(laptopId: string): Promise<void> {
  const accessories: Omit<PhysicalAsset, 'id'>[] = [
    {
      name: 'Anker USB-C Hub (7-in-1)',
      category: 'Tech',
      price: 1200,
      currency: 'TWD',
      purchaseDate: new Date('2022-04-15'),
      targetLifespan: 1095, // 3 years
      role: 'Accessory',
      systemId: null,
      linkedAssetId: laptopId, // 連結到 MacBook
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    },
    {
      name: 'Apple Magic Mouse',
      category: 'Tech',
      price: 2390,
      currency: 'TWD',
      purchaseDate: new Date('2022-03-10'),
      targetLifespan: 1460, // 4 years
      role: 'Accessory',
      systemId: null,
      linkedAssetId: laptopId,
      status: 'Active',
      maintenanceLog: [],
      powerWatts: 0,
      dailyUsageHours: 0,
      recurringMaintenanceCost: 0
    }
  ];
  
  for (const accessory of accessories) {
    await db.assets.add({ ...accessory, id: crypto.randomUUID() });
  }
  
  console.log(`   ✓ 建立 ${accessories.length} 個配件（連結到 MacBook）`);
}

/**
 * 建立訂閱服務
 */
async function createSubscriptions(): Promise<void> {
  const subscriptions: Omit<Subscription, 'id'>[] = [
    {
      name: 'Spotify Premium',
      cost: 149,
      currency: 'TWD',
      billingCycle: 'Monthly',
      startDate: new Date('2022-01-01'),
      category: 'Entertainment',
      status: 'Active'
    },
    {
      name: 'Vultr VPS (2 vCPU, 4GB)',
      cost: 300,
      currency: 'TWD',
      billingCycle: 'Monthly',
      startDate: new Date('2023-06-15'),
      category: 'Service',
      status: 'Active'
    },
    {
      name: 'Netflix Premium 4K',
      cost: 390,
      currency: 'TWD',
      billingCycle: 'Monthly',
      startDate: new Date('2023-03-20'),
      category: 'Entertainment',
      status: 'Active'
    },
    {
      name: 'Adobe Creative Cloud',
      cost: 1680,
      currency: 'TWD',
      billingCycle: 'Monthly',
      startDate: new Date('2024-01-10'),
      category: 'Software',
      status: 'Active'
    },
    {
      name: 'GitHub Pro',
      cost: 4,
      currency: 'USD',
      billingCycle: 'Monthly',
      startDate: new Date('2022-08-01'),
      category: 'Software',
      status: 'Active'
    }
  ];
  
  for (const sub of subscriptions) {
    await db.subscriptions.add({ ...sub, id: crypto.randomUUID() });
  }
  
  console.log(`   ✓ 建立 ${subscriptions.length} 個訂閱服務`);
}

/**
 * 取得測試資料統計
 */
async function getTestDataStats() {
  const allAssets = await db.assets.toArray();
  const allSubscriptions = await db.subscriptions.toArray();
  
  const systems = allAssets.filter(a => a.role === 'System');
  const components = allAssets.filter(a => a.role === 'Component');
  const standalone = allAssets.filter(a => a.role === 'Standalone');
  const accessories = allAssets.filter(a => a.role === 'Accessory');
  
  // 計算總價值（Systems 用組件總和）
  let totalValue = 0;
  for (const asset of allAssets) {
    if (asset.role === 'System') {
      const systemComponents = components.filter(c => c.systemId === asset.id);
      totalValue += systemComponents.reduce((sum, c) => sum + c.price, 0);
    } else if (asset.role !== 'Component') {
      totalValue += asset.price;
    }
  }
  
  return {
    systems: systems.length,
    components: components.length,
    standalone: standalone.length,
    accessories: accessories.length,
    subscriptions: allSubscriptions.length,
    totalAssets: allAssets.length,
    totalValue
  };
}

/**
 * 快速清除測試資料
 */
export async function clearAllData() {
  console.log('🗑️  清除所有資料...');
  await db.assets.clear();
  await db.subscriptions.clear();
  console.log('✅ 清除完成');
}
