import { useAuthStore } from '@/store/useAuth';

export function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-800">
          Olá, {user?.name || 'Vendedor'}!
        </h1>
      </div>
    </header>
  );
}
