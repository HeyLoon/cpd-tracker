# CPD Tracker - 每日成本追蹤器 💰

> **Cost Per Day** Asset & Subscription Tracker
> Local-First PWA for tracking your daily lifestyle costs

## ✨ 功能特色

### 核心功能
- 📊 **每日燃燒率** - 一眼看出你每天花了多少錢
- 📦 **資產管理** - 追蹤實體資產 (電腦、吉他、設備等)
- 🔄 **訂閱管理** - 管理所有數位訂閱服務
- 📈 **數據分析** - 圓餅圖視覺化成本分佈
- 💾 **本地優先** - 所有資料儲存在你的裝置上
- 📱 **PWA 支援** - 可安裝到手機桌面，離線使用

### 計算邏輯
- **實體資產**: `每日成本 = (購買價格 + 維護成本) / 持有天數`
- **訂閱服務**: `每日成本 = 月費/30 或 年費/365`
- **總花費追蹤**: 顯示訂閱服務的累積花費
- **目標達成**: 追蹤資產是否達到目標使用期限

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置正式版
```bash
npm run build
```

### 預覽正式版
```bash
npm run preview
```

## 🛠 技術棧

- **框架**: React 18 + TypeScript
- **建置工具**: Vite
- **PWA**: vite-plugin-pwa (GenerateSW)
- **資料庫**: Dexie.js (IndexedDB)
- **UI**: Tailwind CSS v3 + Dark Mode
- **圖表**: Recharts
- **路由**: React Router
- **日期處理**: date-fns

## 📁 專案結構

```
cpd-tracker/
├── src/
│   ├── components/        # React 組件
│   │   └── BottomNav.tsx # 底部導航列
│   ├── hooks/            # 自定義 Hooks
│   │   ├── useDatabase.ts         # 資料庫存取 Hook
│   │   └── useCostCalculations.ts # 成本計算邏輯
│   ├── pages/            # 頁面組件
│   │   ├── Dashboard.tsx      # 首頁儀表板
│   │   ├── Assets.tsx         # 資產管理
│   │   ├── Subscriptions.tsx  # 訂閱管理
│   │   └── Analytics.tsx      # 數據分析
│   ├── db.ts             # Dexie 資料庫設定
│   ├── types.ts          # TypeScript 型別定義
│   ├── App.tsx           # 主應用程式
│   └── index.css         # 全域樣式
├── vite.config.ts        # Vite 設定 (含 PWA)
├── tailwind.config.js    # Tailwind 設定
└── package.json
```

## 💾 資料模型

### PhysicalAsset (實體資產)
```typescript
interface PhysicalAsset {
  id: string
  name: string
  category: "Tech" | "Music" | "Life" | "Others"
  purchaseDate: Date
  price: number
  currency: "TWD" | "JPY" | "USD"
  maintenanceLog: MaintenanceLog[]
  targetLifespan: number  // 目標使用天數
  status: "Active" | "Sold" | "Retired"
  soldPrice?: number
  notes?: string
}
```

### Subscription (訂閱)
```typescript
interface Subscription {
  id: string
  name: string
  billingCycle: "Monthly" | "Yearly"
  cost: number
  currency: "TWD" | "JPY" | "USD"
  startDate: Date
  category: "Software" | "Service" | "Entertainment"
  status: "Active" | "Cancelled"
  cancelledDate?: Date
  notes?: string
}
```

## 🎯 目前進度

### ✅ 已完成
- [x] 專案初始化 (Vite + React + TypeScript)
- [x] PWA 設定 (可安裝 + 離線支援)
- [x] Tailwind CSS + Dark Mode
- [x] Dexie.js 資料庫架構
- [x] useCostCalculations Hook (計算邏輯)
- [x] Dashboard 頁面 (每日燃燒率顯示 + 圓餅圖)
- [x] 底部導航列 (Mobile-First)
- [x] 基礎路由結構

### 🚧 待開發
- [ ] Assets 管理頁面 (列表 + 新增/編輯表單)
- [ ] Subscriptions 管理頁面 (列表 + 新增/編輯表單)
- [ ] Analytics 詳細分析頁面
- [ ] 資料匯出/匯入 JSON 功能
- [ ] 拍照上傳收據功能
- [ ] 維護記錄時間軸
- [ ] Break-Even 進度條

## 📱 使用建議

1. **首次使用**: 先新增幾個資產和訂閱，才能看到完整的數據視覺化
2. **Dark Mode**: 預設為暗色模式，適合夜間使用
3. **離線使用**: 安裝為 PWA 後可完全離線使用
4. **定期備份**: 使用匯出功能定期備份資料
5. **維護記錄**: 記得記錄資產的維護成本，讓計算更精確

## 🔒 隱私保護

- ✅ 所有資料存儲在本地 (IndexedDB)
- ✅ 不會上傳到任何伺服器
- ✅ 完全離線可用
- ✅ 你擁有完整的資料控制權

## 📄 授權

MIT License

---

建立者: heyloon  
專案類型: Local-First Fintech PWA
