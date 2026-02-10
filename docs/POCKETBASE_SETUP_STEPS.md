# PocketBase 設定步驟（詳細版）

## 問題：Invalid rule - unknown field "user"

**原因**：在創建 Collection 時立即設定 API Rules，但此時 `user` 欄位還不存在。

**解決**：先創建欄位，再設定 Rules。

---

## 📋 正確設定步驟

### 第一步：創建 Assets Collection（不設定 Rules）

1. 開啟 PocketBase Admin UI：`http://你的IP:8090/_/`
2. 點擊左側 "Collections"
3. 點擊右上角 "New collection"
4. 選擇 "Base collection"
5. 填寫：
   - **Name**: `assets`
   - **API Rules**: **保持空白**（或使用預設值，稍後再改）
6. **不要點 Create，繼續下一步**

---

### 第二步：新增所有欄位

點擊 "New field" 按鈕，逐一新增以下欄位：

#### 1. name（資產名稱）
- Type: **Text**
- Name: `name`
- ✅ Required
- 點擊 "Add field"

#### 2. category（分類）
- Type: **Select**
- Name: `category`
- ✅ Required
- Select type: **Single**
- Values（每行一個）:
  ```
  Tech
  Music
  Life
  Others
  ```
- 點擊 "Add field"

#### 3. price（價格）
- Type: **Number**
- Name: `price`
- ✅ Required
- 點擊 "Add field"

#### 4. currency（幣別）
- Type: **Select**
- Name: `currency`
- ✅ Required
- Select type: **Single**
- Values:
  ```
  TWD
  USD
  JPY
  ```
- 點擊 "Add field"

#### 5. purchase_date（購買日期）
- Type: **Date**
- Name: `purchase_date`
- ✅ Required
- 點擊 "Add field"

#### 6. target_lifespan（目標壽命）
- Type: **Number**
- Name: `target_lifespan`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 7. status（狀態）
- Type: **Select**
- Name: `status`
- ✅ Required
- Select type: **Single**
- Values:
  ```
  Active
  Sold
  Retired
  ```
- 點擊 "Add field"

#### 8. role（角色）
- Type: **Select**
- Name: `role`
- ✅ Required
- Select type: **Single**
- Values:
  ```
  Standalone
  System
  Component
  Accessory
  ```
- 點擊 "Add field"

#### 9. system_id（系統 ID）
- Type: **Text**
- Name: `system_id`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 10. linked_asset_id（連結資產 ID）
- Type: **Text**
- Name: `linked_asset_id`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 11. photo（照片）
- Type: **File**
- Name: `photo`
- ⬜ Required（不勾選）
- Max select: `1`
- Max size (bytes): `5242880`（5MB）
- Mime types（可選）: `image/jpeg`, `image/png`, `image/webp`
- Thumbs sizes: `100x100`, `500x500`
- 點擊 "Add field"

#### 12. notes（備註）
- Type: **Text**
- Name: `notes`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 13. sold_price（售價）
- Type: **Number**
- Name: `sold_price`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 14. power_watts（功率）
- Type: **Number**
- Name: `power_watts`
- ⬜ Required（不勾選）
- Min: `0`
- 點擊 "Add field"

#### 15. daily_usage_hours（每日使用時數）
- Type: **Number**
- Name: `daily_usage_hours`
- ⬜ Required（不勾選）
- Min: `0`
- Max: `24`
- 點擊 "Add field"

#### 16. recurring_maintenance_cost（維護成本）
- Type: **Number**
- Name: `recurring_maintenance_cost`
- ⬜ Required（不勾選）
- Min: `0`
- 點擊 "Add field"

#### 17. maintenance_log（維護記錄）
- Type: **JSON**
- Name: `maintenance_log`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 18. user（使用者）⭐ 重要！
- Type: **Relation**
- Name: `user`
- ✅ Required
- Collection: **users**（從下拉選單選擇）
- Relation type: **Single**（只能選一個）
- ✅ Cascade delete（勾選 - 使用者刪除時一併刪除資產）
- 點擊 "Add field"

#### 19. synced（已同步）
- Type: **Bool**
- Name: `synced`
- ⬜ Required（不勾選）
- 點擊 "Add field"

#### 20. local_id（本地 ID）
- Type: **Text**
- Name: `local_id`
- ⬜ Required（不勾選）
- 點擊 "Add field"

---

### 第三步：儲存 Collection

1. 確認所有欄位都已新增（應該有 20 個欄位）
2. 點擊底部的 **"Create"** 按鈕
3. Collection 創建成功！

---

### 第四步：設定 API Rules

1. 在 Collections 列表中，找到 `assets`
2. 點擊 `assets` 右側的 **齒輪圖示**（或編輯按鈕）
3. 點擊上方的 **"API Rules"** 分頁
4. 設定以下規則：

**List/Search rule（列表/搜尋規則）**
```
user = @request.auth.id
```

**View rule（查看規則）**
```
user = @request.auth.id
```

**Create rule（創建規則）**
```
@request.auth.id != "" && user = @request.auth.id
```

**Update rule（更新規則）**
```
user = @request.auth.id
```

**Delete rule（刪除規則）**
```
user = @request.auth.id
```

5. 點擊 **"Save changes"** 儲存

---

## 🎯 接著創建 Subscriptions Collection

重複上述步驟，但使用以下欄位：

### Subscriptions 欄位列表（12 個）

1. **name** - Text, Required
2. **cost** - Number, Required, Min: 0
3. **currency** - Select (Single), Required, Values: `TWD`, `USD`, `JPY`
4. **billing_cycle** - Select (Single), Required, Values: `Monthly`, `Quarterly`, `Yearly`
5. **start_date** - Date, Required
6. **category** - Select (Single), Required, Values: `Software`, `Service`, `Entertainment`
7. **status** - Select (Single), Required, Values: `Active`, `Cancelled`
8. **cancelled_date** - Date, Not required
9. **notes** - Text, Not required
10. **user** - Relation (Single), Required, Collection: `users`, Cascade delete: ✅
11. **synced** - Bool, Not required
12. **local_id** - Text, Not required

### API Rules（與 Assets 相同）
```
List/Search: user = @request.auth.id
View: user = @request.auth.id
Create: @request.auth.id != "" && user = @request.auth.id
Update: user = @request.auth.id
Delete: user = @request.auth.id
```

---

## ✅ 驗證設定

完成後檢查：

1. **Collections 頁面**應該顯示：
   - ✅ assets（20 個欄位）
   - ✅ subscriptions（12 個欄位）

2. **測試同步**：
   - 在 CPD Tracker 應用程式中登入
   - 新增一個資產
   - 點擊「立即同步」
   - 同步成功，錯誤訊息消失

3. **檢查資料**：
   - Admin UI → Collections → assets → Records
   - 應該看到剛才新增的資產

---

## 🐛 常見問題

### Q: 找不到 "users" collection？
A: PocketBase 預設有 `users` collection（系統內建），如果找不到：
1. 確認 PocketBase 版本 >= 0.8.0
2. 重新啟動 PocketBase
3. 或使用 `_pb_users_auth_` 作為 collection ID

### Q: Relation 欄位設定後無法儲存？
A: 確認：
- Collection 選擇的是 `users`（不是 `_users`）
- Relation type 選擇 "Single"
- 如果還是無法儲存，先不勾選 "Cascade delete"，稍後再編輯

### Q: API Rules 儲存後測試失敗？
A: 檢查：
- 規則中的 `user` 欄位名稱是否正確（區分大小寫）
- 使用者是否已登入（`@request.auth.id` 是否有值）
- 嘗試在 Admin UI 的 "API Preview" 測試規則

### Q: 可以跳過某些欄位嗎？
A: 以下欄位是必須的，其他可以暫時跳過：
- ✅ 必須：`name`, `category`, `price`, `currency`, `purchase_date`, `status`, `role`, `user`
- ⚠️ 建議：`synced`, `local_id`（同步需要）
- ⬜ 可選：其他欄位

---

## 📸 需要截圖輔助？

如果在創建過程中遇到問題，可以截圖以下畫面：
1. 新增欄位的表單
2. 錯誤訊息
3. Collections 列表

我可以根據截圖提供更具體的協助！
