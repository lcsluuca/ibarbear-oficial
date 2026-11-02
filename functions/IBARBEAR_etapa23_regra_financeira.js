'use strict';

/**
 * IBARBEAR - Etapa 23 (somente testes locais)
 *
 * Recebe SOMENTE dados normalizados por codigo de servidor apos consulta
 * autenticada a API do provedor. NUNCA receber diretamente do navegador,
 * URL de retorno ou do corpo nao verificado de um webhook.
 *
 * Funcao pura: SEM acesso a rede, arquivos, Mercado Pago ou Firebase.
 * NUNCA ativa assinaturas ou concede permissoes.
 *
 * Uma decisao positiva indica apenas que os dados SIMULADOS estao
 * logicamente coerentes. Antes de qualquer ativacao real, serao exigidos:
 * - consulta real ao provedor e autenticacao da origem dos dados;
 * - registro transacional unico de cada pagamento no Firestore;
 * - vinculo imutavel com a operacao/UID/barbearia;
 * - tratamento de estornos, cancelamentos, renovacoes e expiracao;
 * - atualizacao exclusivamente via backend com credenciais adequadas.
 */

const PLANOS = Object.freeze({
  monthly: Object.freeze({
    id: '24bc1335e61c4b72a6eda700f3742d64',
    priceCents: 8900,
    currency: 'BRL'
  }),
  yearly: Object.freeze({
    id: 'ca210c6ad3cf446b91d21a9266c86d08',
    priceCents: 89000,
    currency: 'BRL'
  })
});

function valido(v, max = 200) {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function dataIso(v) {
  if (!valido(v, 40) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v)) {
    return NaN;
  }
  return Date.parse(v);
}

/**
 * Entradas em formato NORMALIZADO, nao o JSON original do Mercado Pago.
 * As nomenclaturas/relacionamentos reais devem ser confirmados num adapter
 * separado antes de acoplar ao provedor.
 */
function avaliarEvidenciaFinanceira({ operacao, assinatura, pagamento, periodo, agora } = {}) {
  const negar = (motivo) => ({
    reviewOnly: true,
    evidenceConsistent: false,
    activationAuthorized: false,
    reason: motivo
  });

  if (!operacao || !assinatura || !pagamento || !periodo) {
    return negar('evidencia_incompleta');
  }

  const plano = PLANOS[operacao.plan];
  if (!plano) return negar('plano_desconhecido');

  if (
    !valido(operacao.ownerUid, 128) ||
    !valido(operacao.shopSlug, 121) ||
    !/^[0-9a-f]{32}$/.test(operacao.intentId ?? '') ||
    !/^[0-9a-f]{32}$/.test(operacao.operationId ?? '') ||
    operacao.externalReference !== 'ibar-' + operacao.intentId ||
    operacao.providerPlanId !== plano.id ||
    operacao.priceCents !== plano.priceCents ||
    operacao.currency !== 'BRL'
  ) return negar('operacao_inconsistente');

  // No ciclo real, essa transicao so pode ser produzida no servidor apos
  // registrar o resultado da criacao da assinatura com garantia de durabilidade.
  if (
    operacao.state !== 'provider_subscription_linked' ||
    operacao.providerRequestSent !== true ||
    !valido(operacao.providerSubscriptionId, 128) ||
    operacao.financiallyApproved !== false ||
    operacao.subscriptionActivated !== false
  ) return negar('operacao_ainda_nao_vinculada');

  if (
    assinatura.id !== operacao.providerSubscriptionId ||
    assinatura.externalReference !== operacao.externalReference ||
    assinatura.planId !== plano.id ||
    assinatura.status !== 'authorized'
  ) return negar('assinatura_nao_corresponde');

  // Uma assinatura autorizada nao equivale a uma cobranca aprovada.
  if (
    !valido(pagamento.id, 128) ||
    pagamento.subscriptionId !== assinatura.id ||
    pagamento.status !== 'approved' ||
    pagamento.amountCents !== plano.priceCents ||
    pagamento.currency !== 'BRL'
  ) return negar('pagamento_nao_confirmado');

  const inicio = dataIso(periodo.inicioUtc);
  const fim = dataIso(periodo.fimUtc);
  const aprovado = dataIso(pagamento.approvedAtUtc);
  const agoraMs = dataIso(agora);

  if (
    !Number.isFinite(inicio) || !Number.isFinite(fim) ||
    !Number.isFinite(aprovado) || !Number.isFinite(agoraMs) ||
    inicio >= fim || agoraMs < inicio || agoraMs >= fim ||
    aprovado < inicio || aprovado > agoraMs
  ) return negar('periodo_ou_data_invalida');

  // Coerencia *simulada* satisfatoria. Continua PROIBIDO liberar acesso.
  // Nao temos aqui comprovacao da origem da API nem ledger de pagamento unico.
  return {
    reviewOnly: true,
    evidenceConsistent: true,
    activationAuthorized: false,
    reason: 'exige_verificacao_real_e_registro_transacional',
    nextRequirements: [
      'consultar_assinatura_e_pagamento_na_api',
      'registrar_pagamento_unico_no_firestore',
      'atualizar_acesso_somente_pelo_backend'
    ]
  };
}

module.exports = { avaliarEvidenciaFinanceira };
