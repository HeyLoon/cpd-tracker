# 📊 CPD Tracker - Cost Per Day 資產管理系統

> **Offline-First PWA** with **Self-Hosted PocketBase Backend**

一個專為技術愛好者和學生打造的資產與訂閱成本追蹤器，讓你清楚掌握每日花費（CPD）、隱形成本（電費）以及資產階層（電腦零件）。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![PocketBase](https://img.shields.io/badge/PocketBase-0.26-green)](https://pocketbase.io/)

---

## ✨ 主要特色

### 🌐 **離線優先 (Offline-First)**
- 使用 Dexie.js (IndexedDB) 本地儲存所有資料
- 完全離線可用，無需網路連線
- PWA 可安裝，像原生 App 一樣使用

### 🔄 **自動雙向同步**
- 自架 PocketBase 後端，資料完全掌握
- 背景自動同步（每 5 分鐘）
- 支援多裝置間即時同步
- 衝突偵測與解決

### 💰 **智能成本追蹤**
- **每日成本 (CPD)**: `(價格 - 轉售價) / 持有天數`
- **隱形成本**: 電費計算（功率 × 時數 × 電價）
- **年度維護成本**: 散熱膏、保養等固定支出
- **訂閱整合**: 月繳/季繳/年繳統一顯示為日成本

### 🏗️ **資產階層系統 (v0.5.0)**
- **System**: 系統容器（如：遊戲主機）
- **Component**: 內部組件（如：RTX 4080、SSD）
- **Standalone**: 獨立資產（如：筆電、吉他）
- **Accessory**: 外接配件（如：滑鼠、Hub）
- **自動價格匯總**: System 價格 = 所有 Components 價格總和

### 📊 **視覺化分析**
- 即時每日成本總覽
- 分類圓餅圖（Tech / Music / Life）
- 月支出 / 年支出預測
- 隱形成本專區（電費 + 訂閱 + 維護）

---

## 🛠️ 技術架構

### 前端
```
React 18 + TypeScript + Vite
├── UI: Tailwind CSS + Shadcn/UI
├── 路由: React Router (HashRouter for GitHub Pages)
├── 圖表: Recharts
├── 本地 DB: Dexie.js (IndexedDB)
├── 日期: date-fns (zh-TW locale)
└── PWA: vite-plugin-pwa (GenerateSW)
```

### 後端
```
PocketBase (Self-Hosted)
├── 資料庫: SQLite
├── 認證: Email/Password
├── 檔案儲存: 資產照片上傳
├── 即時訂閱: Realtime updates
└── 部署: Docker on Orange Pi 5 Plus
```

### 同步策略
```
┌─────────────────┐
│   User Action   │
│ (Add/Edit/Delete)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dexie.js      │  ◄── 立即儲存（離線可用）
│   (IndexedDB)   │
└────────┬────────┘
         │
         ▼ (Online?)
┌─────────────────┐
│  PocketBase     │  ◄── 背景同步（5 分鐘間隔）
│  (Remote API)   │
└─────────────────┘
```

---

## 🚀 快速開始

### 1. 部署後端（PocketBase）

```bash
# 在 Orange Pi 上執行
cd ~/cpd-pocketbase
docker-compose up -d
```

詳細步驟見 [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md)

### 2. 設定前端

```bash
# 安裝依賴
bun install

# 建立環境變數
cp .env.example .env
nano .env
# 設定 VITE_POCKETBASE_URL=https://api.yourdomain.com

# 開發模式
bun run dev

# 建置生產版本
bun run build
```

### 3. 部署到 GitHub Pages

```bash
# 推送到 GitHub（自動部署）
git push origin master
```

完整部署指南見 [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📱 使用指南

### 新增資產

#### 方法 A: 獨立資產
1. 進入「資產」頁面
2. 點擊「新增」按鈕
3. 填寫資產資訊
4. 點擊「儲存」

#### 方法 B: 組裝系統（Rig Builder）
1. 進入「資產」頁面
2. 點擊「組裝系統」按鈕
3. 填寫系統名稱、購買日期
4. 新增組件（CPU、GPU、RAM...）
5. 系統價格自動計算 = 所有組件價格總和

### 新增訂閱

1. 進入「訂閱」頁面
2. 點擊「新增」按鈕
3. 選擇計費週期（月/季/年）
4. 系統自動轉換為每日成本

### 查看統計

1. 進入「儀表板」
2. 查看總每日成本、月支出、年支出
3. 下滑查看隱形成本明細
4. 點擊「分析」查看詳細圖表

### 同步資料

- **自動同步**: 每 5 分鐘自動執行
- **手動同步**: 頂部狀態列顯示待上傳項目時，點擊「立即同步」
- **離線模式**: 網路斷線時，資料儲存在本地，連線後自動同步

---

## 🗂️ 專案結構

```
cpd-tracker/
├── src/
│   ├── components/          # UI 組件
│   │   ├── BottomNav.tsx   # 底部導航
│   │   ├── AssetCard.tsx   # 資產卡片
│   │   └── SyncStatusBar.tsx  # 同步狀態列
│   ├── pages/              # 頁面
│   │   ├── Dashboard.tsx   # 儀表板
│   │   ├── Assets.tsx      # 資產列表
│   │   ├── AssetForm.tsx   # 資產表單
│   │   ├── RigBuilderForm.tsx  # 系統組裝表單
│   │   ├── LoginPage.tsx   # 登入/註冊頁面
│   │   └── ...
│   ├── hooks/              # React Hooks
│   │   ├── useDatabase.ts  # Dexie 查詢
│   │   ├── useSync.ts      # 同步狀態
│   │   └── useCostCalculations.ts  # 成本計算
│   ├── utils/              # 工具函數
│   │   └── costCalculations.ts
│   ├── db.ts               # Dexie 資料庫定義
│   ├── pocketbase.ts       # PocketBase 客戶端
│   ├── syncService.ts      # 同步服務
│   ├── types.ts            # TypeScript 類型
│   └── App.tsx             # 主應用程式
├── docker-compose.yml      # PocketBase Docker 配置
├── POCKETBASE_SETUP.md     # PocketBase 設定指南
├── DEPLOYMENT.md           # 完整部署指南
└── README.md               # 本檔案
```

---

## 🧪 測試資料

開發模式下，Dashboard 提供「開發工具」區塊：

- **快速檢查**: 顯示資料庫統計與載入效能
- **執行性能測試**: 完整測試套件（7 項測試）
- **重新載入測試資料**: 包含完整範例資料

測試資料包含：
- 遊戲主機系統（6 個組件，NT$ 61,500）
- Orange Pi 叢集（5 個組件，NT$ 12,500）
- 5 個獨立資產（筆電、吉他、耳機等）
- 2 個配件（連結到 MacBook）
- 5 個訂閱服務

---

## 📊 資料模型

### PhysicalAsset
```typescript
interface PhysicalAsset {
  id: string;
  name: string;
  category: 'Tech' | 'Music' | 'Life' | 'Others';
  price: number;
  currency: 'TWD' | 'USD' | 'JPY';
  purchaseDate: Date;
  targetLifespan: number;  // 天數
  status: 'Active' | 'Sold' | 'Retired';
  
  // v0.5.0 角色系統
  role: 'Standalone' | 'System' | 'Component' | 'Accessory';
  systemId: string | null;
  linkedAssetId: string | null;
  
  // 電力與維護
  powerWatts: number;
  dailyUsageHours: number;
  recurringMaintenanceCost: number;
  maintenanceLog: MaintenanceLog[];
  
  // v0.6.0 同步
  remoteId?: string;
  synced?: boolean;
  lastSyncedAt?: Date;
}
```

### Subscription
```typescript
interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: 'TWD' | 'USD' | 'JPY';
  billingCycle: 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: Date;
  category: 'Software' | 'Service' | 'Entertainment';
  status: 'Active' | 'Cancelled';
  
  // v0.6.0 同步
  remoteId?: string;
  synced?: boolean;
  lastSyncedAt?: Date;
}
```

---

## 🔧 設定選項

### 全域設定 (Settings Page)

- **電費單價**: NT$ / kWh（預設 4.0）
- **預設幣別**: TWD / USD / JPY
- **語系**: zh-TW（繁體中文）

### 環境變數

```bash
# .env
VITE_POCKETBASE_URL=https://api.yourdomain.com
```

---

## 🐛 疑難排解

### 問題：資料未同步

**檢查項目**:
1. 確認網路連線
2. 確認已登入 PocketBase
3. 開發者工具 → Console 查看錯誤
4. 點擊「立即同步」手動觸發

### 問題：GitHub Pages 404

**解決**:
- 確認使用 `HashRouter`（不是 `BrowserRouter`）
- URL 應為 `https://xxx.github.io/repo/#/`
- 檢查 GitHub Pages 設定

### 問題：CORS 錯誤

**解決**:
- PocketBase 管理後台 → Settings → Application → CORS
- 新增前端網域（包含 `https://`）
- 重啟 PocketBase: `docker-compose restart`

完整疑難排解見 [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🗺️ Roadmap

### v0.7.0 (計劃中)
- [ ] 照片上傳與管理
- [ ] 資產搜尋與篩選
- [ ] 匯出 CSV / JSON
- [ ] PWA 推播通知（訂閱到期提醒）

### v0.8.0 (計劃中)
- [ ] 多幣別自動匯率轉換
- [ ] 預算目標設定
- [ ] 更多圖表類型（折線圖、長條圖）
- [ ] 暗色/亮色主題切換

---

## 📄 授權

MIT License - 詳見 [LICENSE](./LICENSE)

---

## 🤝 貢獻

歡迎 Pull Requests！

1. Fork 專案
2. 建立分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 🙏 致謝

- [PocketBase](https://pocketbase.io/) - 優秀的 Go + SQLite 後端
- [Dexie.js](https://dexie.org/) - 強大的 IndexedDB 封裝
- [Recharts](https://recharts.org/) - React 圖表庫
- [Lucide Icons](https://lucide.dev/) - 精美的開源圖示
- [Vite PWA](https://vite-pwa-org.netlify.app/) - PWA 快速設定

---

## 📧 聯絡

如有問題，請開 Issue 或透過 Email 聯繫。

---

**Built with ❤️ for self-hosters and tech enthusiasts**
