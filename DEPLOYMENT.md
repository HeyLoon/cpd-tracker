# 🚀 CPD Tracker 部署指南

本文檔說明如何完整部署 CPD Tracker 應用程式，包括前端（GitHub Pages）和後端（PocketBase on Orange Pi）。

---

## 📦 架構概覽

```
┌─────────────────────┐         ┌──────────────────────┐
│  GitHub Pages       │         │  Orange Pi 5 Plus    │
│  (React PWA)        │ ◄────► │  (PocketBase)        │
│  - Offline-First    │  Sync   │  - SQLite            │
│  - Dexie.js         │         │  - Docker            │
└─────────────────────┘         └──────────────────────┘
         ▲                                ▲
         │                                │
         └────────────────────────────────┘
              使用者透過網路訪問兩者
```

**同步策略**:
- 離線優先：所有資料先儲存到 Dexie (IndexedDB)
- 背景同步：連線時自動上傳未同步資料到 PocketBase
- 雙向同步：下載遠端變更以保持多裝置一致性

---

## Part 1: 後端部署（PocketBase on Orange Pi）

### 1.1 準備 Orange Pi 5 Plus

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 登出後重新登入生效
exit
```

### 1.2 部署 PocketBase

```bash
# 建立專案目錄
mkdir -p ~/cpd-pocketbase
cd ~/cpd-pocketbase

# 下載 docker-compose.yml（從本專案複製）
# 或手動建立，內容見專案根目錄的 docker-compose.yml

# 啟動 PocketBase
docker-compose up -d

# 查看日誌
docker-compose logs -f pocketbase
```

**預期輸出**:
```
Server started at http://0.0.0.0:8090
```

### 1.3 初始化 PocketBase

1. 瀏覽器開啟 `http://<Orange-Pi-IP>:8090/_/`
2. 建立管理員帳號
3. 按照 `POCKETBASE_SETUP.md` 建立 Collections:
   - `assets` (資產)
   - `subscriptions` (訂閱)
   - `settings` (使用者設定)

### 1.4 設定 CORS

在 PocketBase 管理後台:
1. Settings → Application → CORS
2. 新增允許的來源:
   ```
   https://<你的 GitHub 使用者名>.github.io
   http://localhost:5173
   ```

### 1.5 外網訪問（選配）

#### 方案 A: Cloudflare Tunnel (推薦)

```bash
# 安裝 cloudflared (ARM64)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 登入 Cloudflare
cloudflared tunnel login

# 建立隧道
cloudflared tunnel create cpd-api

# 建立配置檔
cat > ~/.cloudflared/config.yml <<EOF
tunnel: cpd-api
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:8090
  - service: http_status:404
EOF

# 設定 DNS
cloudflared tunnel route dns cpd-api api.yourdomain.com

# 啟動隧道
cloudflared tunnel run cpd-api
```

建議使用 systemd 服務自動啟動:

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

內容:
```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=<your-user>
ExecStart=/usr/local/bin/cloudflared tunnel run cpd-api
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

#### 方案 B: DuckDNS + 端口轉發

1. 申請 DuckDNS 網域: https://www.duckdns.org/
2. 路由器設定端口轉發: `8090 → Orange Pi IP:8090`
3. 使用 `http://yourdomain.duckdns.org:8090`

---

## Part 2: 前端部署（GitHub Pages）

### 2.1 準備 GitHub Repository

```bash
cd cpd-tracker

# 建立 .env 檔案（設定 PocketBase URL）
cp .env.example .env
nano .env
```

`.env` 內容:
```bash
# 如果使用 Cloudflare Tunnel
VITE_POCKETBASE_URL=https://api.yourdomain.com

# 如果使用 DuckDNS
# VITE_POCKETBASE_URL=http://yourdomain.duckdns.org:8090

# 如果僅在本地測試
# VITE_POCKETBASE_URL=http://192.168.1.100:8090
```

### 2.2 建置專案

```bash
# 安裝依賴
bun install

# 建置生產版本
bun run build

# 測試建置結果
bun run preview
```

### 2.3 部署到 GitHub Pages

#### 方法 A: 使用 GitHub Actions (推薦)

建立 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Build
        run: bun run build
        env:
          VITE_POCKETBASE_URL: ${{ secrets.VITE_POCKETBASE_URL }}
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

**設定 GitHub Secrets**:
1. GitHub Repo → Settings → Secrets and variables → Actions
2. 新增 `VITE_POCKETBASE_URL` secret
3. 值: `https://api.yourdomain.com`

**啟用 GitHub Pages**:
1. Settings → Pages
2. Source: GitHub Actions

推送程式碼後自動部署:
```bash
git add .
git commit -m "Deploy CPD Tracker with PocketBase"
git push origin master
```

#### 方法 B: 手動部署

```bash
# 建置
bun run build

# 部署（使用 gh-pages）
bun add -D gh-pages
npx gh-pages -d dist
```

### 2.4 訪問應用程式

部署完成後，訪問:
```
https://<你的 GitHub 使用者名>.github.io/<repo-name>/
```

如果使用自訂網域，設定 CNAME:
1. Settings → Pages → Custom domain
2. 輸入網域並驗證

---

## Part 3: 測試與驗證

### 3.1 測試連線

開啟瀏覽器開發者工具（F12），執行:

```javascript
// 檢查 PocketBase 連線
fetch('https://api.yourdomain.com/api/health')
  .then(res => res.json())
  .then(console.log);
// 預期輸出: {code: 200, message: "API is healthy", ...}
```

### 3.2 測試註冊與登入

1. 開啟 CPD Tracker 應用程式
2. 點擊右上角登入
3. 註冊新帳號
4. 登入後，開啟開發者工具 → Application → IndexedDB → CPDTrackerDB
5. 新增資產/訂閱
6. 觀察同步狀態列

### 3.3 測試離線模式

1. 開發者工具 → Network → Throttling: Offline
2. 新增資產
3. 資料應儲存到 IndexedDB
4. 恢復連線
5. 自動同步到 PocketBase

### 3.4 測試多裝置同步

1. 電腦 A: 新增資產「測試同步」
2. 等待同步完成（頂部狀態列顯示綠色）
3. 電腦 B: 重新整理頁面
4. 應看到「測試同步」資產

---

## Part 4: 維護與備份

### 4.1 PocketBase 備份

```bash
# 停止 PocketBase
cd ~/cpd-pocketbase
docker-compose down

# 備份資料
tar -czf pb_data_backup_$(date +%Y%m%d).tar.gz pb_data/

# 上傳到雲端（例如 Google Drive, Dropbox）
rclone copy pb_data_backup_*.tar.gz gdrive:/backups/cpd-tracker/

# 重啟 PocketBase
docker-compose up -d
```

建議使用 cron 自動備份:
```bash
crontab -e
```

新增:
```cron
# 每天凌晨 3 點備份
0 3 * * * cd ~/cpd-pocketbase && docker-compose down && tar -czf pb_data_backup_$(date +\%Y\%m\%d).tar.gz pb_data/ && docker-compose up -d
```

### 4.2 更新 PocketBase

```bash
cd ~/cpd-pocketbase
docker-compose pull
docker-compose down
docker-compose up -d
```

### 4.3 監控 PocketBase 狀態

```bash
# 查看日誌
docker-compose logs -f pocketbase

# 查看容器狀態
docker ps

# 查看資源使用
docker stats cpd-pocketbase
```

---

## Part 5: 疑難排解

### 問題 1: CORS 錯誤

**症狀**: 瀏覽器控制台顯示 `CORS policy: No 'Access-Control-Allow-Origin' header`

**解決**:
1. 確認 PocketBase 管理後台 → Settings → Application → CORS 已新增前端網域
2. 確認網域格式正確（包含協定 `https://`）
3. 重啟 PocketBase: `docker-compose restart`

### 問題 2: 無法同步資料

**症狀**: 頂部顯示「X 個項目待上傳」但未同步

**解決**:
1. 檢查網路連線
2. 確認已登入帳號（右上角應顯示使用者圖示）
3. 開啟開發者工具 → Console 查看錯誤訊息
4. 手動觸發同步：點擊「立即同步」按鈕

### 問題 3: GitHub Pages 顯示 404

**症狀**: 訪問 GitHub Pages 網址時顯示 404

**解決**:
1. 確認 Settings → Pages → Source 設定為 GitHub Actions
2. 確認 Actions 工作流程執行成功（Actions 標籤頁）
3. 如果使用 HashRouter，URL 應為 `https://xxx.github.io/repo/#/`
4. 等待 1-2 分鐘讓 DNS 傳播

### 問題 4: Orange Pi 連線不穩定

**症狀**: PocketBase 間歇性無法連線

**解決**:
1. 使用 Cloudflare Tunnel 取代直接暴露端口
2. 為 Orange Pi 設定靜態 IP
3. 檢查路由器防火牆設定
4. 確認 Docker 容器健康狀態: `docker ps`

---

## 📚 參考資料

- [PocketBase 官方文檔](https://pocketbase.io/docs/)
- [Dexie.js 文檔](https://dexie.org/)
- [GitHub Pages 文檔](https://docs.github.com/en/pages)
- [Cloudflare Tunnel 文檔](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

## 🎉 完成！

現在您已經成功部署了完整的 CPD Tracker 應用程式，包括:
- ✅ 離線優先的 PWA 前端
- ✅ 自託管的 PocketBase 後端
- ✅ 自動雙向同步
- ✅ 多裝置支援
- ✅ 照片上傳功能

如有問題，請參考疑難排解章節或檢查專案的 GitHub Issues。
