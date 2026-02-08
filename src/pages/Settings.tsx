import { useState, useEffect } from 'react';
import { exportData, importData, getSettings, updateSettings } from '../db';

export default function Settings() {
  const [importing, setImporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // v0.4.0 新增：電費設定
  const [electricityRate, setElectricityRate] = useState('4.0');
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  
  // 載入電費設定
  useEffect(() => {
    getSettings().then(settings => {
      setElectricityRate(settings.electricityRate.toString());
    });
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">設定</h1>
          <p className="text-muted-foreground">管理你的應用程式設定與資料</p>
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
              <span className="font-medium">v0.4.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">專案類型</span>
              <span className="font-medium">Local-First PWA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">資料儲存</span>
              <span className="font-medium">IndexedDB (本地)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">新功能</span>
              <span className="font-medium text-green-500">組合資產 • 電費追蹤</span>
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
