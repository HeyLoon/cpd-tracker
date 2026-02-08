# PocketBase 設定指南

本文檔說明如何在 Orange Pi 5 Plus 上部署 PocketBase，並設定 CPD Tracker 所需的資料庫架構。

---

## 📦 部署 PocketBase (Docker)

### 1. 建立 Docker Compose 檔案

在 Orange Pi 上建立工作目錄：

```bash
mkdir -p ~/cpd-pocketbase
cd ~/cpd-pocketbase
```

建立 `docker-compose.yml`（見專案根目錄的 `docker-compose.yml`）。

### 2. 啟動 PocketBase

```bash
# 啟動服務
docker-compose up -d

# 查看日誌
docker-compose logs -f pocketbase

# 停止服務
docker-compose down
```

### 3. 首次設定

1. 瀏覽器開啟 `http://<Orange-Pi-IP>:8090/_/`
2. 建立管理員帳號（Email + 密碼）
3. 進入管理後台

---

## 🗄️ 資料庫架構設定

### Collection 1: `users` (系統內建)

PocketBase 自動建立，無需手動設定。需啟用以下功能：

- ✅ **Email/Password Auth** (已預設啟用)
- ✅ **API Rules:**
  - `listRule`: `@request.auth.id != ""`
  - `viewRule`: `@request.auth.id = id`
  - `createRule`: 允許註冊 (留空或設定條件)
  - `updateRule`: `@request.auth.id = id`
  - `deleteRule`: `@request.auth.id = id`

---

### Collection 2: `assets` (實體資產)

#### 基本設定
- **Name:** `assets`
- **Type:** Base Collection
- **List/Search Rule:** `@request.auth.id != "" && user = @request.auth.id`
- **View/Create/Update/Delete Rule:** `@request.auth.id = user`

#### 欄位定義 (Schema)

| 欄位名稱 | 類型 | 必填 | 說明 | 設定 |
|---------|------|------|------|------|
| `name` | Text | ✅ | 資產名稱 | Min: 1, Max: 200 |
| `category` | Select | ✅ | 分類 | Options: `Tech`, `Music`, `Life`, `Others` |
| `price` | Number | ✅ | 購買價格 | Min: 0 |
| `currency` | Select | ✅ | 幣別 | Options: `TWD`, `USD`, `JPY` |
| `purchase_date` | Date | ✅ | 購買日期 | - |
| `target_lifespan` | Number | ✅ | 目標壽命（天數） | Min: 1, Default: 1095 |
| `status` | Select | ✅ | 狀態 | Options: `Active`, `Sold`, `Retired`, Default: `Active` |
| `role` | Select | ✅ | 角色 | Options: `Standalone`, `System`, `Component`, `Accessory`, Default: `Standalone` |
| `system_id` | Relation | ❌ | 所屬系統 ID | Relation to `assets`, Allow NULL |
| `linked_asset_id` | Relation | ❌ | 連結的資產 ID | Relation to `assets`, Allow NULL |
| `photo` | File | ❌ | 資產照片 | Max files: 1, Max size: 5MB, Types: `image/jpeg`, `image/png`, `image/webp` |
| `notes` | Text | ❌ | 備註 | Max: 1000 |
| `sold_price` | Number | ❌ | 售出價格 | Min: 0 |
| `power_watts` | Number | ❌ | 功率（瓦） | Min: 0, Default: 0 |
| `daily_usage_hours` | Number | ❌ | 每日使用時數 | Min: 0, Max: 24, Default: 0 |
| `recurring_maintenance_cost` | Number | ❌ | 年度維護成本 | Min: 0, Default: 0 |
| `maintenance_log` | JSON | ❌ | 維護記錄 | 格式見下方 |
| `user` | Relation | ✅ | 所屬使用者 | Relation to `users`, Required |
| `synced` | Bool | ✅ | 已同步標記 | Default: true |
| `local_id` | Text | ❌ | 本地 ID (Dexie UUID) | Max: 100 |

#### `maintenance_log` JSON 格式範例

```json
[
  {
    "date": "2024-01-15T00:00:00.000Z",
    "note": "更換散熱膏",
    "cost": 500
  },
  {
    "date": "2024-06-10T00:00:00.000Z",
    "note": "清理灰塵",
    "cost": 0
  }
]
```

#### API Rules 設定

```javascript
// List Rule (允許使用者查看自己的資產)
@request.auth.id != "" && user = @request.auth.id

// View Rule (同上)
@request.auth.id = user

// Create Rule (只能建立屬於自己的資產)
@request.auth.id != "" && @request.data.user = @request.auth.id

// Update Rule (只能更新自己的資產)
@request.auth.id = user

// Delete Rule (只能刪除自己的資產)
@request.auth.id = user
```

---

### Collection 3: `subscriptions` (訂閱服務)

#### 基本設定
- **Name:** `subscriptions`
- **Type:** Base Collection
- **List/Search Rule:** `@request.auth.id != "" && user = @request.auth.id`
- **View/Create/Update/Delete Rule:** `@request.auth.id = user`

#### 欄位定義 (Schema)

| 欄位名稱 | 類型 | 必填 | 說明 | 設定 |
|---------|------|------|------|------|
| `name` | Text | ✅ | 訂閱名稱 | Min: 1, Max: 200 |
| `cost` | Number | ✅ | 費用 | Min: 0 |
| `currency` | Select | ✅ | 幣別 | Options: `TWD`, `USD`, `JPY` |
| `billing_cycle` | Select | ✅ | 計費週期 | Options: `Monthly`, `Quarterly`, `Yearly` |
| `start_date` | Date | ✅ | 開始日期 | - |
| `category` | Select | ✅ | 分類 | Options: `Software`, `Service`, `Entertainment` |
| `status` | Select | ✅ | 狀態 | Options: `Active`, `Cancelled`, Default: `Active` |
| `cancelled_date` | Date | ❌ | 取消日期 | - |
| `notes` | Text | ❌ | 備註 | Max: 1000 |
| `user` | Relation | ✅ | 所屬使用者 | Relation to `users`, Required |
| `synced` | Bool | ✅ | 已同步標記 | Default: true |
| `local_id` | Text | ❌ | 本地 ID (Dexie UUID) | Max: 100 |

#### API Rules 設定

```javascript
// List Rule
@request.auth.id != "" && user = @request.auth.id

// View Rule
@request.auth.id = user

// Create Rule
@request.auth.id != "" && @request.data.user = @request.auth.id

// Update Rule
@request.auth.id = user

// Delete Rule
@request.auth.id = user
```

---

### Collection 4: `settings` (使用者設定)

#### 基本設定
- **Name:** `settings`
- **Type:** Base Collection
- **List/Search Rule:** `@request.auth.id != "" && user = @request.auth.id`
- **View/Create/Update/Delete Rule:** `@request.auth.id = user`

#### 欄位定義 (Schema)

| 欄位名稱 | 類型 | 必填 | 說明 | 設定 |
|---------|------|------|------|------|
| `electricity_rate` | Number | ✅ | 電費單價（NT$/kWh） | Min: 0, Default: 4.0 |
| `default_currency` | Select | ✅ | 預設幣別 | Options: `TWD`, `USD`, `JPY`, Default: `TWD` |
| `locale` | Text | ✅ | 語系 | Default: `zh-TW` |
| `user` | Relation | ✅ | 所屬使用者 | Relation to `users`, Required, Unique |

#### API Rules 設定

```javascript
// List Rule
@request.auth.id != "" && user = @request.auth.id

// View Rule
@request.auth.id = user

// Create Rule
@request.auth.id != "" && @request.data.user = @request.auth.id

// Update Rule
@request.auth.id = user

// Delete Rule
@request.auth.id = user
```

---

## 🔒 CORS 設定

在 PocketBase 管理後台 → Settings → Application → CORS:

```
https://yourusername.github.io
http://localhost:5173
```

如果使用自訂網域，請加入該網域。

---

## 📱 測試連線

使用 PocketBase JavaScript SDK 測試：

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://<Orange-Pi-IP>:8090');

// 註冊測試帳號
await pb.collection('users').create({
  email: 'test@example.com',
  password: 'test123456',
  passwordConfirm: 'test123456'
});

// 登入
await pb.collection('users').authWithPassword(
  'test@example.com',
  'test123456'
);

console.log('Token:', pb.authStore.token);
console.log('User:', pb.authStore.model);
```

---

## 🌐 外網訪問（選配）

### 方案 1: Cloudflare Tunnel (推薦)

免費、安全、無需開放端口：

```bash
# 安裝 cloudflared (ARM64)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 登入 Cloudflare
cloudflared tunnel login

# 建立隧道
cloudflared tunnel create cpd-pocketbase

# 設定路由
cloudflared tunnel route dns cpd-pocketbase api.yourdomain.com

# 啟動隧道
cloudflared tunnel run cpd-pocketbase
```

### 方案 2: 動態 DNS + 端口轉發

如果有固定 IP 或支援 DDNS 的路由器：

1. 路由器設定端口轉發: `8090 → Orange Pi IP:8090`
2. 申請 DDNS 服務（如 DuckDNS, No-IP）
3. 在前端設定 PocketBase URL: `http://yourdomain.duckdns.org:8090`

---

## 🔐 安全建議

1. **啟用 HTTPS**: 使用 Nginx Reverse Proxy + Let's Encrypt
2. **限制管理後台**: 僅允許本地 IP 訪問 `/_/` 路徑
3. **備份策略**: 定期備份 `/pb_data` 目錄
4. **更新 PocketBase**: 定期拉取最新 Docker 映像

---

## 📚 參考資料

- [PocketBase 官方文檔](https://pocketbase.io/docs/)
- [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [PocketBase Docker Hub](https://hub.docker.com/r/ghcr.io/muchobien/pocketbase)
