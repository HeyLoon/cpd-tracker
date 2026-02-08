/**
 * 性能測試工具
 * 測試 v0.5.0 架構在大量資料下的表現
 */

import { db, calculateSystemPrice } from './db';
import type { PhysicalAsset } from './types';

interface PerformanceResult {
  testName: string;
  duration: number;
  itemsProcessed: number;
  avgTimePerItem?: number;
  success: boolean;
  error?: string;
}

/**
 * 執行完整性能測試套件
 */
export async function runPerformanceTests(): Promise<PerformanceResult[]> {
  console.log('⚡ 開始性能測試...\n');
  console.log('==========================================\n');
  
  const results: PerformanceResult[] = [];
  
  // Test 1: 批次創建資產
  results.push(await testBulkAssetCreation(500));
  
  // Test 2: 批次創建系統 + 組件
  results.push(await testBulkSystemCreation(100));
  
  // Test 3: 大量資產載入
  results.push(await testAssetLoading());
  
  // Test 4: 系統價格計算
  results.push(await testSystemPriceCalculation());
  
  // Test 5: 篩選與查詢
  results.push(await testFilteringAndQueries());
  
  // Test 6: 資料庫遷移模擬
  results.push(await testMigrationSimulation());
  
  // Test 7: 複雜的成本計算
  results.push(await testComplexCostCalculations());
  
  console.log('\n==========================================');
  console.log('📊 性能測試報告\n');
  
  printTestResults(results);
  
  return results;
}

/**
 * Test 1: 批次創建大量 Standalone 資產
 */
async function testBulkAssetCreation(count: number): Promise<PerformanceResult> {
  const testName = `批次創建 ${count} 個獨立資產`;
  console.log(`🔧 ${testName}...`);
  
  try {
    const start = performance.now();
    
    const assets: Omit<PhysicalAsset, 'id'>[] = [];
    for (let i = 0; i < count; i++) {
      assets.push({
        name: `測試資產 ${i + 1}`,
        category: 'Tech',
        price: Math.floor(Math.random() * 50000) + 1000,
        currency: 'TWD',
        purchaseDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1),
        targetLifespan: 365 + Math.floor(Math.random() * 1460),
        role: 'Standalone',
        systemId: null,
        linkedAssetId: null,
        status: 'Active',
        maintenanceLog: [],
        powerWatts: 0,
        dailyUsageHours: 0,
        recurringMaintenanceCost: 0
      });
    }
    
    // 使用 bulkAdd 一次性插入
    await db.assets.bulkAdd(assets.map(a => ({ ...a, id: crypto.randomUUID() })));
    
    const duration = performance.now() - start;
    const avgTime = duration / count;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms (平均 ${avgTime.toFixed(2)}ms/個)\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: count,
      avgTimePerItem: avgTime,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test 2: 批次創建系統（含組件）
 */
async function testBulkSystemCreation(systemCount: number): Promise<PerformanceResult> {
  const componentsPerSystem = 5;
  const totalItems = systemCount * (1 + componentsPerSystem);
  const testName = `批次創建 ${systemCount} 個系統（各 ${componentsPerSystem} 個組件）`;
  
  console.log(`🔧 ${testName}...`);
  
  try {
    const start = performance.now();
    
    for (let i = 0; i < systemCount; i++) {
      const systemId = crypto.randomUUID();
      
      // 創建 System
      await db.assets.add({
        id: systemId,
        name: `測試系統 ${i + 1}`,
        category: 'Tech',
        price: 0,
        currency: 'TWD',
        purchaseDate: new Date(),
        targetLifespan: 1825,
        role: 'System',
        systemId: null,
        linkedAssetId: null,
        status: 'Active',
        maintenanceLog: [],
        powerWatts: 0,
        dailyUsageHours: 0,
        recurringMaintenanceCost: 0
      });
      
      // 創建 Components
      const components: PhysicalAsset[] = [];
      for (let j = 0; j < componentsPerSystem; j++) {
        components.push({
          id: crypto.randomUUID(),
          name: `組件 ${j + 1}`,
          category: 'Tech',
          price: Math.floor(Math.random() * 10000) + 1000,
          currency: 'TWD',
          purchaseDate: new Date(),
          targetLifespan: 1460,
          role: 'Component',
          systemId,
          linkedAssetId: null,
          status: 'Active',
          maintenanceLog: [],
          powerWatts: 0,
          dailyUsageHours: 0,
          recurringMaintenanceCost: 0
        });
      }
      
      await db.assets.bulkAdd(components);
    }
    
    const duration = performance.now() - start;
    const avgTime = duration / systemCount;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms (平均 ${avgTime.toFixed(2)}ms/系統)`);
    console.log(`   ℹ️  總共創建 ${totalItems} 個資產\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: totalItems,
      avgTimePerItem: avgTime,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test 3: 載入所有資產
 */
async function testAssetLoading(): Promise<PerformanceResult> {
  const testName = '載入所有資產';
  console.log(`🔧 ${testName}...`);
  
  try {
    const start = performance.now();
    const assets = await db.assets.toArray();
    const duration = performance.now() - start;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms`);
    console.log(`   ℹ️  載入 ${assets.length} 個資產\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: assets.length,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test 4: 系統價格計算
 */
async function testSystemPriceCalculation(): Promise<PerformanceResult> {
  const testName = '系統價格計算';
  console.log(`🔧 ${testName}...`);
  
  try {
    const systems = await db.assets.where('role').equals('System').toArray();
    
    const start = performance.now();
    
    for (const system of systems) {
      await calculateSystemPrice(system.id);
    }
    
    const duration = performance.now() - start;
    const avgTime = systems.length > 0 ? duration / systems.length : 0;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms (平均 ${avgTime.toFixed(2)}ms/系統)`);
    console.log(`   ℹ️  計算 ${systems.length} 個系統\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: systems.length,
      avgTimePerItem: avgTime,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test 5: 篩選與查詢效能
 */
async function testFilteringAndQueries(): Promise<PerformanceResult> {
  const testName = '篩選與查詢';
  console.log(`🔧 ${testName}...`);
  
  try {
    const start = performance.now();
    
    // Query 1: 只取 Standalone 和 System
    const visibleAssets = await db.assets
      .where('role')
      .notEqual('Component')
      .toArray();
    
    // Query 2: 取得所有 Components
    const components = await db.assets
      .where('role')
      .equals('Component')
      .toArray();
    
    // Query 3: 按照類別分組
    const categories = new Set(visibleAssets.map(a => a.category));
    
    // Query 4: 取得特定日期範圍
    const recentAssets = await db.assets
      .where('purchaseDate')
      .above(new Date('2024-01-01'))
      .toArray();
    
    const duration = performance.now() - start;
    const totalQueries = 4;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms`);
    console.log(`   ℹ️  執行 ${totalQueries} 個查詢`);
    console.log(`   ℹ️  可見資產: ${visibleAssets.length}`);
    console.log(`   ℹ️  組件: ${components.length}`);
    console.log(`   ℹ️  類別數: ${categories.size}`);
    console.log(`   ℹ️  近期資產: ${recentAssets.length}\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: totalQueries,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test 6: 資料庫遷移模擬（v2 → v3）
 */
async function testMigrationSimulation(): Promise<PerformanceResult> {
  const testName = '資料庫遷移模擬 (v2 → v3)';
  console.log(`🔧 ${testName}...`);
  
  try {
    // 創建舊格式資料
    const legacyAssets: any[] = [
      {
        id: crypto.randomUUID(),
        name: 'Legacy System',
        isComposite: true,
        parentId: null,
        category: 'Electronics',
        price: 50000,
        currency: 'TWD',
        purchaseDate: new Date(),
        targetLifespan: 1825,
        maintenanceLog: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Legacy Component',
        isComposite: false,
        parentId: 'some-parent-id',
        category: 'Electronics',
        price: 10000,
        currency: 'TWD',
        purchaseDate: new Date(),
        targetLifespan: 1460,
        maintenanceLog: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Legacy Standalone',
        isComposite: false,
        parentId: null,
        category: 'Electronics',
        price: 5000,
        currency: 'TWD',
        purchaseDate: new Date(),
        targetLifespan: 1095,
        maintenanceLog: []
      }
    ];
    
    const start = performance.now();
    
    // 模擬遷移邏輯
    const migratedAssets = legacyAssets.map(asset => {
      let role: 'System' | 'Component' | 'Standalone';
      let systemId = null;
      
      if (asset.isComposite) {
        role = 'System';
      } else if (asset.parentId) {
        role = 'Component';
        systemId = asset.parentId;
      } else {
        role = 'Standalone';
      }
      
      return {
        ...asset,
        role,
        systemId,
        linkedAssetId: null
      };
    });
    
    const duration = performance.now() - start;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms`);
    console.log(`   ℹ️  遷移 ${migratedAssets.length} 筆資料`);
    console.log(`   ℹ️  System: ${migratedAssets.filter(a => a.role === 'System').length}`);
    console.log(`   ℹ️  Component: ${migratedAssets.filter(a => a.role === 'Component').length}`);
    console.log(`   ℹ️  Standalone: ${migratedAssets.filter(a => a.role === 'Standalone').length}\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: migratedAssets.length,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test 7: 複雜的成本計算
 */
async function testComplexCostCalculations(): Promise<PerformanceResult> {
  const testName = '複雜成本計算';
  console.log(`🔧 ${testName}...`);
  
  try {
    const start = performance.now();
    
    const allAssets = await db.assets.toArray();
    const allSubscriptions = await db.subscriptions.toArray();
    
    // 計算總 CPD
    let totalCPD = 0;
    const components = allAssets.filter(a => a.role === 'Component');
    
    for (const asset of allAssets) {
      if (asset.role === 'Component') continue; // 組件不單獨計算
      
      if (asset.role === 'System') {
        // 系統 CPD = 組件總和
        const systemComponents = components.filter(c => c.systemId === asset.id);
        const componentCPD = systemComponents.reduce((sum, c) => {
          return sum + (c.price / c.targetLifespan);
        }, 0);
        totalCPD += componentCPD;
      } else {
        // Standalone 和 Accessory
        totalCPD += asset.price / asset.targetLifespan;
      }
    }
    
    // 計算訂閱總成本
    const subscriptionDailyCost = allSubscriptions.reduce((sum, sub) => {
      const dailyCost = sub.billingCycle === 'Monthly' 
        ? sub.cost / 30 
        : sub.cost / 365;
      return sum + dailyCost;
    }, 0);
    
    const totalDailyCost = totalCPD + subscriptionDailyCost;
    
    const duration = performance.now() - start;
    
    console.log(`   ✓ 完成: ${duration.toFixed(2)}ms`);
    console.log(`   ℹ️  處理資產: ${allAssets.length} 個`);
    console.log(`   ℹ️  處理訂閱: ${allSubscriptions.length} 個`);
    console.log(`   ℹ️  總每日成本: NT$ ${totalDailyCost.toFixed(2)}\n`);
    
    return {
      testName,
      duration,
      itemsProcessed: allAssets.length + allSubscriptions.length,
      success: true
    };
  } catch (error) {
    console.log(`   ✗ 失敗: ${error}\n`);
    return {
      testName,
      duration: 0,
      itemsProcessed: 0,
      success: false,
      error: String(error)
    };
  }
}

/**
 * 列印測試結果
 */
function printTestResults(results: PerformanceResult[]): void {
  const successCount = results.filter(r => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`總測試數: ${results.length}`);
  console.log(`成功: ${successCount} ✓`);
  console.log(`失敗: ${results.length - successCount} ✗`);
  console.log(`總耗時: ${totalDuration.toFixed(2)}ms\n`);
  
  console.log('詳細結果：\n');
  results.forEach((result, index) => {
    const status = result.success ? '✓' : '✗';
    console.log(`${index + 1}. ${status} ${result.testName}`);
    console.log(`   時間: ${result.duration.toFixed(2)}ms`);
    console.log(`   項目: ${result.itemsProcessed}`);
    if (result.avgTimePerItem) {
      console.log(`   平均: ${result.avgTimePerItem.toFixed(2)}ms/項`);
    }
    if (result.error) {
      console.log(`   錯誤: ${result.error}`);
    }
    console.log('');
  });
  
  console.log('==========================================\n');
}

/**
 * 快速性能檢查（適合開發時使用）
 */
export async function quickPerformanceCheck(): Promise<void> {
  console.log('⚡ 快速性能檢查...\n');
  
  const start = performance.now();
  
  const assetCount = await db.assets.count();
  const subscriptionCount = await db.subscriptions.count();
  
  const loadStart = performance.now();
  const assets = await db.assets.toArray();
  const loadDuration = performance.now() - loadStart;
  
  const systems = assets.filter(a => a.role === 'System').length;
  const components = assets.filter(a => a.role === 'Component').length;
  const standalone = assets.filter(a => a.role === 'Standalone').length;
  const accessories = assets.filter(a => a.role === 'Accessory').length;
  
  const totalDuration = performance.now() - start;
  
  console.log('📊 資料庫狀態：');
  console.log(`   資產總數: ${assetCount}`);
  console.log(`   - System: ${systems}`);
  console.log(`   - Component: ${components}`);
  console.log(`   - Standalone: ${standalone}`);
  console.log(`   - Accessory: ${accessories}`);
  console.log(`   訂閱: ${subscriptionCount}\n`);
  
  console.log('⏱️  效能指標：');
  console.log(`   載入時間: ${loadDuration.toFixed(2)}ms`);
  console.log(`   總耗時: ${totalDuration.toFixed(2)}ms`);
  console.log(`   平均載入速度: ${(loadDuration / assetCount).toFixed(2)}ms/項\n`);
  
  // 效能評估
  if (loadDuration < 50) {
    console.log('✅ 效能優秀！');
  } else if (loadDuration < 200) {
    console.log('✓ 效能良好');
  } else if (loadDuration < 500) {
    console.log('⚠️  效能可接受，建議優化');
  } else {
    console.log('❌ 效能較差，需要優化');
  }
}
