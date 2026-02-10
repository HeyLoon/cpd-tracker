/**
 * 同步狀態指示器組件
 * 
 * 顯示在頁面頂部，提供即時同步狀態
 */

import { useNavigate } from 'react-router-dom';
import { useSyncStatus, useOnlineStatus, useAuth } from '../hooks/useSync';
import { hasPocketBaseUrl } from '../pocketbase';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, WifiOff, LogIn } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function SyncStatusBar() {
  const navigate = useNavigate();
  const status = useSyncStatus();
  const isOnline = useOnlineStatus();
  const { isAuthenticated } = useAuth();
  const hasPbUrl = hasPocketBaseUrl();

  // 如果設定了 PocketBase URL 但未登入，顯示提示
  if (hasPbUrl && !isAuthenticated) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between gap-3 bg-yellow-500/20 border-b border-yellow-500/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LogIn className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-300 truncate">
            已設定同步伺服器，但尚未登入
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="px-3 py-1 text-xs font-medium bg-yellow-500/30 hover:bg-yellow-500/40 rounded-lg transition-colors flex-shrink-0"
        >
          前往登入
        </button>
      </div>
    );
  }

  // 不顯示條件：已同步且沒有待上傳項目
  if (!status.isSyncing && status.pendingUploads === 0 && !status.error) {
    return null;
  }

  const handleSync = () => {
    status.sync('bidirectional');
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between gap-3 ${
        status.error
          ? 'bg-red-500/20 border-b border-red-500/30'
          : status.isSyncing
          ? 'bg-blue-500/20 border-b border-blue-500/30'
          : status.pendingUploads > 0
          ? 'bg-yellow-500/20 border-b border-yellow-500/30'
          : 'bg-green-500/20 border-b border-green-500/30'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* 圖示 */}
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : status.error ? (
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        ) : status.isSyncing ? (
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
        ) : status.pendingUploads > 0 ? (
          <Cloud className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        )}

        {/* 訊息 */}
        <div className="flex-1 min-w-0">
          {!isOnline ? (
            <p className="text-xs text-slate-300 truncate">離線模式 - 資料儲存在本地</p>
          ) : status.error ? (
            <p className="text-xs text-red-300 truncate">同步失敗: {status.error}</p>
          ) : status.isSyncing ? (
            <p className="text-xs text-blue-300 truncate">正在同步資料...</p>
          ) : status.pendingUploads > 0 ? (
            <p className="text-xs text-yellow-300 truncate">
              {status.pendingUploads} 個項目待上傳
              {status.lastSyncAt && ` · 上次同步: ${formatDistanceToNow(status.lastSyncAt, { locale: zhTW, addSuffix: true })}`}
            </p>
          ) : (
            <p className="text-xs text-green-300 truncate">
              已同步 · {status.lastSyncAt && formatDistanceToNow(status.lastSyncAt, { locale: zhTW, addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* 操作按鈕 */}
      {isOnline && !status.isSyncing && status.pendingUploads > 0 && (
        <button
          onClick={handleSync}
          className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
        >
          立即同步
        </button>
      )}

      {status.error && (
        <button
          onClick={handleSync}
          className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
        >
          重試
        </button>
      )}
    </div>
  );
}
