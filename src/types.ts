// 資產分類
export type AssetCategory = "Tech" | "Music" | "Life" | "Others";

// 資產狀態
export type AssetStatus = "Active" | "Sold" | "Retired";

// 資產角色 (v0.5.0 新增)
export type AssetRole = "Standalone" | "System" | "Component" | "Accessory";

// 貨幣類型
export type Currency = "TWD" | "JPY" | "USD";

// 維護記錄
export interface MaintenanceLog {
  date: Date;
  note: string;
  cost: number;
}

// 實體資產 (一次性購買)
export interface PhysicalAsset {
  id: string;
  name: string;
  category: AssetCategory;
  purchaseDate: Date;
  price: number;
  currency: Currency;
  maintenanceLog: MaintenanceLog[];
  targetLifespan: number; // 目標使用天數
  status: AssetStatus;
  soldPrice?: number;
  notes?: string;
  
  // === v0.5.0 重構：角色系統（取代 v0.4.0 的 parentId/isComposite）===
  role: AssetRole; // 資產角色：Standalone（獨立）、System（系統容器）、Component（內部組件）、Accessory（外接配件）
  systemId: string | null; // 當 role=Component 時，指向所屬的 System
  linkedAssetId: string | null; // 當 role=Accessory 時，可選擇連結的資產
  
  // === v0.4.0 保留：電力規格 ===
  powerWatts: number; // 功率（瓦特），預設 0
  dailyUsageHours: number; // 每日使用時數，預設 0
  
  // === v0.4.0 保留：隱形成本 ===
  recurringMaintenanceCost: number; // 年度化維護成本（例如散熱膏、保養），預設 0
  
  // === v0.6.0 新增：PocketBase 同步欄位 ===
  remoteId?: string | null; // PocketBase record ID
  synced?: boolean; // 是否已同步到遠端
  lastSyncedAt?: Date | null; // 最後同步時間
  
  // === v0.4.0 廢棄欄位（保留作向下相容）===
  parentId?: string | null; // 廢棄：請使用 systemId
  isComposite?: boolean; // 廢棄：請使用 role=System
}

// 訂閱週期
export type BillingCycle = "Monthly" | "Quarterly" | "Yearly";

// 訂閱分類
export type SubscriptionCategory = "Software" | "Service" | "Entertainment";

// 訂閱狀態
export type SubscriptionStatus = "Active" | "Cancelled";

// 訂閱
export interface Subscription {
  id: string;
  name: string;
  billingCycle: BillingCycle;
  cost: number;
  currency: Currency;
  startDate: Date;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  cancelledDate?: Date;
  notes?: string;
  
  // === v0.6.0 新增：PocketBase 同步欄位 ===
  remoteId?: string | null; // PocketBase record ID
  synced?: boolean; // 是否已同步到遠端
  lastSyncedAt?: Date | null; // 最後同步時間
}

// === v0.4.0 新增：全域設定 ===
export interface GlobalSettings {
  electricityRate: number; // 電費單價（NT$ / kWh），預設 4.0
  locale: string; // 語系，預設 'zh-TW'
  defaultCurrency: Currency; // 預設幣別，預設 'TWD'
}

// === v0.4.0 新增：隱形成本分析 ===
export interface InvisibleCosts {
  totalElectricityCost: number; // 總電費（月）
  totalSubscriptionsCost: number; // 總訂閱費（月）
  totalRecurringMaintenance: number; // 總維護費（月）
  totalMonthly: number; // 月總計
  totalDaily: number; // 日均
}

// 繁體中文標籤對照表
export const LABELS_ZH_TW = {
  // 通用
  common: {
    add: '新增',
    edit: '編輯',
    delete: '刪除',
    cancel: '取消',
    save: '儲存',
    confirm: '確認',
    back: '返回',
    search: '搜尋',
    filter: '篩選',
    all: '全部',
    active: '使用中',
    status: '狀態',
    category: '分類',
    currency: '幣別',
    notes: '備註',
  },
  
  // 資產
  asset: {
    title: '資產管理',
    name: '資產名稱',
    purchaseDate: '購買日期',
    price: '購買價格',
    targetLifespan: '目標壽命（天）',
    maintenance: '維護記錄',
    maintenanceLog: '維護歷史',
    addMaintenance: '新增維護記錄',
    sold: '已出售',
    retired: '已退役',
    soldPrice: '出售價格',
    breakEven: '回本進度',
    daysOwned: '持有天數',
    dailyCost: '每日成本',
    totalCost: '總成本',
    
    // v0.4.0 保留
    powerWatts: '功率（瓦）',
    dailyUsageHours: '每日使用時數',
    recurringMaintenance: '年度維護成本',
    estimatedElectricity: '預估電費',
    
    // v0.5.0 新增
    role: '資產角色',
    standalone: '獨立資產',
    system: '系統',
    component: '內部組件',
    accessory: '外接配件',
    systemId: '所屬系統',
    linkedAsset: '連結資產',
    buildSystem: '組裝系統',
    componentCount: '組件數量',
    calculatedPrice: '計算價格',
  },
  
  // 訂閱
  subscription: {
    title: '訂閱管理',
    name: '訂閱名稱',
    billingCycle: '計費週期',
    monthly: '每月',
    quarterly: '每季',
    yearly: '每年',
    cost: '費用',
    startDate: '開始日期',
    cancelled: '已取消',
    cancelledDate: '取消日期',
    totalSpent: '累計花費',
    monthsActive: '訂閱月數',
  },
  
  // 儀表板
  dashboard: {
    title: '儀表板',
    dailyBurnRate: '每日燒錢速率',
    totalAssetValue: '資產總淨值',
    monthlyCost: '每月支出',
    yearlyCost: '每年支出',
    assetsCost: '資產成本',
    subscriptionsCost: '訂閱成本',
    breakdown: '成本拆解',
    
    // v0.4.0 新增
    invisibleCosts: '隱形成本',
    monthlyInvisibleCosts: '每月隱形支出',
    electricityCost: '電費',
    recurringCosts: '經常性支出',
  },
  
  // 分析
  analytics: {
    title: '數據分析',
    trend: '趨勢',
    insights: '洞察',
    topExpenses: '最大支出',
    categoryBreakdown: '分類分佈',
    timeRange: '時間範圍',
    months: '個月',
  },
  
  // 設定
  settings: {
    title: '設定',
    export: '匯出資料',
    import: '匯入資料',
    electricityRate: '電費單價（NT$/度）',
    locale: '語系',
    defaultCurrency: '預設幣別',
  },
  
  // 分類
  categories: {
    Tech: '科技',
    Music: '音樂',
    Life: '生活',
    Others: '其他',
    Software: '軟體',
    Service: '服務',
    Entertainment: '娛樂',
  },
} as const;
