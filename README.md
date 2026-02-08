# 📊 CPD Tracker - Cost Per Day 資產管理系統

> **Offline-First PWA** - 追蹤資產與訂閱的每日成本

一個專為技術愛好者和學生打造的資產成本追蹤器，讓你清楚掌握每日花費（CPD）、隱形成本（電費）以及資產階層關係。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

---

## ✨ 主要特色

### 🌐 離線優先 (Offline-First)
- 使用 IndexedDB 本地儲存所有資料
- 完全離線可用，無需網路連線
- PWA 可安裝，像原生 App 一樣使用

### 🔄 可選同步功能
- 支援自架 PocketBase 後端
- 使用者可自行輸入伺服器 URL
- 多裝置間資料同步
- **完全可選** - 不設定則以純離線模式運作

### 💰 智能成本追蹤
- **每日成本 (CPD)**: `(價格 - 轉售價) / 持有天數`
- **隱形成本**: 電費計算（功率 × 時數 × 電價）
- **年度維護成本**: 散熱膏、保養等固定支出
- **訂閱整合**: 月繳/季繳/年繳統一顯示為日成本

### 🏗️ 資產階層系統
- **System**: 系統容器（如：遊戲主機）
- **Component**: 內部組件（如：RTX 4080、SSD）
- **Standalone**: 獨立資產（如：筆電、吉他）
- **Accessory**: 外接配件（如：滑鼠、Hub）
- 自動價格匯總：System 價格 = 所有 Components 價格總和

### 📊 視覺化分析
- 即時每日成本總覽
- 分類圓餅圖（Tech / Music / Life）
- 月支出 / 年支出預測
- 隱形成本專區（電費 + 訂閱 + 維護）

---

## 🚀 快速開始

### 線上使用（推薦）

直接訪問已部署的版本：
```
https://heyloon.github.io/cpd-tracker/#/
```

**功能：**
- ✅ 完整離線功能
- ✅ 可安裝為 PWA
- ✅ 所有資料存在瀏覽器本地
- 🔧 可選：在「設定」頁面輸入 PocketBase URL 啟用同步

---

### 本地開發

```bash
# 1. 克隆專案
git clone https://github.com/HeyLoon/cpd-tracker.git
cd cpd-tracker

# 2. 安裝依賴（需要 Bun）
bun install

# 3. 啟動開發伺服器
bun run dev

# 4. 開啟瀏覽器
# http://localhost:5173
```

---

## 🛠️ 技術架構

### 前端
```
React 18 + TypeScript + Vite
├── UI: Tailwind CSS + Shadcn/UI
├── 路由: React Router (HashRouter)
├── 圖表: Recharts
├── 本地 DB: Dexie.js (IndexedDB)
├── 日期: date-fns (zh-TW)
└── PWA: vite-plugin-pwa
```

### 後端（可選）
```
PocketBase (Self-Hosted)
├── 資料庫: SQLite
├── 認證: Email/Password
├── 檔案儲存: 資產照片
└── 即時訂閱: Realtime updates
```

### 同步策略（可選）
```
使用者操作 → IndexedDB（立即儲存）
         ↓
    (如果設定了 URL)
         ↓
    PocketBase 後端（背景同步）
```

---

## 📱 使用說明

### 基本使用（無需設定）

1. **開啟應用程式**
   - 線上：https://heyloon.github.io/cpd-tracker/#/
   - 或本地：`bun run dev`

2. **新增資產**
   - 點擊「新增資產」
   - 填寫名稱、價格、購買日期等
   - 資料即時儲存到瀏覽器

3. **查看成本分析**
   - Dashboard 顯示總覽
   - 點擊資產查看詳細 CPD 計算

4. **安裝為 PWA**
   - 點擊瀏覽器網址列的「安裝」圖示
   - 像原生 App 一樣使用

### 啟用同步功能（進階）

如果你想在多裝置間同步資料：

1. **部署 PocketBase 後端**
   ```bash
   # 在你的伺服器上（Linux/Orange Pi/Raspberry Pi）
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_linux_arm64.zip
   unzip pocketbase_0.26.8_linux_arm64.zip
   ./pocketbase serve --http=0.0.0.0:8090
   ```

2. **在應用程式設定 URL**
   - 開啟「設定」頁面
   - 輸入 PocketBase URL（如：`http://192.168.1.100:8090`）
   - 點擊「儲存」

3. **註冊/登入帳號**
   - 前往「登入」頁面
   - 註冊新帳號或登入
   - 資料開始自動同步

4. **在其他裝置重複步驟 2-3**
   - 使用相同帳號登入
   - 資料會自動同步

**注意：** 同步功能完全可選！不設定則以純離線模式運作，功能一樣完整。

---

## 📖 核心概念

### CPD (Cost Per Day) 計算

```typescript
// 基礎 CPD（不考慮轉售）
CPD = 價格 / 目標使用天數

// 實際 CPD（考慮轉售價值）
實際 CPD = (購買價格 - 預估轉售價) / 已持有天數

// 總成本
總 CPD = 實際 CPD + 每日電費 + 每日訂閱費 + 每日維護費
```

### 範例

**資產：** MacBook Pro M2  
**購買價格：** NT$60,000  
**轉售價：** NT$45,000（75%）  
**持有天數：** 365 天  
**功率：** 70W，每天用 8 小時  
**電價：** NT$4/度

```
實際 CPD = (60,000 - 45,000) / 365 = NT$41.1/天
電費 = 0.07 kW × 8 hr × 4 / 365 = NT$6.1/天
總 CPD = NT$47.2/天
```

---

## 🗂️ 專案結構

```
cpd-tracker/
├── src/
│   ├── components/     # React 元件
│   ├── pages/          # 頁面組件
│   ├── hooks/          # 自訂 Hooks
│   ├── utils/          # 工具函數
│   ├── db.ts           # Dexie 資料庫
│   ├── pocketbase.ts   # PocketBase 客戶端（可選）
│   ├── syncService.ts  # 同步服務（可選）
│   └── types.ts        # TypeScript 類型
├── public/             # 靜態資源
├── docs/               # 文件
└── .github/
    └── workflows/      # GitHub Actions 部署
```

---

## 🎯 版本歷程

### v0.6.0 (最新)
- ✅ 自訂同步伺服器（使用者輸入 URL）
- ✅ 移除環境變數依賴
- ✅ 改進設定頁面 UI
- ✅ 同步功能完全可選

### v0.5.0
- ✅ 資產階層系統（System/Component/Accessory）
- ✅ 自動價格計算
- ✅ Rig Builder 批次建立

### v0.4.0
- ✅ 電費追蹤與計算
- ✅ 隱形成本分析
- ✅ 維護成本記錄

### v0.3.0
- ✅ 訂閱管理
- ✅ 中文在地化
- ✅ Dark Mode

---

## 📚 文件

- [USAGE.md](./docs/USAGE.md) - 詳細使用指南
- [Release Notes](./docs/) - 版本發布說明

### PocketBase 後端設定（可選）

如需啟用同步功能，請參考官方文件：
- [PocketBase 官方文件](https://pocketbase.io/docs/)
- [PocketBase GitHub](https://github.com/pocketbase/pocketbase)

**基本步驟：**
1. 下載並執行 PocketBase
2. 開啟 Admin UI (http://localhost:8090/_/)
3. 建立 Collections（參考 `src/pocketbase.ts` 中的介面定義）
4. 設定 API Rules（使用者只能存取自己的資料）
5. 在應用程式「設定」頁面輸入 URL

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 🙏 致謝

- [PocketBase](https://pocketbase.io/) - 輕量級後端解決方案
- [Dexie.js](https://dexie.org/) - IndexedDB 封裝
- [Shadcn/UI](https://ui.shadcn.com/) - UI 元件庫
- [Recharts](https://recharts.org/) - 圖表庫

---

## 📧 聯絡方式

如有問題或建議，歡迎開啟 Issue 討論。

**專案連結：** https://github.com/HeyLoon/cpd-tracker

---

**享受追蹤你的資產成本！** 🚀
