import React, { useState, useEffect } from 'react';
import { PanelShell } from '../../components/panel/PanelShell';
import {
  getCurrentUser,
  getShop,
  saveShop,
  slugify,
} from '../../lib/storage';
import { BarberShop, OpeningHour } from '../../types';
import {
  Store,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  Save,
} from 'lucide-react';

export const PainelLoja: React.FC = () => {
  const user = getCurrentUser();
  const initialSlug = user?.shopSlug || 'navalha';

  const [shop, setShop] = useState<BarberShop | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [showProductsOnBookingPage, setShowProductsOnBookingPage] = useState(true);
  const [hours, setHours] = useState<OpeningHour[]>([
    { day: 'Segunda a Sexta', time: '09:00 - 20:00' },
    { day: 'Sábado', time: '08:30 - 19:00' },
    { day: 'Domingo', time: 'Fechado' },
  ]);

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const s = getShop(initialSlug);
    if (s) {
      setShop(s);
      setName(s.name);
      setSlug(s.slug);
      setTagline(s.tagline || '');
      setPhone(s.phone || '');
      setWhatsapp(s.whatsapp || '');
      setEmail(s.email || '');
      setAddress(s.address || '');
      setInstagram(s.instagram || '');
      setShowProductsOnBookingPage(s.showProductsOnBookingPage !== false);
      if (s.hours && s.hours.length > 0) {
        setHours(s.hours);
      }
    }
  }, [initialSlug]);

  const publicUrl = `${window.location.origin}/b/${slug || initialSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleAddHour = () => {
    setHours([...hours, { day: 'Feriados', time: '10:00 - 15:00' }]);
  };

  const handleRemoveHour = (index: number) => {
    setHours(hours.filter((_, i) => i !== index));
  };

  const handleHourChange = (index: number, field: 'day' | 'time', value: string) => {
    const next = [...hours];
    next[index][field] = value;
    setHours(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome da barbearia é obrigatório.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      const cleanSlug = slugify(slug) || slugify(name);
      const updated: BarberShop = {
        id: shop?.id || `shop-${Date.now()}`,
        name: name.trim(),
        slug: cleanSlug,
        tagline: tagline.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        address: address.trim(),
        instagram: instagram.trim(),
        showProductsOnBookingPage,
        hours: hours.filter((h) => h.day.trim() || h.time.trim()),
        createdAt: shop?.createdAt || new Date().toISOString(),
      };

      saveShop(updated);
      setShop(updated);
      setSlug(cleanSlug);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell title="Minha loja">
      <div className="max-w-3xl space-y-6">
        {/* Public Link Callout Card */}
        <div className="rounded-sm border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Sua página pública de agendamentos
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-neutral-900 truncate">
                {publicUrl}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-black"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Copiar link</span>
                  </>
                )}
              </button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
              >
                <span>Abrir página</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Dados da barbearia atualizados com sucesso!</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="rounded-sm border border-neutral-200 bg-white p-6 shadow-2xs space-y-5">
          <h3 className="font-display text-base font-extrabold uppercase tracking-tight text-neutral-900 border-b border-neutral-100 pb-3">
            Informações Gerais
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">
                Nome da Barbearia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">
                Link Personalizado (Slug)
              </label>
              <div className="mt-1 flex items-center rounded border border-neutral-300 bg-neutral-50 px-2 text-xs text-neutral-500">
                <span>/b/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="w-full bg-transparent px-1 py-2 font-mono text-neutral-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700">
              Slogan / Descrição Curta
            </label>
            <input
              type="text"
              placeholder="Ex: Cortes clássicos e atendimento de excelência"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">
                WhatsApp de Atendimento
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">
                Instagram da Barbearia
              </label>
              <input
                type="text"
                placeholder="@suabarbearia"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">
                E-mail de Contato
              </label>
              <input
                type="email"
                placeholder="contato@barbearia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700">
                Telefone Fixo (opcional)
              </label>
              <input
                type="text"
                placeholder="(11) 3456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700">
              Endereço Completo
            </label>
            <input
              type="text"
              placeholder="Av. Paulista, 1578 - Bela Vista, São Paulo - SP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
            />
          </div>

          {/* Vitrine de Produtos Toggle */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between rounded-sm border border-neutral-200 bg-neutral-50/70 p-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-800">
                  Vitrine de Produtos na Página de Agendamento
                </label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Permitir que clientes vejam o catálogo de produtos e cosméticos no seu link público (/b/{slug || initialSlug}).
                </p>
              </div>
              <label
                htmlFor="toggle-produtos-loja"
                className="relative inline-flex cursor-pointer items-center shrink-0 ml-4"
              >
                <input
                  type="checkbox"
                  id="toggle-produtos-loja"
                  checked={showProductsOnBookingPage}
                  onChange={(e) => setShowProductsOnBookingPage(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-neutral-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden" />
              </label>
            </div>
          </div>

          {/* Opening Hours Schedule */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold uppercase text-neutral-700">
                Horários de Funcionamento Exibidos no Site
              </label>
              <button
                type="button"
                onClick={handleAddHour}
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-700 hover:text-black"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar dia
              </button>
            </div>

            <div className="space-y-2">
              {hours.map((hour, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Dia (ex: Segunda a Sexta)"
                    value={hour.day}
                    onChange={(e) => handleHourChange(idx, 'day', e.target.value)}
                    className="w-1/2 rounded border border-neutral-300 px-3 py-1.5 text-xs focus:border-black focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Horário (ex: 09:00 - 20:00)"
                    value={hour.time}
                    onChange={(e) => handleHourChange(idx, 'time', e.target.value)}
                    className="w-1/2 rounded border border-neutral-300 px-3 py-1.5 text-xs focus:border-black focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHour(idx)}
                    className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Remover horário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-black px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </PanelShell>
  );
};
