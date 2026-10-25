import React, { useState, useEffect } from 'react';
import { PanelShell } from '../../components/panel/PanelShell';
import {
  getCurrentUser,
  getBarbers,
  saveBarber,
  deleteBarber,
  subscribeToBarbers,
} from '../../lib/storage';
import { Barber } from '../../types';
import { Plus, Users, Edit2, Trash2, Clock, Phone, X, AlertCircle } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
];

export const PainelEquipe: React.FC = () => {
  const user = getCurrentUser();
  const shopSlug = user?.shopSlug || 'navalha';

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [workingHours, setWorkingHours] = useState('09:00 - 19:00');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToBarbers(shopSlug, (data) => {
      setBarbers(data);
    });
    return () => unsub();
  }, [shopSlug]);

  const handleOpenAdd = () => {
    setEditingBarber(null);
    setName('');
    setSpecialty('Especialista em Degradê e Barba');
    setAvatar(AVATAR_PRESETS[0]);
    setWorkingHours('09:00 - 19:00');
    setPhone('');
    setActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Barber) => {
    setEditingBarber(b);
    setName(b.name);
    setSpecialty(b.specialty);
    setAvatar(b.avatar);
    setWorkingHours(b.workingHours);
    setPhone(b.phone || '');
    setActive(b.active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = (b: Barber) => {
    saveBarber({ ...b, active: !b.active });
  };

  const handleDelete = (b: Barber) => {
    if (
      window.confirm(
        `Excluir o barbeiro "${b.name}" da equipe? Esta ação não pode ser desfeita.`
      )
    ) {
      deleteBarber(b.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do barbeiro.');
      return;
    }

    const id = editingBarber ? editingBarber.id : `barb-${Date.now()}`;
    saveBarber({
      id,
      shopSlug,
      name: name.trim(),
      specialty: specialty.trim() || 'Barbeiro',
      avatar: avatar.trim() || AVATAR_PRESETS[0],
      workingHours: workingHours.trim() || '09:00 - 19:00',
      phone: phone.trim() || undefined,
      active,
    });

    setIsModalOpen(false);
  };

  return (
    <PanelShell
      title="Equipe"
      action={
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Barbeiro</span>
        </button>
      }
    >
      <div className="mb-6">
        <p className="text-xs text-neutral-500">
          Gerencie os barbeiros disponíveis para agendamento online na sua loja.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {barbers.map((b) => (
          <div
            key={b.id}
            className={`flex flex-col justify-between rounded-sm border bg-white p-5 transition-all ${
              b.active ? 'border-neutral-200 shadow-2xs' : 'border-neutral-200 bg-neutral-50/50 opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <img
                src={b.avatar}
                alt={b.name}
                className="h-16 w-16 rounded-sm object-cover border border-neutral-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-neutral-900 text-base truncate">{b.name}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{b.specialty}</p>
                <div className="mt-2 space-y-1 text-[11px] text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-neutral-400" />
                    {b.workingHours}
                  </span>
                  {b.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      {b.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3">
              <button
                onClick={() => handleToggleActive(b)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  b.active
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                }`}
              >
                {b.active ? 'Ativo na agenda' : 'Indisponível'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  className="rounded p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Excluir profissional"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Barber Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-md border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-neutral-900">
                {editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
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
                  Nome do Barbeiro <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo 'Du'"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Especialidade ou Cargo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mestre em Barboterapia & Degradê"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Horário de Trabalho
                </label>
                <input
                  type="text"
                  placeholder="Ex: 09:00 - 18:00"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1.5">
                  Foto do Perfil (Avatar)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Preset"
                      onClick={() => setAvatar(preset)}
                      className={`h-10 w-10 rounded cursor-pointer object-cover border-2 transition-all ${
                        avatar === preset ? 'border-black scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Ou cole o link de uma foto (URL)"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="barberActiveCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <label htmlFor="barberActiveCheck" className="text-xs font-medium text-neutral-700 cursor-pointer">
                  Disponível para agendamentos online
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
                  Salvar Barbeiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelShell>
  );
};
