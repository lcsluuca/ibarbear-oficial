import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PanelShell } from '../../components/panel/PanelShell';
import {
  getCurrentUser,
  getSubscriptionInfo,
  getUserPayments,
  PLAN_PRICING,
  formatCurrency,
  simulateSubscriptionState,
} from '../../lib/storage';
import { PaymentRecord, User } from '../../types';
import {
  CreditCard,
  Zap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  RefreshCw,
  QrCode,
  Sparkles,
  AlertOctagon,
  FileText,
} from 'lucide-react';

export const PainelAssinatura: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const subInfo = getSubscriptionInfo(user);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    const loadPayments = async () => {
      setLoading(true);
      try {
        const history = await getUserPayments(user.id);
        setPayments(history);
      } catch (err) {
        console.error('Error loading payments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [user?.id]);

  const handleSimulate = async (
    state: 'active_30_days' | 'expiring_3_days' | 'expired' | 'unpaid'
  ) => {
    if (!user) return;
    const updated = await simulateSubscriptionState(user, state);
    setUser(updated);
    setActionFeedback(
      state === 'expiring_3_days'
        ? 'Estado alterado: Plano expirando em 3 dias (exibe aviso no topo).'
        : state === 'expired'
        ? 'Estado alterado: Plano expirado (bloqueio do painel ativado).'
        : state === 'unpaid'
        ? 'Estado alterado: Pagamento pendente.'
        : 'Estado alterado: Plano Pro ativo com 30 dias.'
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getStatusBadge = () => {
    if (subInfo.isExpired || subInfo.status === 'unpaid') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
          <AlertOctagon className="h-3.5 w-3.5" />
          <span>Vencido / Bloqueado</span>
        </span>
      );
    }
    if (subInfo.isExpiringSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
          <span>Expira em breve ({subInfo.daysRemaining} {subInfo.daysRemaining === 1 ? 'dia' : 'dias'})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Assinatura Ativa</span>
      </span>
    );
  };

  return (
    <PanelShell
      title="Minha Assinatura"
      action={
        <Link
          to="/pagamento?renewal=true"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 transition-colors"
        >
          <Zap className="h-3.5 w-3.5 fill-white" />
          <span>Renovar ou Alterar Plano via PIX</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Feedback Message */}
        {actionFeedback && (
          <div className="rounded-lg border border-neutral-300 bg-neutral-900 px-4 py-3 text-xs font-medium text-white shadow-md animate-in fade-in duration-200">
            {actionFeedback}
          </div>
        )}

        {/* Current Plan Overview Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-neutral-950">
                  {subInfo.plan === 'yearly' ? 'Plano IBarbear Pro Anual' : 'Plano IBarbear Pro Mensal'}
                </h2>
                {getStatusBadge()}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Acesso completo a todas as ferramentas de gestão, equipe e agendamento online.
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-2xl font-extrabold text-neutral-950">
                {subInfo.plan === 'yearly' ? 'R$ 888,00/ano' : 'R$ 89,00/mês'}
              </span>
              <span className="text-xs text-neutral-500">Pagamento via PIX instantâneo</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Status do Painel
              </span>
              <p className="mt-1 font-bold text-neutral-900 text-sm">
                {subInfo.isLocked ? 'Acesso Limitado' : 'Acesso Total Liberado'}
              </p>
            </div>

            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Data de Vencimento
              </span>
              <p className="mt-1 font-bold text-neutral-900 text-sm">
                {subInfo.formattedExpiresAt}
              </p>
            </div>

            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Dias Restantes
              </span>
              <p className={`mt-1 font-bold text-sm ${subInfo.isExpiringSoon ? 'text-amber-600' : subInfo.isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                {subInfo.isExpired
                  ? 'Expirado'
                  : `${subInfo.daysRemaining} ${subInfo.daysRemaining === 1 ? 'dia' : 'dias'}`}
              </p>
            </div>
          </div>

          {/* Call to Action for Renewal */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-neutral-900">
                  {subInfo.isExpired
                    ? 'Seu plano expirou. Renove agora para desbloquear'
                    : subInfo.isExpiringSoon
                    ? 'Seu plano vence em breve. Renove antecipadamente'
                    : 'Mantenha sua assinatura em dia via PIX'}
                </h4>
                <p className="text-xs text-neutral-500">
                  A compensação é imediata e adiciona os novos dias à sua conta sem interrupções.
                </p>
              </div>
            </div>

            <Link
              to="/pagamento?renewal=true"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition-colors shrink-0 w-full sm:w-auto"
            >
              <span>Renovar Assinatura (InfinitePay)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Payments History */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-neutral-700" />
              <h3 className="text-base font-bold text-neutral-950">
                Histórico de Pagamentos (InfinitePay)
              </h3>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {payments.length} {payments.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Carregando histórico de pagamentos...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Identificador</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Detalhes / Autenticação</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Acesso concedido até</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {p.id}
                      </td>
                      <td className="py-3 px-4">
                        {p.paymentMethod === 'credit_card' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            <CreditCard className="h-3 w-3" />
                            <span>Cartão ({p.cardBrand || 'Crédito'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Zap className="h-3 w-3" />
                            <span>PIX InfinitePay</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        {p.plan === 'yearly' ? 'Pro Anual' : 'Pro Mensal'}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {formatCurrency(p.amount)}
                        {p.cardInstallments && p.cardInstallments > 1 && (
                          <span className="block text-[10px] font-normal text-neutral-500">
                            em {p.cardInstallments}x
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-neutral-600">
                        {p.cardLast4 ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-800">
                              •••• {p.cardLast4}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              InfinitePay NSU
                            </span>
                          </div>
                        ) : p.e2eId ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-800 truncate max-w-[140px]" title={p.e2eId}>
                              {p.e2eId}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {p.bankName || 'InfinitePay / BACEN'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">InfinitePay Gateway</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-medium">
                        {new Date(p.expiresAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {p.status === 'approved' ? 'Aprovado' : p.status === 'pending' ? 'Pendente' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Developer / Demo Simulator Toolbar */}
        <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-neutral-700" />
            <h4 className="text-sm font-bold text-neutral-900">
              Ferramenta de Teste de Estados da Assinatura (Simulador)
            </h4>
          </div>
          <p className="text-xs text-neutral-600 mb-4">
            Utilize os botões abaixo para testar instantaneamente como o painel se comporta nos diferentes momentos do ciclo de cobrança PIX:
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleSimulate('active_30_days')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Simular Plano Ativo (30 dias)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulate('expiring_3_days')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Simular Vencimento Próximo (Faltam 3 dias)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulate('expired')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50 transition-colors"
            >
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>Simular Plano Vencido (Bloqueio do Painel)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulate('unpaid')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-neutral-500" />
              <span>Simular Sem Pagamento (Novo Cadastro)</span>
            </button>
          </div>
        </div>
      </div>
    </PanelShell>
  );
};
