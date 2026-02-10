#!/bin/bash

# PocketBase Collections 自動創建腳本
# 使用方法：./create_collections.sh

echo "======================================"
echo "  PocketBase Collections 創建工具"
echo "======================================"
echo ""

# 提示輸入資訊
read -p "請輸入 PocketBase URL (例如 http://localhost:8090): " PB_URL
read -p "請輸入 Admin Email: " ADMIN_EMAIL
read -sp "請輸入 Admin Password: " ADMIN_PASSWORD
echo ""
echo ""

# 取得 token
echo "🔐 正在登入..."
TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登入失敗！請檢查 Email 和 Password 是否正確"
  exit 1
fi

echo "✅ 登入成功！"
echo ""

# 刪除舊的 collections（如果存在）
echo "🗑️  刪除舊的 collections（如果存在）..."
curl -s -X DELETE "$PB_URL/api/collections/assets" -H "Authorization: $TOKEN" > /dev/null 2>&1
curl -s -X DELETE "$PB_URL/api/collections/subscriptions" -H "Authorization: $TOKEN" > /dev/null 2>&1
echo "✅ 清理完成"
echo ""

# 創建 assets collection
echo "📦 創建 assets collection..."
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
  echo "✅ Assets collection 創建成功（20 個欄位）"
else
  echo "❌ Assets collection 創建失敗"
  echo "錯誤詳情: $ASSETS_RESPONSE"
  exit 1
fi
echo ""

# 創建 subscriptions collection
echo "📋 創建 subscriptions collection..."
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
  echo "✅ Subscriptions collection 創建成功（12 個欄位）"
else
  echo "❌ Subscriptions collection 創建失敗"
  echo "錯誤詳情: $SUBS_RESPONSE"
  exit 1
fi
echo ""

echo "======================================"
echo "  🎉 完成！"
echo "======================================"
echo ""
echo "✅ Assets collection - 已創建"
echo "✅ Subscriptions collection - 已創建"
echo ""
echo "請到 PocketBase Admin UI 檢查："
echo "$PB_URL/_/"
echo ""
echo "接下來："
echo "1. 在應用程式中登入"
echo "2. 新增一個資產"
echo "3. 點擊「立即同步」"
echo "4. 應該成功同步！"
echo ""
