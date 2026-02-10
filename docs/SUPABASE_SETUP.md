# Supabase 設定指南

CPD Tracker 現在支援使用 Supabase 作為後端！比 PocketBase 更簡單易用。

---

## 🚀 快速開始

### 步驟 1：創建 Supabase 專案（免費）

1. 前往 https://supabase.com
2. 點擊 **"Start your project"**
3. 使用 GitHub 或 Email 註冊/登入
4. 點擊 **"New project"**
5. 填寫專案資訊：
   - **Name**: `cpd-tracker`（或任何你喜歡的名稱）
   - **Database Password**: 設定一個強密碼（記下來！）
   - **Region**: 選擇離你最近的區域（例如 Singapore）
   - **Pricing Plan**: 選擇 **Free**（每月免費 500MB 儲存空間）
6. 點擊 **"Create new project"**
7. 等待 2-3 分鐘讓 Supabase 設置資料庫

---

### 步驟 2：創建資料表

專案創建完成後：

1. 在左側選單點擊 **"SQL Editor"**
2. 點擊 **"New query"**
3. 複製以下 SQL 並貼上：

```sql
-- 啟用 Row Level Security
ALTER TABLE IF EXISTS public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 創建 assets 資料表
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Tech', 'Music', 'Life', 'Others')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('TWD', 'USD', 'JPY')),
  purchase_date DATE NOT NULL,
  target_lifespan INTEGER,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Sold', 'Retired')),
  role TEXT NOT NULL CHECK (role IN ('Standalone', 'System', 'Component', 'Accessory')),
  system_id TEXT,
  linked_asset_id TEXT,
  photo_url TEXT,
  notes TEXT,
  sold_price DECIMAL(10, 2),
  power_watts DECIMAL(10, 2) DEFAULT 0,
  daily_usage_hours DECIMAL(5, 2) DEFAULT 0,
  recurring_maintenance_cost DECIMAL(10, 2) DEFAULT 0,
  maintenance_log JSONB DEFAULT '[]'::jsonb,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT TRUE,
  local_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建 subscriptions 資料表
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('TWD', 'USD', 'JPY')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('Monthly', 'Quarterly', 'Yearly')),
  start_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Software', 'Service', 'Entertainment')),
  status TEXT NOT NULL CHECK (status IN ('Active', 'Cancelled')),
  cancelled_date DATE,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT TRUE,
  local_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_updated_at ON public.assets(updated_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_at ON public.subscriptions(updated_at);

-- 創建 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security 政策：使用者只能存取自己的資料

-- Assets 政策
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
CREATE POLICY "Users can view their own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assets" ON public.assets;
CREATE POLICY "Users can insert their own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assets" ON public.assets;
CREATE POLICY "Users can update their own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assets" ON public.assets;
CREATE POLICY "Users can delete their own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions 政策
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can delete their own subscriptions"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

4. 點擊右下角的 **"Run"** 按鈕（或按 `Ctrl+Enter`）
5. 看到 **"Success. No rows returned"** 表示成功！✅

---

### 步驟 3：取得 API 金鑰

1. 在左側選單點擊 **"Settings"** (齒輪圖示)
2. 點擊 **"API"**
3. 找到以下兩個資訊：

   **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **Anon (public) key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...（很長的字串）
   ```

4. **複製這兩個值，稍後會用到！**

---

### 步驟 4：在 CPD Tracker 中設定

1. 開啟 CPD Tracker 應用程式：https://heyloon.github.io/cpd-tracker/
2. 進入 **"設定"** 頁面
3. 在 **"Supabase 同步設定"** 區塊：
   - **Supabase URL**: 貼上你的 Project URL
   - **Supabase Anon Key**: 貼上你的 Anon key
4. 點擊 **"儲存"** 按鈕
5. 頁面會自動重新載入

---

### 步驟 5：註冊/登入

1. 頁面重新載入後，會看到黃色提示：**"已設定同步伺服器，但尚未登入"**
2. 點擊 **"前往登入"** 按鈕
3. 在登入頁面選擇 **"註冊新帳號"**
4. 輸入 Email 和密碼
5. 註冊成功後會自動登入

**注意**：Supabase 預設會發送驗證信到你的 Email，但在開發模式下可以跳過驗證直接登入。

---

### 步驟 6：測試同步

1. 回到 **"資產"** 頁面
2. 點擊 **"新增資產"**
3. 填寫資產資訊並儲存
4. 應該會看到 **"已同步"** 的綠色提示！✅

---

## 🎉 完成！

你的 CPD Tracker 現在已經連接到 Supabase，可以在多裝置間同步資料了！

---

## 📊 驗證資料

在 Supabase Dashboard：

1. 左側選單點擊 **"Table Editor"**
2. 選擇 **"assets"** 表
3. 應該看到你剛才新增的資產！

---

## 🔧 進階設定（可選）

### 啟用 Email 驗證

預設情況下，Supabase 會要求 Email 驗證。如果你想關閉驗證（方便測試）：

1. Settings → Authentication → Providers
2. 找到 **"Email"** 提供者
3. 關閉 **"Confirm email"** 選項
4. 點擊 **"Save"**

### 自訂 Email 範本

Settings → Authentication → Email Templates

可以自訂註冊確認信、重設密碼信等範本。

### 查看使用者

Authentication → Users

可以看到所有註冊的使用者，也可以手動新增使用者。

---

## 🆚 Supabase vs PocketBase

### Supabase 優點

- ✅ **設定超簡單**：只需要執行一段 SQL
- ✅ **免費方案慷慨**：500MB 儲存、無限 API 請求
- ✅ **全託管**：不需要自己架設伺服器
- ✅ **Web UI 強大**：資料庫管理、SQL Editor、即時監控
- ✅ **PostgreSQL**：功能強大的資料庫
- ✅ **自動備份**：免費方案包含每日備份（保留 7 天）

### PocketBase 優點

- ✅ **自架**：完全控制資料
- ✅ **單一執行檔**：部署超簡單
- ✅ **離線可用**：不需要網路也能運行

### 建議

- 🏠 **個人使用 + 想自架**：選 PocketBase
- 🌐 **想要簡單 + 多裝置同步**：選 Supabase
- 🆓 **預算考量**：Supabase 免費方案更慷慨

---

## 🐛 疑難排解

### 問題 1：同步失敗

**檢查項目**：
1. Supabase URL 和 Anon Key 是否正確
2. 是否已登入
3. 瀏覽器控制台是否有錯誤訊息

### 問題 2：無法註冊/登入

**可能原因**：
1. Email 格式不正確
2. 密碼太短（至少 6 個字元）
3. Supabase 專案未啟動完成（等待 2-3 分鐘）

### 問題 3：資料無法查詢

**檢查 RLS 政策**：
1. 確認 SQL 中的 Row Level Security 政策已執行
2. 在 Table Editor 中，表格名稱旁應該有 🔒 圖示表示 RLS 已啟用

---

## 📚 延伸閱讀

- [Supabase 官方文件](https://supabase.com/docs)
- [PostgreSQL 教學](https://www.postgresql.org/docs/)
- [Row Level Security 說明](https://supabase.com/docs/guides/auth/row-level-security)

---

**享受無縫同步的 CPD Tracker！** 🚀
