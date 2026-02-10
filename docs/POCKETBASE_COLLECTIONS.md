# PocketBase Collections 設定指南

## 方法 1：使用 PocketBase Admin UI 手動創建（推薦）

### 1. 創建 Assets Collection

1. 開啟 PocketBase Admin UI：`http://你的IP:8090/_/`
2. 點擊左側 "Collections" → 點擊 "New collection"
3. 選擇 "Base collection"
4. 設定基本資訊：
   - **Name**: `assets`
   - **Type**: Base collection

5. 點擊 "New field" 逐一新增以下欄位：

| Field name | Field type | Options | Required |
|------------|-----------|---------|----------|
| `name` | Text | - | ✅ Yes |
| `category` | Select (Single) | Values: `Tech`, `Music`, `Life`, `Others` | ✅ Yes |
| `price` | Number | - | ✅ Yes |
| `currency` | Select (Single) | Values: `TWD`, `USD`, `JPY` | ✅ Yes |
| `purchase_date` | Date | - | ✅ Yes |
| `target_lifespan` | Number | - | No |
| `status` | Select (Single) | Values: `Active`, `Sold`, `Retired` | ✅ Yes |
| `role` | Select (Single) | Values: `Standalone`, `System`, `Component`, `Accessory` | ✅ Yes |
| `system_id` | Text | - | No |
| `linked_asset_id` | Text | - | No |
| `photo` | File | Max files: 1, Max size: 5MB | No |
| `notes` | Text | - | No |
| `sold_price` | Number | - | No |
| `power_watts` | Number | Min: 0 | No |
| `daily_usage_hours` | Number | Min: 0, Max: 24 | No |
| `recurring_maintenance_cost` | Number | Min: 0 | No |
| `maintenance_log` | JSON | - | No |
| `user` | Relation (Single) | Collection: `users`, Cascade delete: ✅ | ✅ Yes |
| `synced` | Bool | - | No |
| `local_id` | Text | - | No |

6. 設定 API Rules（在 "API Rules" 分頁）：
   - **List/Search rule**: `user = @request.auth.id`
   - **View rule**: `user = @request.auth.id`
   - **Create rule**: `@request.auth.id != "" && user = @request.auth.id`
   - **Update rule**: `user = @request.auth.id`
   - **Delete rule**: `user = @request.auth.id`

7. 點擊 "Create" 儲存

---

### 2. 創建 Subscriptions Collection

1. 點擊 "New collection" → "Base collection"
2. 設定基本資訊：
   - **Name**: `subscriptions`
   - **Type**: Base collection

3. 點擊 "New field" 逐一新增以下欄位：

| Field name | Field type | Options | Required |
|------------|-----------|---------|----------|
| `name` | Text | - | ✅ Yes |
| `cost` | Number | Min: 0 | ✅ Yes |
| `currency` | Select (Single) | Values: `TWD`, `USD`, `JPY` | ✅ Yes |
| `billing_cycle` | Select (Single) | Values: `Monthly`, `Quarterly`, `Yearly` | ✅ Yes |
| `start_date` | Date | - | ✅ Yes |
| `category` | Select (Single) | Values: `Software`, `Service`, `Entertainment` | ✅ Yes |
| `status` | Select (Single) | Values: `Active`, `Cancelled` | ✅ Yes |
| `cancelled_date` | Date | - | No |
| `notes` | Text | - | No |
| `user` | Relation (Single) | Collection: `users`, Cascade delete: ✅ | ✅ Yes |
| `synced` | Bool | - | No |
| `local_id` | Text | - | No |

4. 設定 API Rules（在 "API Rules" 分頁）：
   - **List/Search rule**: `user = @request.auth.id`
   - **View rule**: `user = @request.auth.id`
   - **Create rule**: `@request.auth.id != "" && user = @request.auth.id`
   - **Update rule**: `user = @request.auth.id`
   - **Delete rule**: `user = @request.auth.id`

5. 點擊 "Create" 儲存

---

## 方法 2：使用 PocketBase CLI 導入（進階）

### 步驟 1：停止 PocketBase

```bash
# 按 Ctrl+C 停止正在運行的 PocketBase
```

### 步驟 2：下載 schema 檔案

將以下兩個檔案儲存到你的電腦：

**檔案 1: `pb_schema_assets.json`**
```json
{
  "id": "assets_collection",
  "name": "assets",
  "type": "base",
  "system": false,
  "schema": [
    {
      "id": "field_name",
      "name": "name",
      "type": "text",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "id": "field_category",
      "name": "category",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["Tech", "Music", "Life", "Others"]
      }
    },
    {
      "id": "field_price",
      "name": "price",
      "type": "number",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "noDecimal": false
      }
    },
    {
      "id": "field_currency",
      "name": "currency",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["TWD", "USD", "JPY"]
      }
    },
    {
      "id": "field_purchase_date",
      "name": "purchase_date",
      "type": "date",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "min": "",
        "max": ""
      }
    },
    {
      "id": "field_target_lifespan",
      "name": "target_lifespan",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "noDecimal": false
      }
    },
    {
      "id": "field_status",
      "name": "status",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["Active", "Sold", "Retired"]
      }
    },
    {
      "id": "field_role",
      "name": "role",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["Standalone", "System", "Component", "Accessory"]
      }
    },
    {
      "id": "field_system_id",
      "name": "system_id",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "id": "field_linked_asset_id",
      "name": "linked_asset_id",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "id": "field_photo",
      "name": "photo",
      "type": "file",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "mimeTypes": ["image/jpeg", "image/png", "image/webp"],
        "thumbs": ["100x100", "500x500"],
        "maxSelect": 1,
        "maxSize": 5242880,
        "protected": false
      }
    },
    {
      "id": "field_notes",
      "name": "notes",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "id": "field_sold_price",
      "name": "sold_price",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "noDecimal": false
      }
    },
    {
      "id": "field_power_watts",
      "name": "power_watts",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": 0,
        "max": null,
        "noDecimal": false
      }
    },
    {
      "id": "field_daily_usage_hours",
      "name": "daily_usage_hours",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": 0,
        "max": 24,
        "noDecimal": false
      }
    },
    {
      "id": "field_recurring_maintenance_cost",
      "name": "recurring_maintenance_cost",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": 0,
        "max": null,
        "noDecimal": false
      }
    },
    {
      "id": "field_maintenance_log",
      "name": "maintenance_log",
      "type": "json",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSize": 2000000
      }
    },
    {
      "id": "field_user",
      "name": "user",
      "type": "relation",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": null
      }
    },
    {
      "id": "field_synced",
      "name": "synced",
      "type": "bool",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {}
    },
    {
      "id": "field_local_id",
      "name": "local_id",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    }
  ],
  "indexes": [],
  "listRule": "user = @request.auth.id",
  "viewRule": "user = @request.auth.id",
  "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
  "updateRule": "user = @request.auth.id",
  "deleteRule": "user = @request.auth.id"
}
```

**檔案 2: `pb_schema_subscriptions.json`**
```json
{
  "id": "subscriptions_collection",
  "name": "subscriptions",
  "type": "base",
  "system": false,
  "schema": [
    {
      "id": "field_name",
      "name": "name",
      "type": "text",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "id": "field_cost",
      "name": "cost",
      "type": "number",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "min": 0,
        "max": null,
        "noDecimal": false
      }
    },
    {
      "id": "field_currency",
      "name": "currency",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["TWD", "USD", "JPY"]
      }
    },
    {
      "id": "field_billing_cycle",
      "name": "billing_cycle",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["Monthly", "Quarterly", "Yearly"]
      }
    },
    {
      "id": "field_start_date",
      "name": "start_date",
      "type": "date",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "min": "",
        "max": ""
      }
    },
    {
      "id": "field_category",
      "name": "category",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["Software", "Service", "Entertainment"]
      }
    },
    {
      "id": "field_status",
      "name": "status",
      "type": "select",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": ["Active", "Cancelled"]
      }
    },
    {
      "id": "field_cancelled_date",
      "name": "cancelled_date",
      "type": "date",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": "",
        "max": ""
      }
    },
    {
      "id": "field_notes",
      "name": "notes",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "id": "field_user",
      "name": "user",
      "type": "relation",
      "required": true,
      "presentable": false,
      "unique": false,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": null
      }
    },
    {
      "id": "field_synced",
      "name": "synced",
      "type": "bool",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {}
    },
    {
      "id": "field_local_id",
      "name": "local_id",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    }
  ],
  "indexes": [],
  "listRule": "user = @request.auth.id",
  "viewRule": "user = @request.auth.id",
  "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
  "updateRule": "user = @request.auth.id",
  "deleteRule": "user = @request.auth.id"
}
```

### 步驟 3：導入到 PocketBase

**選項 A：使用 Admin UI 導入（較新版本支援）**
1. 開啟 PocketBase Admin UI
2. 進入 Collections 頁面
3. 點擊右上角的 "Import collections" 按鈕
4. 將上面的 JSON 內容貼上
5. 點擊 "Import"

**選項 B：使用資料庫直接操作（不推薦）**
- 需要直接修改 `pb_data/data.db` SQLite 檔案（較複雜，容易出錯）

---

## 方法 3：最簡單的方式 - 使用截圖對照手動創建

我建議使用 **方法 1（手動創建）**，因為：
- ✅ 最穩定，不會有版本相容問題
- ✅ 可以邊創建邊檢查每個欄位
- ✅ 不需要處理 JSON 格式問題
- ✅ 適用於所有 PocketBase 版本

只需要 5-10 分鐘即可完成！

---

## 驗證設定是否正確

完成後，在 PocketBase Admin UI 檢查：

1. **Collections 列表**應該顯示：
   - ✅ `assets`
   - ✅ `subscriptions`

2. **測試 API**：
   - 在應用程式中登入
   - 新增一個資產
   - 點擊「立即同步」
   - 應該成功上傳，錯誤訊息消失

3. **檢查資料**：
   - 在 PocketBase Admin UI → Collections → assets
   - 應該看到你剛才新增的資產記錄

---

## 常見問題

### Q: 為什麼 JSON 導入會失敗？
A: PocketBase 的 schema 格式在不同版本間略有差異，且 Import 功能需要完整的 collection 匯出格式（包含 migrations）。手動創建是最可靠的方式。

### Q: 我可以跳過某些欄位嗎？
A: 建議全部創建，但以下欄位可以暫時跳過（如果不需要該功能）：
- `photo`（如果不上傳照片）
- `maintenance_log`（如果不記錄維護）
- `system_id` / `linked_asset_id`（如果不使用階層功能）

### Q: API Rules 設定錯誤會怎樣？
A: 如果 Rules 設定不正確，用戶可能看到別人的資料，或無法同步。務必使用 `user = @request.auth.id` 來限制只能存取自己的資料。

---

## 需要幫助？

如果手動創建時遇到問題，可以截圖 PocketBase Admin UI 的錯誤訊息，我可以幫你解決！
