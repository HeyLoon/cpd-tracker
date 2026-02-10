import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, CreditCard, PieChart, Settings } from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: '首頁' },
  { path: '/assets', icon: Package, label: '資產' },
  { path: '/subscriptions', icon: CreditCard, label: '訂閱' },
  { path: '/analytics', icon: PieChart, label: '分析' },
  { path: '/settings', icon: Settings, label: '設定' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-all
                  ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}
                `}
              >
                <Icon 
                  className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? '' : 'opacity-60'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
