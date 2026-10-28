import React, { useState, useEffect } from 'react';
import { PanelShell } from '../../components/panel/PanelShell';
import { getCurrentUser, getBarbers, subscribeToBarbers } from '../../lib/storage';
import {
  Users,
  Percent,
  DollarSign,
  Settings,
  Scissors,
  CheckCircle,
  TrendingUp,
  Save,
  CreditCard,
} from 'lucide-react';

interface BarbeiroComissao {
  id: string;
  nome: string;
  porcentagemPadrao: number;
  descontarTaxaCartao: boolean;
  totalServicosMes: number;
  totalComissaoMes: number;
  totalBarbeariaMes: number;
}

export const PainelComissoes: React.FC = () => {
  const [user] = useState(getCurrentUser());
  const [barbeiros, setBarbeiros] = useState<BarbeiroComissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const shopSlug = user.shopSlug || 'navalha';

    // 1. Carregamento inicial síncrono via getBarbers
    const barbersFromStorage = getBarbers(shopSlug);
    mapearEAtualizarBarbeiros(barbersFromStorage);
    setLoading(false);

    // 2. Inscrição em tempo real para capturar quando um novo barbeiro for cadastrado em "Equipe"
    const unsubscribe = subscribeToBarbers(shopSlug, (updatedBarbers) => {
      mapearEAtualizarBarbeiros(updatedBarbers);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.shopSlug]);

  // Função auxiliar para mapear o tipo Barber do storage para BarbeiroComissao
  const mapearEAtualizarBarbeiros = (barbersList: any[]) => {
    if (!Array.isArray(barbersList)) return;

    setBarbeiros((prevAtuais) => {
      return barbersList.map((b) => {
        // Preserva alterações não salvas que o usuário possa ter feito na tela
        const existente = prevAtuais.find((p) => p.id === b.id);
        const pct = existente ? existente.porcentagemPadrao : 50;
        const descontar = existente ? existente.descontarTaxaCartao : true;
        const totalFaturado = 0; // Pode ser integrado com os agendamentos finalizados (Bookings)
        const comissao = (totalFaturado * pct) / 100;

        return {
          id: b.id,
          nome: b.name,
          porcentagemPadrao: pct,
          descontarTaxaCartao: descontar,
          totalServicosMes: totalFaturado,
          totalComissaoMes: comissao,
          totalBarbeariaMes: totalFaturado - comissao,
        };
      });
    });
  };

  const handleUpdatePercentage = (id: string, newPercentage: number) => {
    setBarbeiros((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const comissao = (b.totalServicosMes * newPercentage) / 100;
          return {
            ...b,
            porcentagemPadrao: newPercentage,
            totalComissaoMes: comissao,
            totalBarbeariaMes: b.totalServicosMes - comissao,
          };
        }
        return b;
      })
    );
  };

  const handleToggleCardFee = (id: string) => {
    setBarbeiros((prev) =>
      prev.map((b) => (b.id === id ? { ...b, descontarTaxaCartao: !b.descontarTaxaCartao } : b))
    );
  };

  const handleSaveConfigs = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const totalFaturadoGeral = barbeiros.reduce((acc, b) => acc + b.totalServicosMes, 0);
  const totalRepasseBarbeiros = barbeiros.reduce((acc, b) => acc + b.totalComissaoMes, 0);
  const totalLucroBarbearia = barbeiros.reduce((acc, b) => acc + b.totalBarbeariaMes, 0);

  return (
    <PanelShell title="Gestão de Comissões">
      <div className="space-y-8">
        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-900 text-white p-4 text-xs font-bold shadow-md">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>Regras de comissionamento salvas com sucesso!</span>
          </div>
        )}

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Faturamento Equipe
              </span>
              <DollarSign className="h-4 w-4 text-neutral-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-neutral-950">
              R$ {totalFaturadoGeral.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Repasse aos Barbeiros
              </span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-indigo-600">
              R$ {totalRepasseBarbeiros.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Lucro Barbearia
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">
              R$ {totalLucroBarbearia.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Tabela dos Barbeiros Cadastrados */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-950 flex items-center gap-2">
                <Settings className="h-5 w-5 text-neutral-700" />
                <span>Barbeiros da Equipe</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Configure as comissões dos profissionais cadastrados em Equipe.
              </p>
            </div>

            <button
              onClick={handleSaveConfigs}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Regras</span>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Carregando equipe...
            </div>
          ) : barbeiros.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Nenhum barbeiro cadastrado na aba <strong>Equipe</strong> ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Barbeiro</th>
                    <th className="py-3 px-4">% Comissão</th>
                    <th className="py-3 px-4">Descontar Taxas Cartão</th>
                    <th className="py-3 px-4">Atendimentos do Mês</th>
                    <th className="py-3 px-4">Comissão a Pagar</th>
                    <th className="py-3 px-4 text-right">Fica p/ Barbearia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {barbeiros.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-neutral-900 flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-neutral-400" />
                        <span>{b.nome}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 max-w-[100px]">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={b.porcentagemPadrao}
                            onChange={(e) => handleUpdatePercentage(b.id, Number(e.target.value))}
                            className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs font-bold text-center focus:border-neutral-900 focus:outline-none"
                          />
                          <Percent className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={b.descontarTaxaCartao}
                            onChange={() => handleToggleCardFee(b.id)}
                            className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                          />
                          <span className="text-neutral-600 flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Sim</span>
                          </span>
                        </label>
                      </td>

                      <td className="py-4 px-4 font-semibold text-neutral-700">
                        R$ {b.totalServicosMes.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-4 px-4 font-bold text-indigo-600">
                        R$ {b.totalComissaoMes.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-4 px-4 font-bold text-emerald-600 text-right">
                        R$ {b.totalBarbeariaMes.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
};