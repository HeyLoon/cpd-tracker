// 資產分類
export type AssetCategory = "Tech" | "Music" | "Life" | "Others";

// 資產狀態
export type AssetStatus = "Active" | "Sold" | "Retired";

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
}

// 訂閱週期
export type BillingCycle = "Monthly" | "Yearly";

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
}
