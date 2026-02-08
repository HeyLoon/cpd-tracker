import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';
import RigBuilderForm from './pages/RigBuilderForm';
import Subscriptions from './pages/Subscriptions';
import SubscriptionForm from './pages/SubscriptionForm';
import SubscriptionDetail from './pages/SubscriptionDetail';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  // 設定預設為暗色模式
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/new" element={<AssetForm />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/assets/:id/edit" element={<AssetForm />} />
          <Route path="/systems/new" element={<RigBuilderForm />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscriptions/new" element={<SubscriptionForm />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
          <Route path="/subscriptions/:id/edit" element={<SubscriptionForm />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
