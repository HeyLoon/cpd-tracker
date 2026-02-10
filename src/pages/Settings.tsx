import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportData, importData, getSettings, updateSettings } from '../db';
import { getPocketBaseUrlSetting, setPocketBaseUrl, hasPocketBaseUrl } from '../pocketbase';
import { getSupabaseConfig, setSupabaseConfig, hasSupabaseConfig, checkSupabaseHealth } from '../supabase';
import { useAuth } from '../hooks/useSync';

export default function Settings() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // v0.4.0 新增：電費設定
  const [electricityRate, setElectricityRate] = useState('4.0');
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  
  // v0.6.0 新增：PocketBase URL 設定
  const [pbUrl, setPbUrl] = useState('');
  const [savingPbUrl, setSavingPbUrl] = useState(false);
  const [pbUrlSaved, setPbUrlSaved] = useState(false);
  
  // v0.6.0+ 新增：Supabase 設定
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [savingSupabase, setSavingSupabase] = useState(false);
  const [supabaseHealthy, setSupabaseHealthy] = useState<boolean | null>(null);
  const [backendType, setBackendType] = useState<'supabase' | 'pocketbase' | null>(null);
  
  const { isAuthenticated } = useAuth();
  
  // 載入電費設定
  useEffect(() => {
    getSettings().then(settings => {
      setElectricityRate(settings.electricityRate.toString());
    });
    
    // 載入 PocketBase URL
    setPbUrl(getPocketBaseUrlSetting());
    
    // 載入 Supabase 配置
    const supabaseConfig = getSupabaseConfig();
    setSupabaseUrl(supabaseConfig.url);
    setSupabaseAnonKey(supabaseConfig.anonKey);
    
    // 偵測後端類型
    if (hasSupabaseConfig()) {
      setBackendType('supabase');
      // 檢查 Supabase 連線狀態
      checkSupabaseHealth().then(setSupabaseHealthy);
    } else if (hasPocketBaseUrl()) {
      setBackendType('pocketbase');
    } else {
      setBackendType(null);
    }
  }, []);
  
  const handleSaveElectricityRate = async () => {
    setSavingRate(true);
    try {
      await updateSettings({
        electricityRate: parseFloat(electricityRate)
      });
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請重試');
    } finally {
      setSavingRate(false);
    }
  };
  
  const handleSavePocketBaseUrl = async () => {
    if (!pbUrl.trim()) {
      alert('請輸入有效的 URL');
      return;
    }
    
    // 驗證 URL 格式
    try {
      new URL(pbUrl);
    } catch {
      alert('URL 格式不正確，請檢查後重試\n範例：http://192.168.1.100:8090');
      return;
    }
    
    setSavingPbUrl(true);
    try {
      setPocketBaseUrl(pbUrl);
      setPbUrlSaved(true);
      // setPocketBaseUrl 會自動重新載入頁面
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請重試');
      setSavingPbUrl(false);
    }
  };
  
  const handleClearPocketBaseUrl = () => {
    if (!confirm('確定要清除 PocketBase 設定嗎？這將切換回純離線模式。')) {
      return;
    }
    setPocketBaseUrl('');
  };
  
  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('請輸入 Supabase URL 和 Anon Key');
      return;
    }
    
    // 驗證 URL 格式
    try {
      new URL(supabaseUrl);
    } catch {
      alert('URL 格式不正確\n範例：https://xxxxx.supabase.co');
      return;
    }
    
    setSavingSupabase(true);
    try {
      // 先測試連線
      setSupabaseConfig(supabaseUrl, supabaseAnonKey);
      // setSupabaseConfig 會自動重新載入頁面
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請重試');
      setSavingSupabase(false);
    }
  };
  
  const handleClearSupabaseConfig = () => {
    if (!confirm('確定要清除 Supabase 設定嗎？這將切換回純離線模式。')) {
      return;
    }
    setSupabaseConfig('', '');
  };
  
  const handleExport = async () => {
    try {
      const jsonData = await exportData();
      
      // 建立下載連結
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cpd-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('匯出失敗:', error);
      alert('匯出失敗，請重試');
    }
  };
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    
    try {
      const text = await file.text();
      await importData(text);
      
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        window.location.reload(); // 重新載入以更新所有資料
      }, 2000);
    } catch (error) {
      console.error('匯入失敗:', error);
      alert('匯入失敗，請確認檔案格式正確');
    } finally {
      setImporting(false);
      e.target.value = ''; // 重置 input
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-20 pt-12">
      <div className="max-w-2xl mx-auto p-4">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">設定</h1>
          <p className="text-muted-foreground">管理你的應用程式設定與資料</p>
        </div>
        
        {/* v0.6.0 新增：同步設定 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-4">🔄 資料同步設定</h3>
          
          <div className="space-y-4">
            {/* 後端選擇 */}
            <div>
              <label className="block text-sm font-medium mb-3">
                選擇同步後端
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    // 顯示 Supabase 設定區
                    if (backendType !== 'supabase' && hasPocketBaseUrl()) {
                      if (!confirm('切換後端會清除目前的 PocketBase 設定，確定要繼續嗎？')) {
                        return;
                      }
                      handleClearPocketBaseUrl();
                    }
                    setBackendType('supabase');
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    backendType === 'supabase' || hasSupabaseConfig()
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-sm font-medium">Supabase</div>
                  <div className="text-xs text-muted-foreground mt-1">雲端託管 (推薦)</div>
                </button>
                <button
                  onClick={() => {
                    // 顯示 PocketBase 設定區
                    if (backendType !== 'pocketbase' && hasSupabaseConfig()) {
                      if (!confirm('切換後端會清除目前的 Supabase 設定，確定要繼續嗎？')) {
                        return;
                      }
                      handleClearSupabaseConfig();
                    }
                    setBackendType('pocketbase');
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    backendType === 'pocketbase' || hasPocketBaseUrl()
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border hover:border-green-500/50'
                  }`}
                >
                  <div className="text-sm font-medium">PocketBase</div>
                  <div className="text-xs text-muted-foreground mt-1">自架後端</div>
                </button>
              </div>
            </div>
            
            {/* 狀態顯示 */}
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  hasSupabaseConfig() || hasPocketBaseUrl() ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
                <span className="font-medium">
                  {hasSupabaseConfig() ? '使用 Supabase' : 
                   hasPocketBaseUrl() ? '使用 PocketBase' : 
                   '純離線模式'}
                </span>
              </div>
              {(hasSupabaseConfig() || hasPocketBaseUrl()) && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>認證狀態：</span>
                    <span className={isAuthenticated ? 'text-green-500' : 'text-yellow-500'}>
                      {isAuthenticated ? '✓ 已登入' : '未登入'}
                    </span>
                  </div>
                  {!isAuthenticated && (
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      → 前往登入頁面
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Supabase 設定區 */}
            {(backendType === 'supabase' || hasSupabaseConfig()) && (
              <div className="space-y-3 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Supabase 配置</h4>
                  {supabaseHealthy !== null && (
                    <span className={`text-xs ${supabaseHealthy ? 'text-green-500' : 'text-red-500'}`}>
                      {supabaseHealthy ? '✓ 連線正常' : '✗ 連線失敗'}
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Supabase URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-2 font-mono text-sm"
                    placeholder="https://xxxxx.supabase.co"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-2 font-mono text-sm"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSupabaseConfig}
                    disabled={savingSupabase || !supabaseUrl.trim() || !supabaseAnonKey.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSupabase ? '儲存中...' : '儲存設定'}
                  </button>
                  {hasSupabaseConfig() && (
                    <button
                      onClick={handleClearSupabaseConfig}
                      className="px-4 py-2 text-sm text-red-500 hover:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
                
                {/* Supabase 說明 */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-400">
                    💡 <strong>如何取得 Supabase 配置：</strong><br/>
                    1. 前往 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> 註冊並建立專案<br/>
                    2. 執行 SQL 建立資料表（詳見 docs/SUPABASE_SETUP.md）<br/>
                    3. 在 Settings → API 找到 Project URL 和 anon key<br/>
                    4. 貼到上方欄位並儲存
                  </p>
                </div>
              </div>
            )}
            
            {/* PocketBase 設定區 */}
            {(backendType === 'pocketbase' || hasPocketBaseUrl()) && (
              <div className="space-y-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <h4 className="text-sm font-semibold mb-2">PocketBase 配置</h4>
                
                <div>
                  <label className="block text-xs font-medium mb-1">
                    PocketBase 伺服器 URL
                  </label>
                  <input
                    type="url"
                    value={pbUrl}
                    onChange={(e) => setPbUrl(e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-2 font-mono text-sm"
                    placeholder="http://192.168.1.100:8090"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePocketBaseUrl}
                    disabled={savingPbUrl || !pbUrl.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingPbUrl ? '儲存中...' : '儲存設定'}
                  </button>
                  {hasPocketBaseUrl() && (
                    <button
                      onClick={handleClearPocketBaseUrl}
                      className="px-4 py-2 text-sm text-red-500 hover:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
                
                {pbUrlSaved && (
                  <div className="text-sm text-green-500">
                    ✓ URL 已儲存！頁面即將重新載入...
                  </div>
                )}
                
                {/* PocketBase 說明 */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-green-400">
                    💡 <strong>URL 範例：</strong><br/>
                    • 本地網路：<code>http://192.168.1.100:8090</code><br/>
                    • 公開網域：<code>https://api.yourdomain.com</code><br/>
                    • DuckDNS：<code>http://yourdomain.duckdns.org:8090</code>
                  </p>
                </div>
              </div>
            )}
            
            {/* 快速操作 */}
            {(hasSupabaseConfig() || hasPocketBaseUrl()) && (
              <div className="flex gap-2">
                {isAuthenticated ? (
                  <div className="flex-1 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="text-sm text-green-400">
                      ✓ 已連線並登入，資料將自動同步
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    🔑 前往登入/註冊
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* v0.4.0 新增：電費設定 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-4">⚡ 電費設定</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                電費單價（NT$ / 度）
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                用於計算所有設備的電費成本。1 度 = 1 kWh
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(e.target.value)}
                  className="flex-1 bg-background border rounded-lg px-3 py-2"
                  placeholder="4.0"
                />
                <button
                  onClick={handleSaveElectricityRate}
                  disabled={savingRate}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingRate ? '儲存中...' : '儲存'}
                </button>
              </div>
              {rateSaved && (
                <div className="mt-2 text-sm text-green-500">
                  ✓ 電費單價已更新！
                </div>
              )}
            </div>
            
            {/* 說明 */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                💡 <strong>台電電價參考：</strong><br/>
                • 夏季（6-9月）：約 NT$4.5 - 6.0 / 度<br/>
                • 非夏季：約 NT$3.5 - 5.0 / 度<br/>
                • 建議使用你的平均電價
              </p>
            </div>
          </div>
        </div>
        
        {/* 資料管理 */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-4">📦 資料管理</h3>
          
          {/* 匯出資料 */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">匯出資料</h4>
                <p className="text-sm text-muted-foreground">
                  下載所有資產、訂閱和設定為 JSON 檔案
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              📥 匯出為 JSON
            </button>
            {exportSuccess && (
              <div className="mt-2 text-sm text-green-500 text-center">
                ✓ 匯出成功！
              </div>
            )}
          </div>
          
          {/* 匯入資料 */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">匯入資料</h4>
                <p className="text-sm text-muted-foreground">
                  從 JSON 檔案還原資料
                </p>
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ 警告：將會覆蓋現有資料
                </p>
              </div>
            </div>
            <label className="block">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
                id="import-file"
              />
              <span className="block w-full bg-secondary text-foreground px-4 py-3 rounded-lg hover:bg-secondary/80 transition-colors text-center cursor-pointer">
                {importing ? '匯入中...' : '📤 選擇 JSON 檔案匯入'}
              </span>
            </label>
            {importSuccess && (
              <div className="mt-2 text-sm text-green-500 text-center">
                ✓ 匯入成功！頁面即將重新載入...
              </div>
            )}
          </div>
        </div>
        
        {/* 關於 */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">ℹ️ 關於 CPD Tracker</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">版本</span>
              <span className="font-medium">v0.6.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">專案類型</span>
              <span className="font-medium">Local-First PWA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">資料儲存</span>
              <span className="font-medium">IndexedDB + 可選同步</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">新功能</span>
              <span className="font-medium text-green-500">Supabase 同步</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              所有資料儲存在你的裝置上 🔒<br/>
              定期備份以確保資料安全
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
