# 🚀 部署指南

本指南將協助你將 CPD Tracker 部署到 GitHub Pages，以及選擇性地設定 PocketBase 後端。

---

## 📦 前端部署（GitHub Pages）

### 前置條件
- GitHub 帳號
- Git 已安裝

### 部署步驟

#### 1. Fork 或 Clone 專案

```bash
git clone https://github.com/HeyLoon/cpd-tracker.git
cd cpd-tracker
```

#### 2. 建立自己的 GitHub Repository

1. 前往 https://github.com/new
2. Repository name: `cpd-tracker`
3. Visibility: Public（免費使用 GitHub Pages）
4. 點擊 Create repository

#### 3. 推送程式碼

```bash
# 設定 remote（替換成你的使用者名稱）
git remote set-url origin https://github.com/YOUR_USERNAME/cpd-tracker.git

# 推送
git push -u origin master
```

#### 4. 啟用 GitHub Pages

1. 前往 Repository → Settings → Pages
2. Source 選擇：**GitHub Actions**
3. 等待 2-3 分鐘，Actions 會自動部署

#### 5. 訪問你的應用程式

```
https://YOUR_USERNAME.github.io/cpd-tracker/#/
```

**完成！** 你的應用程式已上線，可以完全離線使用。

---

## 🔄 後端部署（PocketBase，可選）

如果你想啟用多裝置同步功能，需要部署 PocketBase 後端。

### 選項 A：本地網路部署（簡單）

適合在家裡使用，無需公開 IP。

#### 1. 下載 PocketBase

**Linux (ARM64 - 適合 Raspberry Pi/Orange Pi):**
```bash
wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_linux_arm64.zip
unzip pocketbase_0.26.8_linux_arm64.zip
```

**Linux (x86_64):**
```bash
wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_linux_amd64.zip
unzip pocketbase_0.26.8_linux_amd64.zip
```

**macOS (ARM64):**
```bash
wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_darwin_arm64.zip
unzip pocketbase_0.26.8_darwin_arm64.zip
```

#### 2. 啟動 PocketBase

```bash
./pocketbase serve --http=0.0.0.0:8090
```

#### 3. 初始化設定

1. 開啟 Admin UI: `http://localhost:8090/_/`
2. 建立 Admin 帳號
3. 建立 Collections（見下方 Schema）

#### 4. 在應用程式設定 URL

1. 找到你的本地 IP（如：`192.168.1.100`）
2. 在 CPD Tracker 的「設定」頁面輸入：
   ```
   http://192.168.1.100:8090
   ```
3. 前往「登入」頁面註冊帳號

**優點：**
- ✅ 簡單，無需公開 IP
- ✅ 資料存在自己的設備

**限制：**
- ❌ 只能在同一 WiFi 下同步
- ❌ 外出時無法同步（但仍可離線使用）

---

### 選項 B：公開部署（進階）

如果想隨時隨地同步，需要將 PocketBase 暴露到公網。

#### 方案 1：使用 Cloudflare Tunnel（推薦）

**優點：**
- ✅ 免費
- ✅ HTTPS 自動配置
- ✅ 隱藏真實 IP
- ✅ 無需設定路由器

**步驟：**

1. 安裝 cloudflared:
   ```bash
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

2. 登入 Cloudflare:
   ```bash
   cloudflared tunnel login
   ```

3. 建立 Tunnel:
   ```bash
   cloudflared tunnel create pocketbase
   cloudflared tunnel route dns pocketbase api.yourdomain.com
   ```

4. 配置 Tunnel:
   ```yaml
   # ~/.cloudflared/config.yml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /path/to/credentials.json

   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:8090
     - service: http_status:404
   ```

5. 啟動 Tunnel:
   ```bash
   cloudflared tunnel run pocketbase
   ```

6. 在應用程式設定:
   ```
   https://api.yourdomain.com
   ```

#### 方案 2：使用 DuckDNS（免費動態 DNS）

**優點：**
- ✅ 免費
- ✅ 簡單

**限制：**
- ⚠️ 需要開放路由器 Port
- ⚠️ 無 HTTPS（需自行配置）

**步驟：**

1. 註冊 DuckDNS: https://www.duckdns.org/
2. 建立子網域（如：`mycpd.duckdns.org`）
3. 設定路由器 Port Forwarding: `8090 → 你的設備 IP`
4. 啟動 PocketBase:
   ```bash
   ./pocketbase serve --http=0.0.0.0:8090
   ```
5. 在應用程式設定:
   ```
   http://mycpd.duckdns.org:8090
   ```

---

## 📊 PocketBase Collections Schema

在 PocketBase Admin UI 建立以下 Collections：

### 1. users (內建)
使用 PocketBase 內建的 users collection，無需修改。

### 2. assets

| Field | Type | Options |
|-------|------|---------|
| name | text | required |
| category | select | options: Tech, Music, Life, Others |
| price | number | required |
| currency | select | options: TWD, USD, JPY |
| purchase_date | date | required |
| target_lifespan | number | required |
| status | select | options: Active, Sold, Retired |
| role | select | options: Standalone, System, Component, Accessory |
| system_id | relation | optional, → assets |
| linked_asset_id | relation | optional, → assets |
| photo | file | optional, max 5MB |
| notes | text | optional |
| sold_price | number | optional |
| power_watts | number | optional |
| daily_usage_hours | number | optional |
| recurring_maintenance_cost | number | optional |
| userId | relation | required, → users |

**API Rules:**
```javascript
// List/Search
@request.auth.id != "" && userId = @request.auth.id

// View
@request.auth.id != "" && userId = @request.auth.id

// Create
@request.auth.id != ""

// Update
@request.auth.id != "" && userId = @request.auth.id

// Delete
@request.auth.id != "" && userId = @request.auth.id
```

### 3. subscriptions

| Field | Type | Options |
|-------|------|---------|
| name | text | required |
| cost | number | required |
| currency | select | options: TWD, USD, JPY |
| billing_cycle | select | options: Monthly, Quarterly, Yearly |
| start_date | date | required |
| status | select | options: Active, Cancelled |
| category | text | optional |
| notes | text | optional |
| userId | relation | required, → users |

**API Rules:** 同 assets

### 4. settings

| Field | Type | Options |
|-------|------|---------|
| electricity_rate | number | default: 4.0 |
| default_currency | select | options: TWD, USD, JPY |
| locale | text | default: zh-TW |
| userId | relation | required, → users |

**API Rules:** 同 assets

---

## 🔐 安全性建議

### PocketBase 設定

1. **啟用 CORS**
   - Settings → Application → CORS
   - 加入你的前端網址：`https://YOUR_USERNAME.github.io`

2. **設定 Rate Limiting**
   - 防止 API 濫用
   - Settings → Application → Rate limits

3. **定期備份**
   ```bash
   # 備份資料庫
   cp pb_data/data.db pb_data/backups/data_$(date +%Y%m%d).db
   ```

4. **使用強密碼**
   - Admin 帳號至少 12 位字元
   - 啟用 2FA（如果 PocketBase 支援）

---

## 🐛 疑難排解

### 問題：無法連線到 PocketBase

**檢查：**
1. PocketBase 是否正在運行？
   ```bash
   ps aux | grep pocketbase
   ```
2. 防火牆是否開放 Port 8090？
   ```bash
   sudo ufw allow 8090
   ```
3. URL 是否正確？（有無尾部斜線）

### 問題：CORS 錯誤

**解決：**
1. 前往 PocketBase Admin → Settings → Application
2. CORS origins 加入前端網址（包含協議）
3. 重啟 PocketBase

### 問題：同步失敗

**檢查：**
1. 是否已登入？
2. 網路連線是否正常？
3. 開啟 DevTools Console 查看錯誤訊息

---

## 📱 行動裝置使用

### 安裝 PWA

**iOS (Safari):**
1. 開啟網站
2. 點擊「分享」按鈕
3. 選擇「加入主畫面」

**Android (Chrome):**
1. 開啟網站
2. 點擊選單（三個點）
3. 選擇「安裝應用程式」或「加到主畫面」

### 同步設定

在行動裝置上：
1. 開啟「設定」頁面
2. 輸入與電腦相同的 PocketBase URL
3. 使用相同帳號登入
4. 資料自動同步

---

## 🎉 完成！

現在你已經成功部署了 CPD Tracker！

**純離線使用：**
- ✅ 直接使用，所有資料存在瀏覽器

**啟用同步：**
- ✅ 部署 PocketBase 後端
- ✅ 在設定頁面輸入 URL
- ✅ 註冊/登入帳號
- ✅ 多裝置自動同步

有任何問題，歡迎開啟 GitHub Issue！
