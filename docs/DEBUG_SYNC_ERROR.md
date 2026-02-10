# 診斷 "Something went wrong" 錯誤

## 🔍 錯誤原因分析

"Something went wrong while processing your request" 是 PocketBase 的通用錯誤訊息，通常由以下原因造成：

### 1. ❌ 欄位名稱不匹配
- 應用程式發送的欄位名稱與 PocketBase collection 的欄位名稱不一致
- 例如：發送 `purchase_date` 但 collection 中叫 `purchaseDate`

### 2. ❌ 必填欄位缺失
- Collection 中標記為 Required 的欄位，但應用程式沒有提供值

### 3. ❌ 資料類型不匹配
- 發送字串但欄位期待數字
- 發送無效的日期格式

### 4. ❌ Relation 欄位設定錯誤
- `user` 欄位的 collection ID 不正確
- 或 user ID 無效

### 5. ❌ API Rules 太嚴格
- Create rule 阻擋了合法的請求

---

## 🛠️ 診斷步驟

### 步驟 1：檢查瀏覽器控制台

1. 打開 CPD Tracker 應用程式
2. 按 **F12** 開啟開發者工具
3. 切換到 **Console** 分頁
4. 點擊「立即同步」按鈕
5. 查看控制台輸出，應該會看到：
   ```
   📤 準備上傳資產: [資產名稱]
   📤 PocketBase 資料: { ... }
   錯誤詳情: { ... }
   ```

**請截圖控制台的輸出並告訴我！**

---

### 步驟 2：檢查 PocketBase 欄位名稱

確認你的 Assets collection 中的欄位名稱**完全一致**：

| 應用程式發送 | PocketBase 欄位名稱 | 必須匹配 ✅ |
|-------------|-------------------|-----------|
| `name` | `name` | ✅ |
| `category` | `category` | ✅ |
| `price` | `price` | ✅ |
| `currency` | `currency` | ✅ |
| `purchase_date` | `purchase_date` | ⚠️ 不能是 `purchaseDate` |
| `target_lifespan` | `target_lifespan` | ⚠️ 不能是 `targetLifespan` |
| `status` | `status` | ✅ |
| `role` | `role` | ✅ |
| `system_id` | `system_id` | ⚠️ 不能是 `systemId` |
| `linked_asset_id` | `linked_asset_id` | ⚠️ 不能是 `linkedAssetId` |
| `notes` | `notes` | ✅ |
| `sold_price` | `sold_price` | ⚠️ 不能是 `soldPrice` |
| `power_watts` | `power_watts` | ⚠️ 不能是 `powerWatts` |
| `daily_usage_hours` | `daily_usage_hours` | ⚠️ 不能是 `dailyUsageHours` |
| `recurring_maintenance_cost` | `recurring_maintenance_cost` | ⚠️ 不能是 `recurringMaintenanceCost` |
| `maintenance_log` | `maintenance_log` | ⚠️ 不能是 `maintenanceLog` |
| `user` | `user` | ✅ |
| `synced` | `synced` | ✅ |
| `local_id` | `local_id` | ⚠️ 不能是 `localId` |

**重點：使用底線命名（snake_case），不要使用駝峰式（camelCase）！**

---

### 步驟 3：檢查必填欄位

在 PocketBase Admin UI 中，檢查 Assets collection：

#### 必須標記為 Required (✅) 的欄位：
- `name`
- `category`
- `price`
- `currency`
- `purchase_date`
- `status`
- `role`
- `user`

#### 必須標記為 NOT Required (⬜) 的欄位：
- `target_lifespan`
- `system_id`
- `linked_asset_id`
- `photo`
- `notes`
- `sold_price`
- `power_watts`
- `daily_usage_hours`
- `recurring_maintenance_cost`
- `maintenance_log`
- `synced`
- `local_id`

---

### 步驟 4：檢查欄位類型

| 欄位名稱 | 正確類型 |
|---------|---------|
| `name` | Text |
| `category` | Select |
| `price` | Number |
| `currency` | Select |
| `purchase_date` | Date |
| `target_lifespan` | Number |
| `status` | Select |
| `role` | Select |
| `system_id` | Text（不是 Relation） |
| `linked_asset_id` | Text（不是 Relation） |
| `photo` | File |
| `notes` | Text |
| `sold_price` | Number |
| `power_watts` | Number |
| `daily_usage_hours` | Number |
| `recurring_maintenance_cost` | Number |
| `maintenance_log` | JSON |
| `user` | Relation（指向 users） |
| `synced` | Bool |
| `local_id` | Text |

---

### 步驟 5：檢查 API Rules

Create rule 應該是：
```
@request.auth.id != "" && user = @request.auth.id
```

**測試更寬鬆的規則（臨時）：**
```
@request.auth.id != ""
```

如果改成這個規則後可以同步，代表原本的規則有問題。

---

## 🚀 快速修復方案

### 方案 1：重新創建 Assets Collection（推薦）

如果欄位名稱錯誤，最快的方式是刪除並重建：

1. 在 PocketBase Admin UI 刪除 `assets` collection
2. 重新創建，**嚴格按照上面的表格命名**
3. 特別注意：
   - 使用 `purchase_date` 不是 `purchaseDate`
   - 使用 `power_watts` 不是 `powerWatts`
   - 使用 `daily_usage_hours` 不是 `dailyUsageHours`
   - 等等...

### 方案 2：修改現有欄位名稱

如果已經有資料，可以重新命名欄位：

1. Admin UI → Collections → assets
2. 點擊欄位的編輯圖示
3. 修改 "Name" 為正確的名稱（snake_case）
4. 儲存

---

## 🧪 測試方法

### 使用 PocketBase API Preview 測試

1. Admin UI → Collections → assets
2. 點擊右上角的 **"API Preview"**
3. 選擇 **"Create"**
4. 在右側的 Body 中貼上：

```json
{
  "name": "測試資產",
  "category": "Tech",
  "price": 1000,
  "currency": "TWD",
  "purchase_date": "2024-01-01",
  "target_lifespan": 365,
  "status": "Active",
  "role": "Standalone",
  "system_id": "",
  "linked_asset_id": "",
  "notes": "測試",
  "sold_price": 0,
  "power_watts": 0,
  "daily_usage_hours": 0,
  "recurring_maintenance_cost": 0,
  "maintenance_log": [],
  "user": "你的使用者ID",
  "synced": true,
  "local_id": "test-123"
}
```

5. 將 `"user"` 的值改為你的 user ID（在右側可以看到）
6. 點擊 **"Send"** 按鈕
7. 檢查回應：
   - ✅ 成功：會回傳創建的記錄
   - ❌ 失敗：會顯示具體錯誤訊息

---

## 📋 檢查清單

完成以下檢查：

- [ ] 瀏覽器控制台顯示詳細錯誤（已啟用新的日誌）
- [ ] 所有欄位名稱使用 snake_case（底線分隔）
- [ ] 必填欄位都標記為 Required
- [ ] 非必填欄位都未標記 Required
- [ ] `user` 欄位是 Relation 類型，指向 `users` collection
- [ ] `system_id` 和 `linked_asset_id` 是 Text 類型（不是 Relation）
- [ ] API Rules 設定正確
- [ ] 使用 API Preview 測試創建成功

---

## 💬 回報資訊

如果還是無法解決，請提供：

1. **瀏覽器控制台截圖**（包含 "📤 PocketBase 資料" 和 "錯誤詳情"）
2. **PocketBase Admin UI 的 Assets collection 欄位列表截圖**
3. **PocketBase 版本**（Admin UI 左下角顯示）

我可以根據這些資訊提供更精確的解決方案！

---

## 🔄 更新代碼

我已經更新了 `src/syncService.ts`，現在會在控制台顯示更詳細的錯誤資訊。請：

1. **重新構建應用程式**：
   ```bash
   cd /Users/heyloon/work/cpd-tracker
   bun run build
   ```

2. **清除瀏覽器緩存並刷新**：
   - `Ctrl+Shift+R`（Windows）或 `Cmd+Shift+R`（Mac）

3. **再次嘗試同步並查看控制台輸出**

這樣我們就能看到具體是哪個欄位導致問題！
