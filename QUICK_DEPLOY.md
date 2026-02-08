# 🚀 快速部署指令

## 立即部署到 GitHub Pages（3 步驟）

### 第 1 步：建立 GitHub Repository

1. 前往 https://github.com/new
2. Repository name: `cpd-tracker`
3. Visibility: **Public**
4. 點擊 **Create repository**

---

### 第 2 步：推送程式碼

```bash
# 在專案根目錄執行（將 YOUR_USERNAME 替換成你的 GitHub 使用者名稱）
git remote add origin https://github.com/YOUR_USERNAME/cpd-tracker.git
git push -u origin master
```

---

### 第 3 步：啟用 GitHub Pages

1. 前往 https://github.com/YOUR_USERNAME/cpd-tracker/settings/pages
2. **Source** 選擇: `GitHub Actions`
3. 等待 2-3 分鐘（查看 Actions 標籤）

---

## ✅ 完成！

你的應用程式現已上線：

```
https://YOUR_USERNAME.github.io/cpd-tracker/#/
```

**記得測試：**
- ✅ 開啟網址，看到 Dashboard
- ✅ 新增資產，重新整理後資料仍在
- ✅ 關閉網路，測試離線功能
- ✅ 在手機上安裝 PWA

---

## 🔄 後續更新

```bash
git add .
git commit -m "更新說明"
git push origin master
# GitHub Actions 會自動重新部署
```

---

## 📚 詳細文件

- [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md) - 完整部署指南
- [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md) - 後端設定（稍後執行）

---

## 🐛 遇到問題？

### 看到 404 頁面
- 等待 5-10 分鐘（部署需要時間）
- 確認網址包含 `#/`
- 檢查 Actions 是否成功執行（綠色勾勾）

### Actions 執行失敗
- 查看 Actions 標籤中的錯誤訊息
- 確認 `.github/workflows/deploy.yml` 檔案已提交

### 空白頁面
- 開啟 DevTools Console 查看錯誤
- 確認 `vite.config.ts` 中有設定 `base: '/cpd-tracker/'`

---

**狀態**: ✅ 已準備部署  
**版本**: v0.6.0  
**Build 大小**: 915 KB (269 KB gzipped)
