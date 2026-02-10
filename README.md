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
- 支援 **Supabase**（雲端託管，推薦）或 **PocketBase**（自架後端）
- 使用者可自行選擇並設定後端
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
- 🔧 可選：在「設定」頁面設定 Supabase 或 PocketBase 啟用同步

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

**選項 1: Supabase（推薦）**
```
Supabase (Cloud-Hosted)
├── 資料庫: PostgreSQL
├── 認證: Email/Password (JWT)
├── 優點: 免費層級、無需自架、全球 CDN
└── 設定: 一條 SQL 腳本即可完成
```

**選項 2: PocketBase（進階）**
```
PocketBase (Self-Hosted)
├── 資料庫: SQLite
├── 認證: Email/Password
├── 優點: 完全掌控、無使用限制
└── 設定: 需要自己的伺服器
```

### 同步策略（可選）
```
使用者操作 → IndexedDB（立即儲存）
         ↓
    (如果設定了後端)
         ↓
  Supabase/PocketBase（背景同步）
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

如果你想在多裝置間同步資料，有兩種選擇：

#### 選項 1: Supabase（推薦新手）

**優點：**
- ☁️ 雲端託管，無需自己架伺服器
- 🆓 免費層級（500MB 資料庫、1GB 檔案儲存）
- ⚡ 5 分鐘完成設定
- 🌐 全球 CDN，速度快

**設定步驟：**

1. **建立 Supabase 專案**
   - 前往 [supabase.com](https://supabase.com) 註冊（免費）
   - 建立新專案（選擇離你最近的區域）
   
2. **執行 SQL 腳本**
   - 在 Supabase Dashboard 點擊 "SQL Editor"
   - 複製 `cpd-tracker/supabase/schema.sql` 的內容
   - 貼上並執行
   
3. **取得連線資訊**
   - 點擊 Settings → API
   - 複製 "Project URL"（如：`https://xxxxx.supabase.co`）
   - 複製 "anon public" key
   
4. **在 CPD Tracker 設定**
   - 開啟「設定」頁面
   - 選擇「Supabase」
   - 貼上 URL 和 Anon Key
   - 點擊「儲存設定」
   
5. **註冊/登入帳號**
   - 前往「登入」頁面
   - 註冊新帳號（會顯示「使用 Supabase 同步」）
   - 資料開始自動同步！

6. **在其他裝置重複步驟 4-5**
   - 使用相同的 Supabase URL 和 Key
   - 用同一個帳號登入
   - 資料會自動同步

**詳細文件：** 請參考 [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)

---

#### 選項 2: PocketBase（適合進階使用者）

**優點：**
- 🏠 資料完全在你的掌控中
- 💰 無使用量限制
- 🚀 單一執行檔，輕鬆部署
- 🔒 適合注重隱私的使用者

**設定步驟：**

1. **部署 PocketBase 後端**
   ```bash
   # 在你的伺服器上（Linux/Orange Pi/Raspberry Pi）
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_linux_arm64.zip
   unzip pocketbase_0.26.8_linux_arm64.zip
   ./pocketbase serve --http=0.0.0.0:8090
   ```

2. **建立資料結構**
   - 開啟 Admin UI (`http://你的IP:8090/_/`)
   - 建立 Collections（參考 `pocketbase_collections/` 目錄）
   - 設定 API Rules

3. **在 CPD Tracker 設定**
   - 開啟「設定」頁面
   - 選擇「PocketBase」
   - 輸入 URL（如：`http://192.168.1.100:8090`）
   - 點擊「儲存設定」

4. **註冊/登入帳號**
   - 前往「登入」頁面
   - 註冊新帳號
   - 資料開始自動同步

5. **在其他裝置重複步驟 3-4**

**詳細文件：** 請參考 [docs/POCKETBASE_SETUP_STEPS.md](./docs/POCKETBASE_SETUP_STEPS.md)

---

#### 比較表

| 特性 | Supabase | PocketBase |
|------|----------|------------|
| 設定難度 | ⭐ 簡單 | ⭐⭐⭐ 中等 |
| 託管方式 | 雲端 | 自架 |
| 費用 | 免費層級 | 完全免費 |
| 資料掌控 | Supabase 代管 | 完全自主 |
| 設定時間 | 5 分鐘 | 30 分鐘 |
| 推薦對象 | 一般使用者 | 技術玩家 |

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
│   ├── components/        # React 元件
│   ├── pages/             # 頁面組件
│   ├── hooks/             # 自訂 Hooks
│   ├── utils/             # 工具函數
│   ├── db.ts              # Dexie 資料庫
│   ├── supabase.ts        # Supabase 客戶端（可選）
│   ├── pocketbase.ts      # PocketBase 客戶端（可選）
│   ├── supabaseSyncService.ts  # Supabase 同步（可選）
│   ├── syncService.ts     # PocketBase 同步（可選）
│   └── types.ts           # TypeScript 類型
├── public/                # 靜態資源
├── docs/                  # 文件
│   ├── SUPABASE_SETUP.md  # Supabase 設定指南
│   └── POCKETBASE_SETUP_STEPS.md  # PocketBase 設定指南
├── supabase/
│   └── schema.sql         # Supabase 資料庫結構
└── .github/
    └── workflows/         # GitHub Actions 部署
```

---

## 🎯 版本歷程

### v0.6.0 (最新)
- ✅ 支援 Supabase 雲端同步（推薦）
- ✅ 支援 PocketBase 自架後端
- ✅ 雙後端選擇器
- ✅ 自訂同步伺服器（使用者輸入配置）
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
- [SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) - Supabase 設定教學（推薦）
- [POCKETBASE_SETUP_STEPS.md](./docs/POCKETBASE_SETUP_STEPS.md) - PocketBase 設定教學
- [Release Notes](./docs/) - 版本發布說明

### 後端設定指南（可選）

#### Supabase（推薦新手）
完整教學請參考：[docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)

**快速開始：**
1. 前往 [supabase.com](https://supabase.com) 註冊
2. 建立專案並執行 SQL 腳本（在 `supabase/schema.sql`）
3. 複製 Project URL 和 anon key
4. 在 CPD Tracker 設定頁面貼上

#### PocketBase（進階使用者）
完整教學請參考：[docs/POCKETBASE_SETUP_STEPS.md](./docs/POCKETBASE_SETUP_STEPS.md)

**快速開始：**
1. 下載並執行 PocketBase
2. 開啟 Admin UI (http://localhost:8090/_/)
3. 建立 Collections（參考 `pocketbase_collections/` 目錄）
4. 設定 API Rules（使用者只能存取自己的資料）
5. 在 CPD Tracker 設定頁面輸入 URL

**相關資源：**
- [Supabase 官方文件](https://supabase.com/docs)
- [PocketBase 官方文件](https://pocketbase.io/docs/)
- [PocketBase GitHub](https://github.com/pocketbase/pocketbase)

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

- [Supabase](https://supabase.com/) - 開源 Firebase 替代方案
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
