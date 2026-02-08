# 使用指南 📖

## 🚀 快速啟動

### 1. 安裝依賴並啟動
```bash
cd cpd-tracker
npm install
npm run dev
```

### 2. 開啟瀏覽器
訪問 `http://localhost:5173`

### 3. 新增測試資料
點擊首頁的「新增測試資料」按鈕，會自動新增：
- 3 個資產範例 (Orange Pi、吉他、MacBook)
- 4 個訂閱範例 (Spotify、VPS、ChatGPT、Netflix)

## 🎯 功能說明

### Dashboard (首頁)
**你的每日燃燒率** - 這是核心功能！
- 顯示你每天「自動消失」的錢
- 包含所有啟用資產的每日折舊成本
- 包含所有啟用訂閱的每日成本

**統計卡片**
- 資產每日成本：所有資產的折舊總和
- 訂閱每日成本：所有訂閱的每日總和
- 每月成本預估：每日燃燒率 × 30
- 每年成本預估：每日燃燒率 × 365

**成本分佈圖表**
- 圓餅圖顯示各分類的佔比
- 下方列表顯示詳細的每日成本

### 資產管理 (Assets) - 開發中
未來功能：
- 新增/編輯/刪除資產
- 查看資產詳情
- 記錄維護歷史
- 追蹤目標使用期限
- Break-Even 進度條

### 訂閱管理 (Subscriptions) - 開發中
未來功能：
- 新增/編輯/刪除訂閱
- 查看累積花費（震撼！）
- 取消訂閱記錄
- 訂閱提醒

### 數據分析 (Analytics) - 開發中
未來功能：
- 時間軸趨勢圖
- 各分類深入分析
- 資產投資報酬率
- 訂閱效益分析

## 💡 使用技巧

### 如何計算「每日燃燒率」？

**實體資產**
```
每日成本 = (購買價格 + 所有維護成本) / 持有天數
```
例如：
- MacBook Pro: NT$45,000
- 持有 2 年 (730 天)
- 每日成本 = 45,000 / 730 = NT$61.6/天

**訂閱服務**
```
月繳: 每日成本 = 月費 / 30
年繳: 每日成本 = 年費 / 365
```
例如：
- Spotify Premium: NT$149/月
- 每日成本 = 149 / 30 = NT$4.97/天

### 為什麼要追蹤「每日成本」？

1. **心理衝擊** - 把大筆支出拆成每日，更有感覺
2. **比較容易** - 「每天 NT$5」比「每年 NT$1,800」更好理解
3. **及時警覺** - 發現不必要的開銷
4. **目標導向** - 看到資產是否達成預期壽命

### 使用情境範例

**情境 1: 決定是否買新設備**
- 假設想買 NT$30,000 的吉他
- 預計使用 10 年 (3650 天)
- 每日成本 = 30,000 / 3650 = NT$8.2/天
- 問自己：「我願意每天付 8.2 元練琴嗎？」

**情境 2: 檢視訂閱浪費**
- 發現 Netflix 已付費 2 年
- 累積花費 = 390 × 24 = NT$9,360
- 最近 3 個月沒看 → 取消訂閱！

**情境 3: 設定使用目標**
- 買了 NT$50,000 的相機
- 設定目標：使用 5 年 (1825 天)
- 目標每日成本 = NT$27.4
- 如果 1 年後不用了 = NT$136/天（虧大了！）

## 🔧 開發者功能

### 手動操作資料庫

開啟瀏覽器 Console (F12)，執行：

**查看所有資產**
```javascript
await db.assets.toArray()
```

**查看所有訂閱**
```javascript
await db.subscriptions.toArray()
```

**清空所有資料**
```javascript
await db.assets.clear()
await db.subscriptions.clear()
```

**匯出資料**
```javascript
const data = await exportData()
console.log(data)
```

## 📱 PWA 功能

### 安裝到手機

**Android Chrome:**
1. 訪問網站
2. 點擊網址列右側的「安裝」圖示
3. 確認安裝

**iOS Safari:**
1. 訪問網站
2. 點擊分享按鈕
3. 選擇「加入主畫面」

### 離線使用
- 安裝後可完全離線使用
- 所有資料儲存在本地 IndexedDB
- 無需網路連線

## 🎨 客製化

### 修改貨幣符號
編輯 `src/hooks/useCostCalculations.ts`:
```typescript
const currencySymbols: { [key: string]: string } = {
  'TWD': 'NT$',
  'JPY': '¥',
  'USD': '$'
};
```

### 修改分類顏色
編輯 `src/hooks/useCostCalculations.ts`:
```typescript
const categoryColors: { [key: string]: string } = {
  'Tech': '#3b82f6',      // 改成你喜歡的顏色
  'Music': '#8b5cf6',
  // ...
};
```

## 🐛 常見問題

### Q: 測試資料重複了？
A: 每次點擊「新增測試資料」都會新增一份，可以在 Console 執行 `await db.assets.clear()` 清空。

### Q: 圖表顯示不正確？
A: 確認資料的 `status` 是 `'Active'`，只有啟用狀態的項目才會計算。

### Q: 如何備份資料？
A: 目前可以在 Console 執行 `await exportData()` 複製 JSON，未來會加入 UI 功能。

### Q: 可以跨裝置同步嗎？
A: 目前是 Local-First 設計，資料只存在本地。未來可以考慮加入雲端同步功能。

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

---

有問題嗎？開啟 Issue 或聯繫 @heyloon
