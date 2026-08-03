import { Flame, Home, Box, Truck, Users, FileText, Menu, LogOut, User as UserIcon, Bike, UserCog } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from 'antd';
import { useAuthStore } from '@/store/useAuth';

export function Sidebar({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) {
  const routes = [
    { name: 'Entradas', path: '/inbounds', icon: Truck },
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Estoque', path: '/estoque', icon: Box },
    { name: 'Vendas', path: '/vendas', icon: FileText },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Entregadores', path: '/entregadores', icon: Bike },
    { name: 'Colaboradores', path: '/colaboradores', icon: UserCog },
  ];

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  return (
    <aside
      className={cn(
        'bg-[#EB6424] text-white h-screen transition-all duration-300 flex flex-col z-20 shadow-[4px_0_24px_rgba(235,100,36,0.2)]',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className={cn("flex items-center h-16 border-b border-white/20 relative", isOpen ? "justify-between px-4" : "justify-center")}>
        {isOpen && (
          <div className="flex items-center gap-2 font-bold text-white truncate w-full pr-10">
            <img src="/logo.png" alt="" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
          </div>
        )}
        <Button type="text" onClick={toggle} className={cn("text-white hover:!bg-white/20 hover:!text-white shrink-0 z-10 flex items-center justify-center p-0 w-8 h-8", isOpen ? "absolute right-2" : "")} icon={<Menu className="w-5 h-5" color="white" />} />
      </div>

      <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-3">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            title={route.name}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-white text-[#EB6424] font-semibold shadow-sm'
                  : 'text-white/80 hover:bg-white/20 hover:text-white',
                !isOpen && 'justify-center'
              )
            }
          >
            <route.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="truncate">{route.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/20 p-4">
        {isOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                 <UserIcon className="w-4 h-4" />
               </div>
               <span className="text-sm font-medium text-white truncate">
                 {user?.name || 'Vendedor'}
               </span>
            </div>
            <Button type="text" onClick={logout} title="Sair" className="text-white hover:!bg-white/20 hover:!text-white shrink-0 flex items-center justify-center p-0 w-8 h-8" icon={<LogOut className="w-5 h-5" color="white" />} />
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 cursor-pointer" title={user?.name || 'Vendedor'}>
              <UserIcon className="w-4 h-4" />
            </div>
            <Button type="text" onClick={logout} title="Sair" className="text-white hover:!bg-white/20 hover:!text-white shrink-0 flex items-center justify-center p-0 w-8 h-8" icon={<LogOut className="w-5 h-5" color="white" />} />
          </div>
        )}
      </div>
    </aside>
  );
}
