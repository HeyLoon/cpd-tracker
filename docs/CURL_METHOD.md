# 🎯 最簡單的方法：使用 curl 命令創建 Collections

這個方法適用於所有 PocketBase 版本，不需要 Import 功能。

## 📋 前置準備

1. 確認 PocketBase 正在運行
2. 確認你有 Admin 帳號的登入資訊
3. 在終端機執行以下命令

---

## 🚀 步驟 1：登入並取得 Admin Token

```bash
# 替換成你的 Admin 帳號密碼
ADMIN_EMAIL="your_admin@email.com"
ADMIN_PASSWORD="your_password"
PB_URL="http://localhost:8090"  # 或你的 PocketBase URL

# 登入並取得 token
TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

如果成功，會顯示一長串 token。

---

## 🚀 步驟 2：創建 Assets Collection

```bash
curl -X POST "$PB_URL/api/collections" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "assets",
    "type": "base",
    "schema": [
      {"name": "name", "type": "text", "required": true},
      {"name": "category", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Tech", "Music", "Life", "Others"]}},
      {"name": "price", "type": "number", "required": true},
      {"name": "currency", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["TWD", "USD", "JPY"]}},
      {"name": "purchase_date", "type": "date", "required": true},
      {"name": "target_lifespan", "type": "number", "required": false},
      {"name": "status", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Active", "Sold", "Retired"]}},
      {"name": "role", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Standalone", "System", "Component", "Accessory"]}},
      {"name": "system_id", "type": "text", "required": false},
      {"name": "linked_asset_id", "type": "text", "required": false},
      {"name": "photo", "type": "file", "required": false, "options": {"maxSelect": 1, "maxSize": 5242880}},
      {"name": "notes", "type": "text", "required": false},
      {"name": "sold_price", "type": "number", "required": false},
      {"name": "power_watts", "type": "number", "required": false, "options": {"min": 0}},
      {"name": "daily_usage_hours", "type": "number", "required": false, "options": {"min": 0, "max": 24}},
      {"name": "recurring_maintenance_cost", "type": "number", "required": false, "options": {"min": 0}},
      {"name": "maintenance_log", "type": "json", "required": false},
      {"name": "user", "type": "relation", "required": true, "options": {"collectionId": "_pb_users_auth_", "maxSelect": 1, "cascadeDelete": true}},
      {"name": "synced", "type": "bool", "required": false},
      {"name": "local_id", "type": "text", "required": false}
    ],
    "listRule": "user = @request.auth.id",
    "viewRule": "user = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id"
  }'
```

---

## 🚀 步驟 3：創建 Subscriptions Collection

```bash
curl -X POST "$PB_URL/api/collections" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "subscriptions",
    "type": "base",
    "schema": [
      {"name": "name", "type": "text", "required": true},
      {"name": "cost", "type": "number", "required": true, "options": {"min": 0}},
      {"name": "currency", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["TWD", "USD", "JPY"]}},
      {"name": "billing_cycle", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Monthly", "Quarterly", "Yearly"]}},
      {"name": "start_date", "type": "date", "required": true},
      {"name": "category", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Software", "Service", "Entertainment"]}},
      {"name": "status", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Active", "Cancelled"]}},
      {"name": "cancelled_date", "type": "date", "required": false},
      {"name": "notes", "type": "text", "required": false},
      {"name": "user", "type": "relation", "required": true, "options": {"collectionId": "_pb_users_auth_", "maxSelect": 1, "cascadeDelete": true}},
      {"name": "synced", "type": "bool", "required": false},
      {"name": "local_id", "type": "text", "required": false}
    ],
    "listRule": "user = @request.auth.id",
    "viewRule": "user = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id"
  }'
```

---

## ✅ 驗證

```bash
# 檢查 collections 是否創建成功
curl "$PB_URL/api/collections" \
  -H "Authorization: $TOKEN"
```

應該會看到 `assets` 和 `subscriptions` 在列表中。

---

## 🐛 如果出錯

### 錯誤 1：Token 無效
- 重新執行步驟 1 取得新 token
- 確認 Admin 帳號密碼正確

### 錯誤 2：Collection 已存在
先刪除舊的：
```bash
# 刪除 assets
curl -X DELETE "$PB_URL/api/collections/assets" \
  -H "Authorization: $TOKEN"

# 刪除 subscriptions
curl -X DELETE "$PB_URL/api/collections/subscriptions" \
  -H "Authorization: $TOKEN"
```

然後重新創建。

---

## 📝 完整腳本（一次執行）

將所有命令組合成一個腳本：

```bash
#!/bin/bash

# 設定變數
ADMIN_EMAIL="your_admin@email.com"
ADMIN_PASSWORD="your_password"
PB_URL="http://localhost:8090"

# 取得 token
echo "正在登入..."
TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登入失敗"
  exit 1
fi

echo "✅ 登入成功"

# 刪除舊的 collections（如果存在）
echo "刪除舊的 collections..."
curl -s -X DELETE "$PB_URL/api/collections/assets" -H "Authorization: $TOKEN" > /dev/null 2>&1
curl -s -X DELETE "$PB_URL/api/collections/subscriptions" -H "Authorization: $TOKEN" > /dev/null 2>&1

# 創建 assets collection
echo "創建 assets collection..."
ASSETS_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "assets",
    "type": "base",
    "schema": [
      {"name": "name", "type": "text", "required": true},
      {"name": "category", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Tech", "Music", "Life", "Others"]}},
      {"name": "price", "type": "number", "required": true},
      {"name": "currency", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["TWD", "USD", "JPY"]}},
      {"name": "purchase_date", "type": "date", "required": true},
      {"name": "target_lifespan", "type": "number", "required": false},
      {"name": "status", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Active", "Sold", "Retired"]}},
      {"name": "role", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Standalone", "System", "Component", "Accessory"]}},
      {"name": "system_id", "type": "text", "required": false},
      {"name": "linked_asset_id", "type": "text", "required": false},
      {"name": "photo", "type": "file", "required": false, "options": {"maxSelect": 1, "maxSize": 5242880}},
      {"name": "notes", "type": "text", "required": false},
      {"name": "sold_price", "type": "number", "required": false},
      {"name": "power_watts", "type": "number", "required": false, "options": {"min": 0}},
      {"name": "daily_usage_hours", "type": "number", "required": false, "options": {"min": 0, "max": 24}},
      {"name": "recurring_maintenance_cost", "type": "number", "required": false, "options": {"min": 0}},
      {"name": "maintenance_log", "type": "json", "required": false},
      {"name": "user", "type": "relation", "required": true, "options": {"collectionId": "_pb_users_auth_", "maxSelect": 1, "cascadeDelete": true}},
      {"name": "synced", "type": "bool", "required": false},
      {"name": "local_id", "type": "text", "required": false}
    ],
    "listRule": "user = @request.auth.id",
    "viewRule": "user = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id"
  }')

if echo "$ASSETS_RESPONSE" | grep -q '"id"'; then
  echo "✅ Assets collection 創建成功"
else
  echo "❌ Assets collection 創建失敗"
  echo "$ASSETS_RESPONSE"
fi

# 創建 subscriptions collection
echo "創建 subscriptions collection..."
SUBS_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "subscriptions",
    "type": "base",
    "schema": [
      {"name": "name", "type": "text", "required": true},
      {"name": "cost", "type": "number", "required": true, "options": {"min": 0}},
      {"name": "currency", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["TWD", "USD", "JPY"]}},
      {"name": "billing_cycle", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Monthly", "Quarterly", "Yearly"]}},
      {"name": "start_date", "type": "date", "required": true},
      {"name": "category", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Software", "Service", "Entertainment"]}},
      {"name": "status", "type": "select", "required": true, "options": {"maxSelect": 1, "values": ["Active", "Cancelled"]}},
      {"name": "cancelled_date", "type": "date", "required": false},
      {"name": "notes", "type": "text", "required": false},
      {"name": "user", "type": "relation", "required": true, "options": {"collectionId": "_pb_users_auth_", "maxSelect": 1, "cascadeDelete": true}},
      {"name": "synced", "type": "bool", "required": false},
      {"name": "local_id", "type": "text", "required": false}
    ],
    "listRule": "user = @request.auth.id",
    "viewRule": "user = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id"
  }')

if echo "$SUBS_RESPONSE" | grep -q '"id"'; then
  echo "✅ Subscriptions collection 創建成功"
else
  echo "❌ Subscriptions collection 創建失敗"
  echo "$SUBS_RESPONSE"
fi

echo ""
echo "🎉 完成！請到 Admin UI 檢查 collections"
```

儲存為 `create_collections.sh`，然後執行：

```bash
chmod +x create_collections.sh
./create_collections.sh
```

---

## 💡 這個方法的優點

- ✅ 適用所有 PocketBase 版本
- ✅ 不需要 Import 功能
- ✅ 可以自動化
- ✅ 可以重複執行（會先刪除舊的）
- ✅ 立即生效，不需要重啟 PocketBase
