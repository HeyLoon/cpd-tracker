import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '🏠', label: '首頁' },
  { path: '/assets', icon: '📦', label: '資產' },
  { path: '/subscriptions', icon: '🔄', label: '訂閱' },
  { path: '/analytics', icon: '📊', label: '分析' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-area-bottom">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center gap-1 px-6 py-3 rounded-xl transition-all"
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/30" />
                )}
                
                {/* Icon with glow effect when active */}
                <span 
                  className={`relative text-2xl transition-all ${
                    isActive ? 'scale-110' : 'scale-100 opacity-60'
                  }`}
                  style={isActive ? {
                    filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.5))'
                  } : undefined}
                >
                  {item.icon}
                </span>
                
                {/* Label - only show when active */}
                {isActive && (
                  <span className="relative text-[10px] font-bold text-primary uppercase tracking-wider">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
