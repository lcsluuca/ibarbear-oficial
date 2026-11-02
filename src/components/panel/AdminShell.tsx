import React, { useEffect } from 'react';
import { useVerifiedPanelAccess } from '../../lib/useVerifiedPanelAccess';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, Store } from 'lucide-react';
import { logoutUser } from '../../lib/storage';

interface AdminShellProps {
  title: string;
  children: React.ReactNode;
}

// Layout independente do PanelShell usado pelas barbearias.
export const AdminShell: React.FC<AdminShellProps> = ({ title, children }) => {
  const navigate = useNavigate();
  const { status } = useVerifiedPanelAccess('admin');

  useEffect(() => {
    if (status === 'denied') {
      navigate('/auth', { replace: true });
    }
  }, [status, navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/auth', { replace: true });
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center" role="status">Verificando permissao de administrador...</div>;
  }

  if (status !== 'allowed') {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">IBARBEAR</p>
              <p className="text-xs text-neutral-500">Administração da plataforma</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <nav aria-label="Menu do administrador" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <NavLink
            to="/admin/barbearias"
            className={({ isActive }) =>
              `inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-950'
              }`
            }
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            Gestão de Barbearias
          </NavLink>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-2xl font-black tracking-tight">{title}</h1>
        {children}
      </main>
    </div>
  );
};
