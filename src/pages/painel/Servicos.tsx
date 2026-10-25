import React, { useState, useEffect } from 'react';
import { PanelShell } from '../../components/panel/PanelShell';
import {
  getCurrentUser,
  getServices,
  saveService,
  deleteService,
  formatCurrency,
  subscribeToServices,
} from '../../lib/storage';
import { Service } from '../../types';
import { Plus, Clock, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';

export const PainelServicos: React.FC = () => {
  const user = getCurrentUser();
  const shopSlug = user?.shopSlug || 'navalha';

  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [priceReal, setPriceReal] = useState('50.00');
  const [durationMinutes, setDurationMinutes] = useState('40');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToServices(shopSlug, (data) => {
      setServices(data);
    });
    return () => unsub();
  }, [shopSlug]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName('');
    setPriceReal('50.00');
    setDurationMinutes('40');
    setDescription('');
    setActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setPriceReal((srv.price / 100).toFixed(2));
    setDurationMinutes(srv.durationMinutes.toString());
    setDescription(srv.description || '');
    setActive(srv.active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = (srv: Service) => {
    saveService({ ...srv, active: !srv.active });
  };

  const handleDelete = (srv: Service) => {
    if (
      window.confirm(
        `Excluir o serviço "${srv.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      deleteService(srv.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do serviço.');
      return;
    }

    const priceCents = Math.round(parseFloat(priceReal.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setErrorMsg('Informe um valor de preço válido.');
      return;
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      setErrorMsg('Informe uma duração em minutos válida.');
      return;
    }

    const id = editingService ? editingService.id : `srv-${Date.now()}`;
    saveService({
      id,
      shopSlug,
      name: name.trim(),
      price: priceCents,
      durationMinutes: duration,
      description: description.trim(),
      active,
    });

    setIsModalOpen(false);
  };

  return (
    <PanelShell
      title="Serviços"
      action={
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Serviço</span>
        </button>
      }
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          Gerencie o catálogo exibido na página pública da sua barbearia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`flex flex-col justify-between rounded-sm border bg-white p-5 transition-all ${
              srv.active ? 'border-neutral-200 shadow-2xs' : 'border-neutral-200 bg-neutral-50/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-neutral-900 text-base">{srv.name}</h3>
                <span className="font-display font-black text-neutral-900 text-lg whitespace-nowrap">
                  {formatCurrency(srv.price)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 line-clamp-2">
                {srv.description || 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="mt-5 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  {srv.durationMinutes} minutos
                </span>
                <button
                  onClick={() => handleToggleActive(srv)}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    srv.active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {srv.active ? 'Ativo no site' : 'Inativo'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(srv)}
                  className="rounded p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Excluir serviço"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-md border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-neutral-900">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Nome do Serviço <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê + Barboterapia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">
                    Preço (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    placeholder="50.00"
                    value={priceReal}
                    onChange={(e) => setPriceReal(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">
                    Duração (minutos) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                  >
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="40">40 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="50">50 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="75">1h 15 min</option>
                    <option value="90">1h 30 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Descrição (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique o que inclui o serviço..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <label htmlFor="activeCheck" className="text-xs font-medium text-neutral-700 cursor-pointer">
                  Disponível para agendamento online na página pública
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-black px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelShell>
  );
};
