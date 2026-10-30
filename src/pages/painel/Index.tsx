import React, { useState, useEffect } from 'react';
import { PanelShell } from '../../components/panel/PanelShell';
import {
  getCurrentUser,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  createBooking,
  getServices,
  getBarbers,
  formatCurrency,
  subscribeToBookings,
  subscribeToServices,
  subscribeToBarbers,
} from '../../lib/storage';
import { Booking, BookingStats, BookingStatus, Service, Barber } from '../../types';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Trash2,
  Plus,
  MessageSquare,
  Filter,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

/* --- COMPONENTE INTERNO DO MODAL DE EXCLUSÃO --- */
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  description = 'Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.',
  itemName,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl transition-all scale-100 border border-neutral-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
        
        {itemName && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600 bg-rose-50 py-1 px-2.5 rounded-md inline-block">
            "{itemName}"
          </p>
        )}

        <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- PÁGINA PRINCIPAL DO PAINEL DE AGENDAMENTOS --- */
export const PainelPage: React.FC = () => {
  const user = getCurrentUser();
  const shopSlug = user?.shopSlug || 'navalha';

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Estado para controlar o modal de confirmação de exclusão
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Services and Barbers for manual booking modal
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Manual booking form state
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualBarberId, setManualBarberId] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('14:00');
  const [manualNotes, setManualNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Subscribe to real-time Firestore data
  useEffect(() => {
    setLoading(true);
    const unsubBookings = subscribeToBookings(shopSlug, (bks, st) => {
      setAllBookings(bks);
      setStats(st);
      setLoading(false);
    });

    const unsubServices = subscribeToServices(shopSlug, (srvs) => {
      setServices(srvs);
    });

    const unsubBarbers = subscribeToBarbers(shopSlug, (brbs) => {
      setBarbers(brbs);
    });

    return () => {
      unsubBookings();
      unsubServices();
      unsubBarbers();
    };
  }, [shopSlug]);

  // Filter bookings based on selected filters
  const bookings = allBookings.filter((b) => {
    if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
    if (selectedDateFilter !== 'all' && b.date !== selectedDateFilter) return false;
    return true;
  });

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    updateBookingStatus(shopSlug, bookingId, newStatus);
  };

  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    try {
      setIsDeleting(true);
      await deleteBooking(shopSlug, bookingToDelete.id);
      setBookingToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir agendamento:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim() || !manualServiceId || !manualBarberId) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    const srv = services.find((s) => s.id === manualServiceId);
    const brb = barbers.find((b) => b.id === manualBarberId);
    if (!srv || !brb) return;

    try {
      createBooking(shopSlug, {
        serviceId: srv.id,
        serviceName: srv.name,
        servicePrice: srv.price,
        barberId: brb.id,
        barberName: brb.name,
        customerName: manualName.trim(),
        customerPhone: manualPhone.trim(),
        date: manualDate,
        time: manualTime,
        notes: manualNotes.trim() || '',
      });

      setIsNewModalOpen(false);
      setManualName('');
      setManualPhone('');
      setManualNotes('');
      setFormError(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar agendamento.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Confirmado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
            <Clock className="h-3 w-3" /> Pendente
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-700">
            <CheckCircle className="h-3 w-3" /> Concluído
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
            <XCircle className="h-3 w-3" /> Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PanelShell
      title="Agendamentos"
      action={
        <button
          onClick={() => {
            if (services.length > 0 && !manualServiceId) setManualServiceId(services[0].id);
            if (barbers.length > 0 && !manualBarberId) setManualBarberId(barbers[0].id);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Agendamento</span>
        </button>
      }
    >
      {/* Metrics Stats Row */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-sm border border-neutral-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total</div>
            <div className="font-display text-2xl font-black text-neutral-900 mt-1">
              {stats.total}
            </div>
          </div>
          <div className="rounded-sm border border-neutral-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Pendentes</div>
            <div className="font-display text-2xl font-black text-amber-600 mt-1">
              {stats.pending}
            </div>
          </div>
          <div className="rounded-sm border border-neutral-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Confirmados
            </div>
            <div className="font-display text-2xl font-black text-emerald-600 mt-1">
              {stats.confirmed}
            </div>
          </div>
          <div className="rounded-sm border border-neutral-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Concluídos
            </div>
            <div className="font-display text-2xl font-black text-neutral-900 mt-1">
              {stats.done}
            </div>
          </div>
          <div className="rounded-sm border border-neutral-200 bg-white p-4 col-span-2 sm:col-span-1">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Receita Prevista
            </div>
            <div className="font-display text-xl font-black text-neutral-900 mt-1">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 rounded-sm border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'Todos', val: 'all' },
              { label: 'Pendentes', val: 'pending' },
              { label: 'Confirmados', val: 'confirmed' },
              { label: 'Concluídos', val: 'done' },
              { label: 'Cancelados', val: 'canceled' },
            ].map((st) => (
              <button
                key={st.val}
                onClick={() => setSelectedStatus(st.val)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedStatus === st.val
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-neutral-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Data:
            </span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="rounded-sm border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-black focus:outline-hidden"
            >
              <option value="all">Todas as datas</option>
              <option value={todayStr}>Hoje ({todayStr})</option>
              <option value={tomorrowStr}>Amanhã ({tomorrowStr})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="rounded-sm border border-dashed border-neutral-300 bg-white p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-neutral-400" />
          <h3 className="mt-3 font-display font-bold uppercase text-neutral-800">
            Nenhum agendamento encontrado
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            Nenhum agendamento corresponde aos filtros selecionados.
          </p>
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedDateFilter('all');
              }}
              className="text-xs font-bold text-black underline"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col justify-between rounded-sm border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400 sm:flex-row sm:items-center gap-4"
            >
              {/* Left: Customer and Service info */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-neutral-900 text-base">{booking.customerName}</span>
                  {getStatusBadge(booking.status)}
                  <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {booking.id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-600">
                  <span className="font-semibold text-neutral-900">
                    {booking.serviceName} ({formatCurrency(booking.servicePrice)})
                  </span>
                  <span>
                    Profissional: <strong className="text-neutral-900">{booking.barberName}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-neutral-900 font-bold">
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    {booking.date} às {booking.time}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {booking.customerPhone}
                  </span>
                  {booking.notes && (
                    <span className="italic text-neutral-400 truncate max-w-sm">
                      Obs: "{booking.notes}"
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 sm:border-0 sm:pt-0">
                {/* WhatsApp button */}
                <a
                  href={`https://wa.me/55${booking.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${booking.customerName}, confirmamos seu agendamento na Barbearia para o dia ${booking.date} às ${booking.time} (${booking.serviceName}). Qualquer dúvida estamos à disposição!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Falar no WhatsApp"
                  className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>

                {/* Status action switches */}
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                    className="rounded bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
                  >
                    Confirmar
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'done')}
                    className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                  >
                    Concluir
                  </button>
                )}

                {booking.status !== 'canceled' && booking.status !== 'done' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'canceled')}
                    className="rounded border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                  >
                    Cancelar
                  </button>
                )}

                {booking.status === 'canceled' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                    className="rounded border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Reativar
                  </button>
                )}

                <button
                  onClick={() => setBookingToDelete(booking)}
                  title="Excluir agendamento"
                  className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Manual Booking Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-md border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-neutral-900">
                Novo Agendamento Manual
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateManualBooking} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Nome do Cliente <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Telefone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98888-8888"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">
                    Serviço <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">
                    Profissional <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={manualBarberId}
                    onChange={(e) => setManualBarberId(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">
                    Data <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700">
                    Horário <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cliente prefere máquina 2 nas laterais"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-black px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                >
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={bookingToDelete ? `Agendamento de ${bookingToDelete.customerName}` : undefined}
        title="Excluir Agendamento"
        description="Tem certeza de que deseja excluir este agendamento? Esta ação removerá o registro do painel."
        loading={isDeleting}
      />
    </PanelShell>
  );
};