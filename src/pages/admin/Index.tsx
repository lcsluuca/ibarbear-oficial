import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/panel/AdminShell';
import {
  formatCurrency,
  getAdminShopsAsync,
  PLAN_PRICING,
} from '../../lib/storage';
import type { ShopAdminView } from '../../lib/storage';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// Mantém compatibilidade com outros arquivos que importem este tipo do painel.
export type { ShopAdminView } from '../../lib/storage';

type StatusFilter = ShopAdminView['subscriptionStatus'] | 'all';

function formatRegistrationDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

function getPlanLabel(plan: ShopAdminView['plan']): string {
  switch (plan) {
    case 'annual':
      return 'Anual';
    case 'free_trial':
      return 'Teste grátis';
    default:
      return 'Mensal';
  }
}

function getStatusBadge(status: ShopAdminView['subscriptionStatus']) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
        </span>
      );
    case 'expiring':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
          <Clock className="h-3.5 w-3.5" /> Próximo do vencimento
        </span>
      );
    case 'trialing':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
          <Clock className="h-3.5 w-3.5" /> Teste grátis
        </span>
      );
    case 'unpaid':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
          <XCircle className="h-3.5 w-3.5" /> Pendente
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
          <XCircle className="h-3.5 w-3.5" /> Vencido
        </span>
      );
    case 'canceled':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
          Cancelado
        </span>
      );
  }
}

export const AdminDashboardPage: React.FC = () => {
  const [shops, setShops] = useState<ShopAdminView[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadShops() {
      setLoading(true);
      setLoadError(null);

      try {
        const loadedShops = await getAdminShopsAsync();
        if (isMounted) setShops(loadedShops);
      } catch (error) {
        console.error('Erro ao carregar barbearias do painel admin:', error);
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Não foi possível consultar as barbearias no Firebase.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadShops();
    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const totalShops = shops.length;
  const activeSubscriptions = shops.filter(
    (shop) => shop.subscriptionStatus === 'active' || shop.subscriptionStatus === 'expiring'
  ).length;
  const unpaidShops = shops.filter((shop) => shop.subscriptionStatus === 'unpaid').length;

  // MRR = receita mensal equivalente, não o valor efetivamente recebido.
  const estimatedMRR = Math.round(
    shops.reduce((acc, shop) => {
      if (shop.subscriptionStatus !== 'active' && shop.subscriptionStatus !== 'expiring') {
        return acc;
      }
      if (shop.plan === 'monthly') return acc + PLAN_PRICING.monthly.priceCents;
      if (shop.plan === 'annual') return acc + PLAN_PRICING.yearly.priceCents / 12;
      return acc;
    }, 0)
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.shopName.toLowerCase().includes(normalizedSearch) ||
      shop.shopSlug.toLowerCase().includes(normalizedSearch);

    return (
      matchesSearch &&
      (statusFilter === 'all' || shop.subscriptionStatus === statusFilter)
    );
  });

  return (
    <AdminShell title="Painel Super Admin">
      <div className="mb-6 flex items-center gap-3 rounded-sm border border-neutral-200 bg-white p-4">
        <ShieldCheck className="h-6 w-6 shrink-0 text-neutral-700" />
        <p className="text-xs text-neutral-600">
          Visão global da plataforma sem exibição de dados pessoais dos clientes finais.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-sm border border-neutral-200 bg-white p-4">
          <div className="text-2xs font-bold uppercase text-neutral-500">Total Lojas</div>
          <p className="mt-1 font-display text-2xl font-black text-neutral-900">{totalShops}</p>
        </div>
        <div className="rounded-sm border border-neutral-200 bg-white p-4">
          <div className="text-2xs font-bold uppercase text-emerald-600">Assinantes Ativos</div>
          <p className="mt-1 font-display text-2xl font-black text-emerald-600">
            {activeSubscriptions}
          </p>
        </div>
        <div className="rounded-sm border border-neutral-200 bg-white p-4">
          <div className="text-2xs font-bold uppercase text-rose-600">Pagamentos Pendentes</div>
          <p className="mt-1 font-display text-2xl font-black text-rose-600">{unpaidShops}</p>
        </div>
        <div className="rounded-sm border border-neutral-200 bg-white p-4">
          <div className="text-2xs font-bold uppercase text-neutral-500">MRR Estimado</div>
          <p className="mt-1 font-display text-2xl font-black text-neutral-900">
            {formatCurrency(estimatedMRR)}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-3 rounded-sm border border-neutral-200 bg-white p-3.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por barbearia ou slug..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-sm border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-xs text-neutral-900 focus:border-black focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="rounded-sm border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="expiring">A vencer</option>
            <option value="trialing">Em Teste</option>
            <option value="unpaid">Pendentes</option>
            <option value="expired">Vencidos</option>
            <option value="canceled">Cancelados</option>
          </select>
          <button
            type="button"
            onClick={() => setReloadToken((current) => current + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-sm border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div>
            <strong>Erro ao consultar o Firebase:</strong> {loadError}
            <p className="mt-1">
              Confira se o usuário está autorizado a consultar as coleções shops e users.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-sm border border-neutral-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-neutral-200 bg-neutral-50 font-bold uppercase text-neutral-500">
            <tr>
              <th className="p-3.5">Barbearia</th>
              <th className="p-3.5">Plano</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Cadastro</th>
              <th className="p-3.5 text-center">Agendamentos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500">
                  Carregando barbearias...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-rose-700">
                  Não foi possível carregar os dados. Verifique a mensagem acima.
                </td>
              </tr>
            ) : filteredShops.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500">
                  Nenhuma barbearia cadastrada ou encontrada.
                </td>
              </tr>
            ) : (
              filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-neutral-50">
                  <td className="p-3.5">
                    <div className="font-bold text-neutral-900">{shop.shopName}</div>
                    <div className="text-[10px] text-neutral-400">/b/{shop.shopSlug}</div>
                  </td>
                  <td className="p-3.5 font-bold uppercase text-neutral-700">
                    {getPlanLabel(shop.plan)}
                  </td>
                  <td className="p-3.5">{getStatusBadge(shop.subscriptionStatus)}</td>
                  <td className="p-3.5 text-neutral-600">
                    {formatRegistrationDate(shop.registeredAt)}
                  </td>
                  <td className="p-3.5 text-center text-neutral-600">
                    {shop.totalBookingsCount ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
};
