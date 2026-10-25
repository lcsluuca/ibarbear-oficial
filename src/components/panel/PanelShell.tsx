import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../site/Logo';
import {
  getCurrentUser,
  getShop,
  logoutUser,
  getSubscriptionInfo,
  simulateSubscriptionState,
} from '../../lib/storage';
import {
  Calendar,
  Scissors,
  Users,
  Store,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
  PlusCircle,
  Home,
  CreditCard,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Lock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface PanelShellProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const PanelShell: React.FC<PanelShellProps> = ({ title, children, action }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  const shop = user ? getShop(user.shopSlug) : getShop('navalha');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return null;
  }

  const subInfo = getSubscriptionInfo(user);
  const shopSlug = shop?.slug || 'navalha';
  const publicUrl = `${window.location.origin}/b/${shopSlug}`;

  const navItems = [
    { label: 'Agendamentos', href: '/painel', icon: Calendar },
    { label: 'Serviços', href: '/painel/servicos', icon: Scissors },
    { label: 'Produtos & Estoque', href: '/painel/produtos', icon: Package },
    { label: 'Equipe', href: '/painel/equipe', icon: Users },
    { label: 'Minha loja', href: '/painel/loja', icon: Store },
    {
      label: 'Assinatura & PIX',
      href: '/painel/assinatura',
      icon: CreditCard,
      badge: subInfo.isExpired ? 'Vencido' : subInfo.isExpiringSoon ? 'Expira logo' : undefined,
      badgeColor: subInfo.isExpired
        ? 'bg-rose-100 text-rose-800'
        : subInfo.isExpiringSoon
        ? 'bg-amber-100 text-amber-800'
        : 'bg-emerald-100 text-emerald-800',
    },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate('/auth');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isAssinaturaPage = location.pathname === '/painel/assinatura';
  const isAccessLocked = subInfo.isLocked && !isAssinaturaPage;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:hidden">
        <Logo />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded p-2 text-neutral-600 hover:bg-neutral-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-6">
          <Logo />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shop Info Card */}
        <div className="border-b border-neutral-200 bg-neutral-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-black text-white font-bold font-display text-sm uppercase">
              {shop?.name?.slice(0, 2) || 'NA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-neutral-900">
                {shop?.name || 'Barbearia Navalha'}
              </p>
              <p className="truncate text-xs text-neutral-500 font-mono">
                /b/{shopSlug}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link
              to={`/b/${shopSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:text-black"
            >
              <span>Ver página</span>
              <ExternalLink className="h-3 w-3 text-neutral-400" />
            </Link>
            <button
              onClick={handleCopyLink}
              title="Copiar link da página pública"
              className="inline-flex items-center justify-center rounded-sm border border-neutral-300 bg-white p-1.5 text-neutral-700 shadow-2xs hover:bg-neutral-50"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-neutral-500" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/painel'
                ? location.pathname === '/painel'
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-sm px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Subscription Status Pill in Sidebar */}
        <div className="px-4 py-2">
          <Link
            to="/painel/assinatura"
            className="block rounded-lg border border-neutral-200 bg-neutral-50 p-3 hover:border-neutral-300 transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-neutral-500">Plano Pro</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                  subInfo.isExpired
                    ? 'bg-rose-100 text-rose-800'
                    : subInfo.isExpiringSoon
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {subInfo.isExpired
                  ? 'Vencido'
                  : subInfo.isExpiringSoon
                  ? `${subInfo.daysRemaining}d restantes`
                  : 'Ativo'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-600">
              Vence em: <strong>{subInfo.formattedExpiresAt}</strong>
            </p>
          </Link>
        </div>

        {/* User Footer */}
        <div className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
            <span className="truncate">{user?.email || 'barbeiro@navalha.com'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-neutral-200 bg-white py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Home className="h-3.5 w-3.5 text-neutral-500" />
              <span>Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Expiring Warning Banner */}
        {subInfo.isExpiringSoon && !subInfo.isExpired && (
          <div className="bg-amber-500 px-4 py-3 text-white shadow-xs">
            <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <AlertTriangle className="h-5 w-5 shrink-0 text-white fill-amber-600" />
                <span>
                  <strong>Aviso de Vencimento:</strong> Sua assinatura expira em{' '}
                  <strong>
                    {subInfo.daysRemaining} {subInfo.daysRemaining === 1 ? 'dia' : 'dias'}
                  </strong>{' '}
                  ({subInfo.formattedExpiresAt}). Realize o pagamento via InfinitePay (PIX ou Cartão) para não ter o acesso suspenso.
                </span>
              </div>
              <Link
                to="/pagamento?renewal=true"
                className="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-black px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-900"
              >
                <Zap className="h-3.5 w-3.5 fill-white" />
                <span>Renovar via InfinitePay</span>
              </Link>
            </div>
          </div>
        )}

        {/* Top bar header inside panel */}
        <header className="border-b border-neutral-200 bg-white px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-neutral-900">
                {title}
              </h1>
            </div>
            {action && <div>{action}</div>}
          </div>
        </header>

        {/* Inner Content or Locked View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            {isAccessLocked ? (
              /* Gated / Locked Subscription Screen */
              <div className="rounded-2xl border border-rose-200 bg-white p-8 sm:p-12 text-center shadow-md max-w-xl mx-auto my-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-5">
                  <Lock className="h-8 w-8" />
                </div>

                <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-800 mb-3">
                  Acesso ao Painel Suspenso
                </span>

                <h2 className="text-2xl font-extrabold text-neutral-950">
                  {subInfo.status === 'unpaid'
                    ? 'Pagamento Inicial Pendente (InfinitePay)'
                    : 'Assinatura IBarbear Pro Vencida'}
                </h2>

                <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                  {subInfo.status === 'unpaid'
                    ? 'Para liberar o acesso ao painel de controle, agenda e página da sua barbearia, realize o pagamento da sua assinatura via InfinitePay (PIX ou Cartão).'
                    : `O período de acesso da sua barbearia venceu em ${subInfo.formattedExpiresAt}. Para restabelecer o acesso total aos agendamentos e equipe, efetue a renovação via InfinitePay.`}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    to="/pagamento?renewal=true"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-neutral-800 transition-colors"
                  >
                    <Zap className="h-4 w-4 fill-white" />
                    <span>Realizar Pagamento (InfinitePay PIX / Cartão)</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/painel/assinatura"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                  >
                    <CreditCard className="h-4 w-4 text-neutral-500" />
                    <span>Ver detalhes da minha assinatura</span>
                  </Link>
                </div>

                {/* Quick Simulation Bar for Testing */}
                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <p className="text-[11px] text-neutral-500 mb-3">
                    Modo Teste / Demonstração:
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await simulateSubscriptionState(user, 'active_30_days');
                      setUser(updated);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Desbloquear Painel (Simular Ativo 30 dias)</span>
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

