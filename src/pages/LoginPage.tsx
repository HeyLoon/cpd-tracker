/**
 * 登入/註冊頁面
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, parsePocketBaseError } from '../pocketbase';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 驗證
    if (!email || !password) {
      setError('請輸入 Email 和密碼');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (password.length < 8) {
      setError('密碼至少需要 8 個字元');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        await register(email, password);
        alert('註冊成功！請登入。');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(parsePocketBaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-primary mb-2">CPD Tracker</h1>
          <p className="text-slate-400">Cost Per Day 資產管理</p>
        </div>

        {/* 表單 */}
        <div className="glass rounded-2xl p-8 border border-slate-800">
          {/* 模式切換 */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              登入
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              註冊
            </button>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-background border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* 密碼 */}
            <div>
              <label className="block text-sm font-medium mb-2">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 個字元"
                  className="w-full bg-background border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* 確認密碼（註冊時） */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-2">確認密碼</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次輸入密碼"
                    className="w-full bg-background border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            )}

            {/* 提交按鈕 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{mode === 'login' ? '登入中...' : '註冊中...'}</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span>{mode === 'login' ? '登入' : '註冊帳號'}</span>
                </>
              )}
            </button>
          </form>

          {/* 說明 */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center">
              {mode === 'login' ? (
                <>還沒有帳號？點擊上方「註冊」按鈕</>
              ) : (
                <>已有帳號？點擊上方「登入」按鈕</>
              )}
            </p>
          </div>
        </div>

        {/* 離線模式提示 */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors underline"
          >
            暫時跳過（僅使用離線模式）
          </button>
        </div>
      </div>
    </div>
  );
}
