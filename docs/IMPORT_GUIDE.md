# PocketBase Collections 導入指南

## 📁 檔案說明

已為你生成三個 JSON 檔案：

1. **`pb_schema.json`** - 包含 assets 和 subscriptions 兩個 collections（推薦）
2. **`assets_only.json`** - 只有 assets collection（單獨導入用）
3. **`subscriptions_only.json`** - 只有 subscriptions collection（單獨導入用）

---

## 🚀 導入步驟（三種方法）

### 方法 1：使用 PocketBase Admin UI 導入（最簡單）⭐

#### 步驟 1：刪除現有的 collections（如果有）

1. 開啟 PocketBase Admin UI：`http://你的IP:8090/_/`
2. 進入 **Collections** 頁面
3. 如果已經有 `assets` 或 `subscriptions` collection：
   - 點擊 collection 右側的 **垃圾桶圖示** 刪除
   - 確認刪除

#### 步驟 2：導入 JSON 檔案

1. 在 Collections 頁面，點擊右上角的 **"Import collections"** 按鈕
   - 如果找不到這個按鈕，代表你的 PocketBase 版本不支援直接導入
   - 請使用方法 2 或方法 3

2. 將 `pb_schema.json` 的內容複製並貼上到輸入框中

3. 點擊 **"Import"** 按鈕

4. 應該會看到成功訊息，並且出現：
   - ✅ `assets` collection
   - ✅ `subscriptions` collection

#### 步驟 3：驗證導入結果

1. 點擊 `assets` collection 查看欄位列表
2. 檢查是否有 20 個欄位（如下表）
3. 點擊 `subscriptions` collection 查看欄位列表
4. 檢查是否有 12 個欄位

**Assets Collection 應該有的欄位：**
- name, category, price, currency, purchase_date
- target_lifespan, status, role, system_id, linked_asset_id
- photo, notes, sold_price, power_watts, daily_usage_hours
- recurring_maintenance_cost, maintenance_log, user, synced, local_id

**Subscriptions Collection 應該有的欄位：**
- name, cost, currency, billing_cycle, start_date
- category, status, cancelled_date, notes, user, synced, local_id

---

### 方法 2：使用命令列導入（進階）

#### 步驟 1：準備檔案

將 JSON 檔案複製到你的 PocketBase 伺服器上：

```bash
# 假設你在本地開發機器上
cd /Users/heyloon/work/cpd-tracker/pocketbase_collections

# 複製到 PocketBase 伺服器（根據你的環境調整）
# 選項 A：本機
cp pb_schema.json /path/to/pocketbase/

# 選項 B：遠端伺服器（例如 Orange Pi）
scp pb_schema.json user@192.168.1.100:/home/user/pocketbase/
```

#### 步驟 2：停止 PocketBase

```bash
# 在你的伺服器上
# 按 Ctrl+C 停止正在運行的 PocketBase
```

#### 步驟 3：執行導入（如果 PocketBase 支援）

```bash
# 注意：並非所有版本都支援 CLI 導入
# 如果失敗，請使用方法 1 或方法 3

# 嘗試執行（根據 PocketBase 版本而定）
./pocketbase collections import pb_schema.json
```

#### 步驟 4：重新啟動 PocketBase

```bash
./pocketbase serve --http=0.0.0.0:8090
```

---

### 方法 3：如果 Import 功能不可用（手動輸入，但使用 JSON 參考）

如果你的 PocketBase 版本不支援 Import 功能：

1. **打開 `pb_schema.json` 檔案作為參考**
2. **手動創建 collections**，但可以快速複製 JSON 中的資訊

#### 創建 Assets Collection

1. New collection → Base collection
2. Name: `assets`
3. 參考 JSON 中的 `schema` 陣列，逐一新增欄位
4. 每個欄位的設定都在 JSON 中有詳細定義

**快速參考（從 JSON）：**
```json
{
  "name": "name",
  "type": "text",
  "required": true,
  ...
}
```
對應到 Admin UI：
- Field name: `name`
- Type: Text
- Required: ✅

#### 創建 Subscriptions Collection

重複上述步驟，但使用 JSON 中 subscriptions 的 schema。

---

## 🧪 驗證導入是否成功

### 測試 1：使用 API Preview

1. Admin UI → Collections → assets
2. 點擊 **"API Preview"** → 選擇 **"Create"**
3. 在 Body 中貼上：

```json
{
  "name": "測試資產",
  "category": "Tech",
  "price": 1000,
  "currency": "TWD",
  "purchase_date": "2024-01-01",
  "status": "Active",
  "role": "Standalone",
  "power_watts": 0,
  "daily_usage_hours": 0,
  "recurring_maintenance_cost": 0,
  "maintenance_log": [],
  "user": "你的user_id",
  "synced": true
}
```

4. 替換 `"user"` 的值為你的實際 user ID（右側會顯示）
5. 點擊 **Send**
6. 應該回傳成功（200 OK）

### 測試 2：使用應用程式同步

1. 開啟 CPD Tracker 應用程式
2. 確認已登入
3. 新增一個資產
4. 點擊「立即同步」
5. 應該顯示「已同步」，沒有錯誤訊息

---

## ⚠️ 常見問題

### Q: Import 按鈕找不到？

A: 你的 PocketBase 版本可能不支援 Import 功能。請：
1. 升級到最新版 PocketBase（建議 v0.22.0+）
2. 或使用方法 3 手動創建

### Q: 導入後顯示 "Invalid configuration"？

A: 可能原因：
1. JSON 格式錯誤（複製時可能有問題）
2. PocketBase 版本太舊
3. 嘗試單獨導入 `assets_only.json` 和 `subscriptions_only.json`

### Q: 導入成功但同步還是失敗？

A: 檢查：
1. API Rules 是否正確（應該已自動設定）
2. 在 Admin UI 確認 `user` 欄位是 Relation 類型，指向 `users`
3. 查看瀏覽器控制台的詳細錯誤

### Q: 我的 PocketBase 版本是多少？

A: 在 PocketBase Admin UI 左下角會顯示版本號，例如 `v0.22.9`

---

## 📋 檔案路徑

三個 JSON 檔案已存放在：

```
/Users/heyloon/work/cpd-tracker/pocketbase_collections/
├── pb_schema.json           # 完整 schema（推薦）
├── assets_only.json         # 只有 assets
└── subscriptions_only.json  # 只有 subscriptions
```

你可以：
1. 在本機查看這些檔案
2. 複製內容到 PocketBase Admin UI
3. 或通過 SCP 傳送到遠端伺服器

---

## 🎯 下一步

導入成功後：

1. **測試同步功能**
   - 在應用程式中新增資產
   - 點擊「立即同步」
   - 檢查 PocketBase Admin UI 是否有新記錄

2. **檢查資料**
   - Admin UI → Collections → assets → Records
   - 應該看到你的資產

3. **享受同步功能** 🎉

---

## 💬 需要幫助？

如果導入過程中遇到任何問題，請提供：

1. PocketBase 版本號
2. 錯誤訊息截圖
3. 是否有看到 "Import collections" 按鈕

我會協助你解決！
