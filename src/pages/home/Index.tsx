import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '../../components/site/SiteLayout';
import { APP_CONFIG, formatCurrency, getServices, getBarbers } from '../../lib/storage';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  Smartphone,
  Users,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronDown,
  Scissors,
  Star,
  Flame,
  Check,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const demoServices = getServices('navalha').slice(0, 4);
  const demoBarbers = getBarbers('navalha').slice(0, 3);

  const features = [
    {
      icon: Clock,
      title: 'Agendamento Online 24h',
      description:
        'Seus clientes agendam o próprio horário pelo celular a qualquer hora, mesmo quando você estiver cortando cabelo ou dormindo.',
    },
    {
      icon: Smartphone,
      title: 'Link exclusivo para Instagram',
      description:
        'Tenha sua página pública personalizada (ex: navalha.com/b/suabarbearia) pronta para colocar no link da bio e enviar no WhatsApp.',
    },
    {
      icon: Users,
      title: 'Gestão Completa de Barbeiros',
      description:
        'Cadastre múltiplos profissionais da sua equipe com fotos, horários de atendimento e especialidades específicas.',
    },
    {
      icon: Zap,
      title: 'Bloqueio Inteligente de Horários',
      description:
        'O sistema bloqueia automaticamente os horários ocupados, eliminando conflitos de agenda, furos e tempo ocioso na cadeira.',
    },
    {
      icon: Calendar,
      title: 'Painel em Tempo Real',
      description:
        'Visualize toda a agenda do dia num piscar de olhos, com filtros rápidos de pendentes, confirmados e concluídos.',
    },
    {
      icon: ShieldCheck,
      title: 'Sem taxas por agendamento',
      description:
        'Cobramos apenas uma mensalidade fixa e transparente. Zero comissão sobre o valor dos seus cortes e barba.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Crie sua conta em 1 minuto',
      description: 'Informe o nome da sua barbearia, endereço e personalize seu link público de forma imediata.',
    },
    {
      number: '02',
      title: 'Cadastre serviços e barbeiros',
      description: 'Adicione corte, barba, combos, valores, durações e os profissionais da sua equipe.',
    },
    {
      number: '03',
      title: 'Compartilhe o link com clientes',
      description: 'Coloque no perfil do Instagram, envie no WhatsApp e deixe os agendamentos entrarem sozinhos.',
    },
  ];

  const faqs = [
    {
      q: 'Preciso instalar algum aplicativo no computador ou celular?',
      a: `Não! O ${APP_CONFIG.name} é 100% web e funciona diretamente no navegador de qualquer celular, tablet ou computador. Tanto você quanto seus clientes não precisam baixar nada da App Store ou Play Store.`,
    },
    {
      q: 'Os meus clientes precisam criar login para agendar?',
      a: 'Não. O processo para o cliente é super ágil: ele escolhe o serviço, o barbeiro, a data, o horário disponível e só coloca o nome e WhatsApp. Isso aumenta em até 3x a conversão de agendamentos.',
    },
    {
      q: 'Como recebo os pagamentos dos serviços?',
      a: 'Os clientes realizam o pagamento diretamente na sua barbearia após o atendimento (via Pix, cartão ou dinheiro). Você não paga nenhuma porcentagem para a plataforma.',
    },
    {
      q: 'Quantos barbeiros e serviços posso cadastrar?',
      a: 'No plano Pro você tem agendamentos ilimitados, barbeiros ilimitados e catálogo de serviços ilimitado. Sua barbearia pode crescer sem custos extras.',
    },
  ];

  const planFeatures = [
    'Agendamentos online ilimitados',
    'Página pública personalizada com seu link',
    'Cadastro ilimitado de serviços e combos',
    'Cadastro ilimitado de profissionais/barbeiros',
    'Painel de controle com status em tempo real',
    'Bloqueio automático de horários conflitantes',
    'Integração facilitada para WhatsApp',
    'Suporte prioritário por e-mail e WhatsApp',
  ];

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-black text-white">
        {/* Background Image with Dark Contrast Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28 md:py-36">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
            <span>{APP_CONFIG.tagline}</span>
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
            O sistema que dá <span className="text-neutral-400">ritmo</span> à sua barbearia.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-xl">
            A plataforma inteligente de agendamento online para barbearias. Tenha sua própria página de agendamentos 24h, controle total da equipe e agenda cheia sem WhatsApp travado.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2.5 rounded-sm bg-white px-6 py-3.5 text-base font-bold text-black shadow-lg transition-all hover:bg-neutral-200"
            >
              <span>Começar agora</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-10">
            <div>
              <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">24/7</div>
              <div className="mt-0.5 text-xs text-neutral-400">Agendamentos automáticos</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">0%</div>
              <div className="mt-0.5 text-xs text-neutral-400">Comissão por cliente</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">1 min</div>
              <div className="mt-0.5 text-xs text-neutral-400">Tempo médio de agendamento</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">100%</div>
              <div className="mt-0.5 text-xs text-neutral-400">Responsivo em celulares</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Barbershop Demo Teaser */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Experiência do Cliente
              </span>
              <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-4xl">
                Como seu cliente agenda em segundos
              </h2>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="mt-10 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xl">
            <div className="border-b border-neutral-200 bg-neutral-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-white text-black font-bold font-display">
                  BN
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-tight text-sm text-white">
                    Barbearia Navalha — Página de Agendamento
                  </h3>
                  <p className="text-xs text-neutral-400">navalha.com/b/navalha</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Agendamento aberto agora
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Services list sample */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    1. Escolha o serviço desejado
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {demoServices.map((srv) => (
                      <div
                        key={srv.id}
                        className="group flex flex-col justify-between rounded border border-neutral-200 p-4 transition-all hover:border-black hover:shadow-xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-neutral-900 text-sm">{srv.name}</h5>
                            <span className="font-display font-extrabold text-neutral-900 text-sm whitespace-nowrap">
                              {formatCurrency(srv.price)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                            {srv.description}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {srv.durationMinutes} min
                          </span>
                          <span className="font-bold text-neutral-700 group-hover:text-black">
                            Selecionar →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barbers sample & Action */}
                <div className="space-y-4 rounded bg-neutral-50 p-5 border border-neutral-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    2. Escolha o profissional
                  </h4>
                  <div className="space-y-2.5">
                    {demoBarbers.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 rounded bg-white p-2.5 border border-neutral-200"
                      >
                        <img
                          src={b.avatar}
                          alt={b.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-neutral-900 truncate">{b.name}</p>
                          <p className="text-[11px] text-neutral-500 truncate">{b.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Recursos
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-5xl">
              Tudo o que sua barbearia precisa para faturar mais
            </h2>
            <p className="mt-4 text-base text-neutral-600 sm:text-lg">
              Deixe a parte burocrática e as mensagens repetitivas para o sistema. Foque no que você faz de melhor: entregar cortes impecáveis.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded bg-black text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-tight text-neutral-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="como-funciona" className="border-t border-neutral-200 bg-neutral-900 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Passo a Passo
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
              Como funciona na prática
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-400 text-sm sm:text-base">
              Em menos de 3 minutos sua barbearia já estará recebendo agendamentos online de forma automática.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded border border-white/10 bg-white/5 p-6 backdrop-blur-xs"
              >
                <div className="font-display text-4xl font-black text-neutral-600">
                  {step.number}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-bold text-black shadow-md transition-colors hover:bg-neutral-200"
            >
              <span>Criar minha barbearia agora</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="py-20 sm:py-28 bg-neutral-50 border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Preço Simples
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-5xl">
              Um plano único. Tudo incluído.
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              Sem pegadinhas, sem taxas por agendamento e sem limite de profissionais.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-lg rounded-md border border-neutral-300 bg-white p-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {APP_CONFIG.plan.name}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-neutral-900">
                    {APP_CONFIG.plan.priceLabel}
                  </span>
                  <span className="text-sm text-neutral-500">{APP_CONFIG.plan.period}</span>
                </div>
              </div>
              <span className="rounded bg-black px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Completo
              </span>
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Acesso total para você e todos os barbeiros da sua equipe.
            </p>

            <div className="mt-6 border-t border-neutral-100 pt-6">
              <ul className="space-y-3">
                {planFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                to="/auth"
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-black py-3.5 text-center text-sm font-bold text-white shadow-md transition-colors hover:bg-neutral-800"
              >
                <span>Começar agora</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-center text-[11px] text-neutral-400">
                Cancele a qualquer momento sem burocracia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Dúvidas
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-4xl">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="mt-12 divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="py-5">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="font-bold text-neutral-900 text-base sm:text-lg">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-neutral-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final Banner */}
      <section className="bg-neutral-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Pronto para profissionalizar sua barbearia?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-400 text-sm sm:text-base">
            Crie sua conta em menos de 2 minutos e comece a receber agendamentos hoje mesmo.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-sm bg-white px-7 py-3.5 text-base font-bold text-black shadow-lg transition-colors hover:bg-neutral-200"
            >
              <span>Cadastrar minha barbearia</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};
