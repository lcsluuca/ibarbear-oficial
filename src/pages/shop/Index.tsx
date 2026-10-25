import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  getShop,
  getServices,
  getBarbers,
  getAvailableSlots,
  createBooking,
  formatCurrency,
  subscribeToShop,
  subscribeToServices,
  subscribeToBarbers,
  subscribeToProducts,
} from '../../lib/storage';
import { BarberShop, Service, Barber, Booking, Product } from '../../types';
import {
  Scissors,
  Clock,
  MapPin,
  Phone,
  Instagram,
  Calendar as CalendarIcon,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  Share2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Store,
  Package,
  ShoppingBag,
  Tag,
  X,
  Check,
} from 'lucide-react';

export const ShopPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const shopSlug = slug || 'navalha';

  const [shop, setShop] = useState<BarberShop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Wizard state: 1: Service, 2: Barber, 3: Date/Time, 4: Customer Details, 5: Confirmation
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Load shop data & real-time Firestore sync
  useEffect(() => {
    setLoading(true);
    const unsubShop = subscribeToShop(shopSlug, (data) => {
      if (data) setShop(data);
      setLoading(false);
    });

    const unsubServices = subscribeToServices(shopSlug, (data) => {
      setServices(data.filter((s) => s.active));
    });

    const unsubBarbers = subscribeToBarbers(shopSlug, (data) => {
      setBarbers(data.filter((b) => b.active));
    });

    const unsubProducts = subscribeToProducts(shopSlug, (data) => {
      setProducts(data.filter((p) => p.active && p.showInCatalog !== false));
    });

    return () => {
      unsubShop();
      unsubServices();
      unsubBarbers();
      unsubProducts();
    };
  }, [shopSlug]);

  // Set default date to today
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [selectedDate]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  // Available dates (Next 14 days)
  const availableDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const day = d.toLocaleDateString('pt-BR', { day: '2-digit' });
    const month = d.toLocaleDateString('pt-BR', { month: 'short' });
    return { iso, weekday, day, month, dateObj: d };
  });

  // Available time slots
  const timeSlots = selectedDate
    ? getAvailableSlots(shopSlug, selectedBarberId, selectedDate)
    : [];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setErrorMsg(null);
    setStep(2);
  };

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarberId(barberId);
    setErrorMsg(null);
    setStep(3);
  };

  const handleDateTimeContinue = () => {
    if (!selectedDate) {
      setErrorMsg('Selecione uma data para o agendamento.');
      return;
    }
    if (!selectedTime) {
      setErrorMsg('Selecione um horário disponível.');
      return;
    }
    setErrorMsg(null);
    setStep(4);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Por favor, preencha seu nome completo.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Por favor, informe um telefone de WhatsApp válido.');
      return;
    }

    if (!selectedService) {
      setErrorMsg('Selecione um serviço válido.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Pick random active barber if "any" was selected
      let finalBarberId = selectedBarberId;
      let finalBarberName = selectedBarber ? selectedBarber.name : 'Qualquer Profissional';

      if (selectedBarberId === 'any') {
        const availableBarbers = barbers.length > 0 ? barbers : [];
        if (availableBarbers.length > 0) {
          const chosen = availableBarbers[Math.floor(Math.random() * availableBarbers.length)];
          finalBarberId = chosen.id;
          finalBarberName = chosen.name;
        }
      }

      const booking = createBooking(shopSlug, {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        barberId: finalBarberId,
        barberName: finalBarberName,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || '',
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || '',
      });

      setCompletedBooking(booking);
      setStep(5);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar agendamento.';
      setErrorMsg(msg);
      if (msg.includes('já foi reservado')) {
        setStep(3);
        setSelectedTime('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedServiceId('');
    setSelectedBarberId('any');
    setSelectedTime('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setCompletedBooking(null);
    setErrorMsg(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-sm text-neutral-400">Carregando barbearia...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 text-center">
        <div className="max-w-md rounded-lg border border-neutral-300 bg-white p-8 shadow-md">
          <Store className="mx-auto h-12 w-12 text-neutral-400" />
          <h2 className="mt-4 font-display text-2xl font-bold uppercase text-neutral-900">
            Barbearia não encontrada
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            O endereço informado <span className="font-mono font-bold">/b/{shopSlug}</span> não existe ou foi alterado.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/b/navalha"
              className="rounded bg-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
            >
              Ver Barbearia Demo (Navalha)
            </Link>
            <Link
              to="/"
              className="rounded border border-neutral-300 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Ir para a Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-900 selection:bg-white selection:text-black">
      {/* Top Bar for Shop */}
      <header className="border-b border-neutral-800 bg-black py-6 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-white text-black font-display font-black text-2xl tracking-tighter shadow-md">
                {shop.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
                    {shop.name}
                  </h1>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{shop.tagline}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
              {shop.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="truncate max-w-[200px]">{shop.address}</span>
                </span>
              )}
              {shop.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{shop.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Booking Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Step Progress Header */}
        {step < 5 && (
          <div className="mb-8 rounded-sm border border-neutral-800 bg-neutral-900/90 p-4 text-white">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-3">
              <span className="uppercase tracking-widest text-neutral-300 font-bold">
                Passo {step} de 4
              </span>
              <span>
                {step === 1 && 'Escolha o Serviço'}
                {step === 2 && 'Escolha o Profissional'}
                {step === 3 && 'Escolha Data & Horário'}
                {step === 4 && 'Seus Dados & Confirmação'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Booking Card */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-900 text-white shadow-2xl overflow-hidden">
          {/* STEP 1: SERVICES */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Etapa 1
                </span>
                <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white mt-1">
                  Selecione o Serviço
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Escolha o procedimento que deseja realizar.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {services.map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className={`group relative flex flex-col justify-between rounded-sm border p-5 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-white bg-white/10 ring-1 ring-white'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-600 hover:bg-neutral-950'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-white text-base group-hover:text-white">
                            {service.name}
                          </h3>
                          <span className="font-display font-extrabold text-white text-lg whitespace-nowrap">
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                        {service.description && (
                          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          {service.durationMinutes} minutos
                        </span>
                        <span className="font-bold text-white group-hover:translate-x-0.5 transition-transform">
                          Escolher →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: BARBER SELECTION */}
          {step === 2 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Etapa 2
                  </span>
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white mt-1">
                    Escolha o Barbeiro
                  </h2>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                </button>
              </div>

              {selectedService && (
                <div className="mb-6 rounded border border-neutral-800 bg-black/40 p-3.5 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-neutral-400">Serviço selecionado:</span>
                    <p className="font-bold text-white">{selectedService.name}</p>
                  </div>
                  <span className="font-display font-bold text-white">
                    {formatCurrency(selectedService.price)}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {/* Any Barber Option */}
                <div
                  onClick={() => handleBarberSelect('any')}
                  className={`flex items-center justify-between rounded-sm border p-4 cursor-pointer transition-all ${
                    selectedBarberId === 'any'
                      ? 'border-white bg-white/10'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-neutral-800 text-white">
                      <Scissors className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Qualquer Profissional</h3>
                      <p className="text-xs text-neutral-400">
                        O primeiro barbeiro com horário livre disponível
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                </div>

                {/* Individual Barbers */}
                {barbers.map((barber) => {
                  const isSelected = selectedBarberId === barber.id;
                  return (
                    <div
                      key={barber.id}
                      onClick={() => handleBarberSelect(barber.id)}
                      className={`flex items-center justify-between rounded-sm border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-white bg-white/10'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={barber.avatar}
                          alt={barber.name}
                          className="h-12 w-12 rounded-sm object-cover border border-neutral-700"
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm">{barber.name}</h3>
                          <p className="text-xs text-neutral-400">{barber.specialty}</p>
                          <span className="text-[11px] text-neutral-500">
                            Atendimento: {barber.workingHours}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME */}
          {step === 3 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Etapa 3
                  </span>
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white mt-1">
                    Data e Horário
                  </h2>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                </button>
              </div>

              {/* Date Horizontal Carousel / Picker */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Selecione o Dia
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.iso;
                    return (
                      <button
                        key={item.iso}
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.iso);
                          setSelectedTime('');
                        }}
                        className={`flex min-w-[72px] flex-col items-center rounded-sm border p-3 text-center transition-all ${
                          isSelected
                            ? 'border-white bg-white text-black font-bold shadow-md'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-600 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {item.weekday}
                        </span>
                        <span className="font-display text-xl font-black mt-0.5">
                          {item.day}
                        </span>
                        <span className="text-[10px] uppercase text-neutral-400">
                          {item.month}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Horários Disponíveis ({timeSlots.length})
                </label>

                {timeSlots.length === 0 ? (
                  <div className="rounded border border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-400">
                    Nenhum horário disponível para esta data com o profissional selecionado. Por favor, escolha outro dia.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                    {timeSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-sm border py-2.5 text-center text-sm font-semibold transition-all ${
                            isSelected
                              ? 'border-white bg-white text-black font-bold shadow-md ring-2 ring-white'
                              : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-500 hover:text-white'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Continue Action */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedTime}
                  onClick={handleDateTimeContinue}
                  className="inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-bold text-black shadow-md transition-all hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Continuar para dados</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {step === 4 && (
            <form onSubmit={handleConfirmBooking} className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Etapa 4
                  </span>
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white mt-1">
                    Confirmar Agendamento
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                </button>
              </div>

              {/* Summary Box */}
              <div className="mb-6 rounded border border-neutral-800 bg-black/60 p-4">
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-neutral-500 block">Serviço</span>
                    <span className="font-bold text-white">{selectedService?.name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Profissional</span>
                    <span className="font-bold text-white">
                      {selectedBarber ? selectedBarber.name : 'Qualquer Profissional'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Data e Horário</span>
                    <span className="font-bold text-white">
                      {selectedDate} às {selectedTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Valor a pagar</span>
                    <span className="font-display font-black text-white text-base">
                      {selectedService ? formatCurrency(selectedService.price) : 'R$ 0,00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Seu Nome Completo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Matheus Oliveira"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-hidden focus:ring-1 focus:ring-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Telefone / WhatsApp <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (11) 98765-4321"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1.5 w-full rounded-sm border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-hidden focus:ring-1 focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: matheus@exemplo.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-sm border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-hidden focus:ring-1 focus:ring-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Observações ou Preferências (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Prefiro tesoura na parte superior, barba desenhada baixa..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-hidden focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-800 pt-6">
                <p className="text-xs text-neutral-400">
                  O pagamento será feito diretamente no local (dinheiro, Pix ou cartão).
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-white px-8 py-3.5 text-sm font-bold text-black shadow-lg transition-all hover:bg-neutral-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Processando agendamento...</span>
                  ) : (
                    <>
                      <span>Finalizar Agendamento</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: SUCCESS CONFIRMATION */}
          {step === 5 && completedBooking && (
            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <span className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-emerald-400">
                Agendamento Confirmado!
              </span>

              <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
                Te esperamos, {completedBooking.customerName.split(' ')[0]}!
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
                Seu horário está reservado com sucesso na {shop.name}.
              </p>

              {/* Booking Voucher Card */}
              <div className="mx-auto mt-8 max-w-md rounded border border-neutral-800 bg-neutral-950 p-6 text-left shadow-lg">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <span className="text-xs font-bold uppercase text-neutral-400">
                    Código do Agendamento
                  </span>
                  <span className="font-mono text-sm font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">
                    {completedBooking.id}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Serviço:</span>
                    <span className="font-bold text-white">{completedBooking.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Profissional:</span>
                    <span className="font-bold text-white">{completedBooking.barberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Data e Hora:</span>
                    <span className="font-bold text-white">
                      {completedBooking.date} às {completedBooking.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Valor a pagar no local:</span>
                    <span className="font-display font-extrabold text-white text-sm">
                      {formatCurrency(completedBooking.servicePrice)}
                    </span>
                  </div>
                  {shop.address && (
                    <div className="flex justify-between border-t border-neutral-800/80 pt-2">
                      <span className="text-neutral-400">Local:</span>
                      <span className="text-white text-right max-w-[200px]">{shop.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Action and Return Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={`https://wa.me/55${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá, confirmei meu agendamento no site Navalha! Código: ${completedBooking.id} para ${completedBooking.date} às ${completedBooking.time} com ${completedBooking.barberName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Enviar mensagem no WhatsApp</span>
                </a>

                <button
                  onClick={resetBooking}
                  className="rounded-sm border border-neutral-700 bg-neutral-800 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
                >
                  Agendar outro horário
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PRODUCTS SHOWCASE SECTION (Customizable by barbershop owner) */}
        {shop.showProductsOnBookingPage !== false && products.length > 0 && (
          <section id="vitrine-produtos-cliente" className="mt-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-xs bg-white text-black">
                    <ShoppingBag className="h-3 w-3" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Cuidados & Barbearia
                  </span>
                </div>
                <h3 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Nossos Produtos
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Linha exclusiva disponível para aquisição durante seu atendimento na barbearia.
                </p>
              </div>

              {/* Category Filter Pills */}
              {Array.from(new Set(products.map((p) => p.category))).length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0">
                  <button
                    onClick={() => setSelectedProductCategory('all')}
                    className={`rounded-xs px-3 py-1 text-2xs font-bold uppercase transition-all ${
                      selectedProductCategory === 'all'
                        ? 'bg-white text-black shadow-xs'
                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  {Array.from(new Set(products.map((p) => p.category))).map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedProductCategory(cat)}
                        className={`rounded-xs px-3 py-1 text-2xs font-bold uppercase transition-all ${
                          selectedProductCategory === cat
                            ? 'bg-white text-black shadow-xs'
                            : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(selectedProductCategory === 'all'
                ? products
                : products.filter((p) => p.category === selectedProductCategory)
              ).map((prod) => {
                const inStock = prod.stockQuantity > 0;
                const lowStock = inStock && prod.stockQuantity <= (prod.minStockAlert ?? 4);

                return (
                  <div
                    key={prod.id}
                    id={`vitrine-card-prod-${prod.id}`}
                    onClick={() => setSelectedProductModal(prod)}
                    className="group relative flex flex-col justify-between rounded-sm border border-neutral-800 bg-neutral-900/90 text-white shadow-xl overflow-hidden cursor-pointer transition-all hover:border-neutral-600 hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Product Photo */}
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-950">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-neutral-950 text-neutral-600">
                            <Package className="h-10 w-10 opacity-30" />
                          </div>
                        )}

                        {/* Category Tag */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="rounded-xs bg-black/80 backdrop-blur-xs px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-neutral-200">
                            {prod.category}
                          </span>
                        </div>

                        {/* Stock Tag */}
                        <div className="absolute top-2.5 right-2.5">
                          {inStock ? (
                            lowStock ? (
                              <span className="rounded-xs bg-amber-500/90 backdrop-blur-xs px-2 py-0.5 text-3xs font-bold uppercase text-black">
                                Poucas unidades
                              </span>
                            ) : (
                              <span className="rounded-xs bg-emerald-500/90 backdrop-blur-xs px-2 py-0.5 text-3xs font-bold uppercase text-black">
                                Em estoque
                              </span>
                            )
                          ) : (
                            <span className="rounded-xs bg-rose-600/90 backdrop-blur-xs px-2 py-0.5 text-3xs font-bold uppercase text-white">
                              Esgotado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-white leading-snug group-hover:text-white transition-colors">
                            {prod.name}
                          </h4>
                        </div>

                        {prod.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-neutral-400 line-clamp-2">
                            {prod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Price & Action */}
                    <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950/60 px-4 py-3 text-xs">
                      <div>
                        <span className="text-3xs font-bold uppercase text-neutral-500 block">
                          Valor na barbearia
                        </span>
                        <span className="font-display font-black text-white text-base">
                          {formatCurrency(prod.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-bold text-neutral-300 group-hover:text-white transition-colors"
                      >
                        <span>Ver detalhes</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PRODUCT DETAILS MODAL */}
        {selectedProductModal && (
          <div
            id="modal-detalhes-produto"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg rounded-sm border border-neutral-800 bg-neutral-900 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Image */}
              <div className="relative aspect-16/9 w-full overflow-hidden bg-black">
                {selectedProductModal.imageUrl ? (
                  <img
                    src={selectedProductModal.imageUrl}
                    alt={selectedProductModal.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-950 text-neutral-600">
                    <Package className="h-16 w-16 opacity-30" />
                  </div>
                )}

                <button
                  onClick={() => setSelectedProductModal(null)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xs hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute bottom-3 left-3">
                  <span className="rounded-xs bg-black/80 backdrop-blur-xs px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white">
                    {selectedProductModal.category}
                  </span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
                      {selectedProductModal.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      {selectedProductModal.stockQuantity > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <Check className="h-3.5 w-3.5" /> Disponível para retirada na barbearia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                          <AlertCircle className="h-3.5 w-3.5" /> Temporariamente esgotado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-3xs font-bold uppercase text-neutral-400 block">Preço</span>
                    <span className="font-display font-black text-2xl text-white">
                      {formatCurrency(selectedProductModal.price)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-neutral-800 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Descrição & Modo de Uso
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-300">
                    {selectedProductModal.description ||
                      'Produto de linha profissional selecionado por nossa equipe de barbeiros para manter seu estilo e cuidados diários com a máxima qualidade.'}
                  </p>
                </div>

                {/* WhatsApp Reservation Button */}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end border-t border-neutral-800 pt-4">
                  <button
                    onClick={() => setSelectedProductModal(null)}
                    className="rounded-sm border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
                  >
                    Fechar
                  </button>

                  <a
                    href={`https://wa.me/55${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá! Gostaria de reservar o produto "${selectedProductModal.name}" (${formatCurrency(
                        selectedProductModal.price
                      )}) para retirar quando for na barbearia.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Reservar via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barbershop Info & Opening Hours Footer Card */}
        <div className="mt-12 rounded-sm border border-neutral-800 bg-neutral-900/60 p-6 text-white text-xs">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <h4 className="font-display font-bold uppercase text-sm tracking-wider text-neutral-300">
                Horários de Atendimento
              </h4>
              <ul className="mt-2.5 space-y-1.5 text-neutral-400">
                {shop.hours && shop.hours.length > 0 ? (
                  shop.hours.map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{h.day}:</span>
                      <span className="font-semibold text-neutral-200">{h.time}</span>
                    </li>
                  ))
                ) : (
                  <li>Segunda a Sábado: 09:00 - 19:00</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold uppercase text-sm tracking-wider text-neutral-300">
                Contato & Endereço
              </h4>
              <p className="mt-2.5 text-neutral-400">{shop.address}</p>
              <p className="mt-1 text-neutral-400">WhatsApp: {shop.whatsapp}</p>
              {shop.instagram && <p className="text-neutral-400">Instagram: {shop.instagram}</p>}
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold uppercase text-sm tracking-wider text-neutral-300">
                  Plataforma Navalha
                </h4>
                <p className="mt-2 text-neutral-400">
                  Sistema de agendamento online inteligente para barbearias.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 font-bold text-white underline underline-offset-2 hover:text-neutral-300"
                >
                  <span>Criar página para minha barbearia</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
