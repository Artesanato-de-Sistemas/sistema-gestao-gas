import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, Settings, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';

export function Header() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-800">
          Olá, {user?.name || 'Vendedor'}!
        </h1>
      </div>

      {/* User dropdown */}
      <div className="relative" ref={ref}>
        <button
          id="header-user-menu-btn"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer select-none"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <UserIcon className="w-4 h-4 text-orange-500" />
          </div>

          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name || 'Vendedor'}</p>
            <p className="text-xs text-slate-400 leading-tight capitalize">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              id="header-menu-meus-dados"
              onClick={() => go('/meus-dados')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
              Meus Dados
            </button>

            {isAdmin && (
              <>
                <div className="my-1 h-px bg-slate-100 mx-3" />
                <button
                  id="header-menu-definicoes"
                  onClick={() => go('/definicoes')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  Definições do Sistema
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
