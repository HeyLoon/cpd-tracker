# 🚀 GitHub Pages 部署指南

本指南將協助你將 CPD Tracker 前端部署到 GitHub Pages。

---

## 📋 前置條件

- [x] GitHub 帳號
- [x] Git 已安裝並設定
- [x] 專案已完成本地測試

---

## 🔧 部署步驟

### 步驟 1: 建立 GitHub Repository

1. 前往 [GitHub](https://github.com) 並登入
2. 點擊右上角的 `+` → `New repository`
3. 填寫資訊：
   - **Repository name**: `cpd-tracker`
   - **Description**: `📊 Cost Per Day 資產管理系統 - Offline-First PWA`
   - **Visibility**: Public (建議，才能使用免費 GitHub Pages)
   - **不要** 勾選 "Add a README file"（因為本地已有）
4. 點擊 `Create repository`

---

### 步驟 2: 連結本地專案到 GitHub

在專案根目錄執行以下命令：

```bash
# 1. 設定 Git remote（將 YOUR_USERNAME 替換成你的 GitHub 使用者名稱）
git remote add origin https://github.com/YOUR_USERNAME/cpd-tracker.git

# 2. 確認設定成功
git remote -v

# 3. 推送程式碼到 GitHub
git push -u origin master
```

---

### 步驟 3: 啟用 GitHub Pages

1. 前往你的 GitHub Repository 頁面
2. 點擊 `Settings` 標籤
3. 在左側選單找到 `Pages`
4. 在 **Source** 區域選擇：
   - Source: `GitHub Actions`（新版介面預設選項）
5. 點擊 `Save`

---

### 步驟 4: 觸發自動部署

GitHub Actions 會在你推送程式碼時自動執行部署。檢查部署狀態：

1. 前往 Repository 頁面
2. 點擊 `Actions` 標籤
3. 查看 "Deploy to GitHub Pages" workflow 狀態
4. 等待綠色勾勾 ✅（通常 2-3 分鐘）

---

### 步驟 5: 訪問你的應用程式

部署完成後，你的應用程式將可在以下網址訪問：

```
https://YOUR_USERNAME.github.io/cpd-tracker/#/
```

**注意：** 網址中的 `#/` 是必要的（HashRouter）

---

## ✅ 驗證部署

### 測試清單

- [ ] 開啟網址，看到 Dashboard 頁面
- [ ] 新增一個資產，確認可以儲存
- [ ] 重新整理頁面，確認資料仍在（IndexedDB）
- [ ] 開啟 DevTools → Application → IndexedDB，確認 `cpd-tracker-db` 存在
- [ ] 開啟 DevTools → Application → Service Workers，確認 PWA 已註冊
- [ ] 點擊網址列的 "安裝" 圖示，測試 PWA 安裝功能
- [ ] 測試離線功能：
  1. 關閉網路連線
  2. 重新整理頁面（應仍可正常載入）
  3. 新增/編輯資產（應能離線操作）

---

## 🔄 後續更新流程

每次修改程式碼後，只需執行：

```bash
# 1. 提交變更
git add .
git commit -m "feat: 新增某功能"

# 2. 推送到 GitHub
git push origin master

# 3. GitHub Actions 會自動重新部署（2-3 分鐘）
```

---

## 🐛 常見問題

### Q1: 部署後看到 404 頁面

**解決方案：**
1. 確認 GitHub Pages 設定為 `GitHub Actions` 源
2. 確認 Actions 工作流程已成功執行（綠色勾勾）
3. 網址必須包含 `#/`：`https://username.github.io/cpd-tracker/#/`
4. 等待 5-10 分鐘（DNS 傳播時間）

### Q2: Actions 工作流程失敗

**解決方案：**
1. 前往 Actions 標籤查看錯誤訊息
2. 確認 `.github/workflows/deploy.yml` 檔案存在
3. 檢查 `package.json` 中的 build 腳本
4. 確認 `bun.lock` 已提交到 Git

### Q3: 應用程式顯示空白頁面

**解決方案：**
1. 開啟 DevTools Console 查看錯誤
2. 確認使用的是 `HashRouter`（不是 `BrowserRouter`）
3. 檢查 `vite.config.ts` 中的 `base` 設定：
   ```typescript
   base: '/cpd-tracker/',  // Repository 名稱
   ```

### Q4: Service Worker 無法註冊

**解決方案：**
1. 確認是 HTTPS 或 localhost
2. 清除瀏覽器快取
3. 開啟無痕模式測試
4. 檢查 Console 是否有 CORS 錯誤

---

## 🔐 環境變數（未來使用）

當 PocketBase 後端部署完成後，需要設定環境變數：

### 方法 1: GitHub Secrets（推薦）

1. Repository → Settings → Secrets and variables → Actions
2. 點擊 `New repository secret`
3. 新增變數：
   - **Name**: `VITE_POCKETBASE_URL`
   - **Value**: `https://api.yourdomain.com`
4. 修改 `.github/workflows/deploy.yml`：
   ```yaml
   - name: Create .env file
     run: |
       echo "VITE_POCKETBASE_URL=${{ secrets.VITE_POCKETBASE_URL }}" > .env
   ```

### 方法 2: 硬編碼（適合公開的 API URL）

直接在 `.env` 提交到 Git：
```bash
VITE_POCKETBASE_URL=https://api.yourdomain.com
```

**注意：** 不要提交包含機密資訊的 `.env`！

---

## 📊 部署資訊

### 建置資訊
- **Bundle Size**: ~915 KB (minified)
- **Gzipped Size**: ~269 KB
- **Build Time**: ~2-3 秒
- **PWA Cache**: ~922 KB (6 files)

### 效能指標（預期）
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+

### 快取策略
- **HTML**: Network-first
- **JS/CSS**: Cache-first with update
- **API**: Network-first with offline fallback
- **Images**: Cache-first

---

## 🎉 完成！

你的 CPD Tracker 現已部署到 GitHub Pages，可供全世界訪問！

### 下一步建議

1. ✅ 分享網址給朋友測試
2. ✅ 在手機上開啟並安裝 PWA
3. ✅ 測試離線功能
4. 🔜 部署 PocketBase 後端（見 `POCKETBASE_SETUP.md`）
5. 🔜 設定 Cloudflare Tunnel 或 DuckDNS（見 `DEPLOYMENT.md`）
6. 🔜 啟用同步功能

---

## 📚 相關文件

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南（包含後端）
- [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md) - PocketBase 配置指南
- [README.md](./README.md) - 專案總覽
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 技術細節

---

**部署日期**: 2024-02-08  
**版本**: v0.6.0  
**狀態**: ✅ 前端部署完成，後端待配置
