# 💈 IBarbear — Sistema de Gestão & Agendamento Inteligente para Barbearias

<p align="center">
  <img src="./public/logo.svg" alt="IBarbear Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>Plataforma completa de agendamento online 24h, catálogo de produtos com controle de estoque, gestão de barbeiros e cobrança automatizada para barbearias modernas.</strong>
</p>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [1. Página Pública de Agendamento](#1-página-pública-de-agendamento-bslug)
  - [2. Catálogo & Gestão de Produtos](#2-catálogo--gestão-de-produtos-com-estoque)
  - [3. Painel Administrativo da Barbearia](#3-painel-administrativo-da-barbearia-painel)
  - [4. Assinaturas & Cobrança](#4-motor-de-assinaturas--pagamentos-pix--cartão)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar Localmente](#-como-executar-localmente)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação e Execução](#passo-a-passo)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Configuração de Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Identidade Visual & Assets](#-identidade-visual)
- [Licença](#-licença)

---

## 🌟 Visão Geral

O **IBarbear** é uma solução completa no modelo SaaS desenvolvida sob medida para donos de barbearias, barbeiros autônomos e seus clientes. O sistema elimina a perda de tempo respondendo mensagens manuais, permitindo que os clientes escolham serviços, profissionais e horários disponíveis em tempo real, além de explorar os produtos vendidos na barbearia.

Para o gestor, o sistema oferece um painel simples e poderoso para controle de agenda, equipe, faturamento, catálogo de produtos com controle de estoque e alertas de reposição.

---

## ✨ Funcionalidades Principais

### 1. Página Pública de Agendamento (`/b/:slug`)
- **Página personalizada** com a identidade da barbearia, banner, logotipo, endereço e horários de funcionamento.
- **Fluxo de agendamento em 4 etapas simples**:
  1. Escolha do serviço (Corte, Barba, Pigmentação, etc.) com preço e duração.
  2. Escolha do barbeiro de preferência.
  3. Seleção de dia e horário livre na grade de horários.
  4. Confirmação instantânea com dados do cliente e redirecionamento para o WhatsApp da barbearia.
- **Vitrine de Produtos Integrada**: clientes podem visualizar produtos oferecidos pela barbearia e solicitar reserva antes do atendimento.

### 2. Catálogo & Gestão de Produtos com Estoque
- **Cadastro Completo**: nome, descrição, categoria (*Pomadas & Ceras, Barba & Bigode, Cuidados, Acessórios*), preço em centavos e imagem.
- **Controle de Estoque Ativo**: monitoramento da quantidade disponível e alerta configurável de estoque mínimo.
- **Visibilidade Personalizada**:
  - O dono da barbearia pode ativar ou desativar a exibição da vitrine pública de produtos na página de agendamento (`showProductsOnBookingPage`).
  - Cada produto individual pode ser ativado/desativado do catálogo público (`showInCatalog`).
- **Reserva Direta via WhatsApp**: clientes podem selecionar produtos e disparar uma mensagem formatada com o pedido diretamente ao estabelecimento.

### 3. Painel Administrativo da Barbearia (`/painel`)
- **Dashboard Geral (`/painel`)**: métricas do dia, faturamento previsto, agendamentos confirmados e lista de próximos atendimentos.
- **Gestão de Serviços (`/painel/servicos`)**: criação, edição de preços, tempos de atendimento e status ativo/inativo.
- **Gestão de Equipe (`/painel/equipe`)**: cadastro dos barbeiros, fotos de perfil, especialidades e jornadas de trabalho.
- **Gestão de Produtos (`/painel/produtos`)**: controle completo de estoque, preços, reposição e catálogo.
- **Configurações da Loja (`/painel/loja`)**: slug público, endereço no Google Maps, telefone, WhatsApp e redes sociais.

### 4. Motor de Assinaturas & Pagamentos (PIX & Cartão)
- Planos de assinatura **Mensal (R$ 89/mês)** e **Anual** com desconto promocional.
- **PIX Instantâneo**: geração de QR Code dinâmico, código copia-e-cola e verificação em tempo real via polling e webhooks.
- **Cartão de Crédito**: suporte a parcelamento e confirmação rápida.
- **Regras de Bloqueio por Inadimplência**: aviso com contagem regressiva para renovação e bloqueio automático do painel em caso de expiração da assinatura, com tela de regularização imediata.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19** & **TypeScript**
- **Vite 6** (Build tool e HMR otimizado)
- **Tailwind CSS v4** (Design moderno, paleta dark luxury e utilitários modernos)
- **React Router DOM v7** (Roteamento declarativo do cliente)
- **Lucide React** (Ícones modernos e consistentes)
- **Motion** (Transições e animações fluidas)
- **QRCode** (Geração de QR Codes dinâmicos para pagamentos via PIX)
- **Canvas-Confetti** (Feedback visual em agendamentos e pagamentos aprovados)

### Backend & Integrações
- **Node.js** + **Express** (Servidor HTTP e endpoints de API)
- **TSX** (Execução direta de TypeScript em desenvolvimento)
- **esbuild** (Compilação e empacotamento ultrarrápido para produção)
- **Firebase / Firestore** (Persistência em nuvem com fallback para armazenamento local)

---

## 📁 Estrutura do Projeto

```text
├── public/                     # Arquivos estáticos públicos
│   ├── favicon.svg             # Favicon oficial do IBarbear
│   ├── logo.svg                # Logotipo vetorial oficial
│   └── mock/                   # Imagens e referências
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── RazorLogoIcon.tsx # Componente vetorial da navalha estilizada
│   │   ├── panel/
│   │   │   └── PanelShell.tsx    # Layout base do painel do barbeiro
│   │   └── site/
│   │       ├── Logo.tsx          # Componente principal do logotipo IBarbear
│   │       └── SiteLayout.tsx    # Layout público da landing page
│   ├── lib/
│   │   ├── firebase.ts           # Inicialização e cliente do Firebase Firestore
│   │   └── storage.ts            # Camada de serviços, banco de dados e regras de negócio
│   ├── pages/
│   │   ├── auth/                 # Autenticação (Login e Cadastro)
│   │   ├── home/                 # Landing page institucional do IBarbear
│   │   ├── not-found/            # Página de erro 404 personalizada
│   │   ├── pagamento/            # Checkout e tela de pagamento PIX/Cartão
│   │   ├── painel/               # Módulos do painel administrativo
│   │   │   ├── Assinatura.tsx    # Gestão do plano e pagamentos
│   │   │   ├── Equipe.tsx        # Cadastro de barbeiros
│   │   │   ├── Index.tsx         # Dashboard com agenda do dia
│   │   │   ├── Loja.tsx          # Dados da barbearia e personalização
│   │   │   ├── Produtos.tsx      # Controle de estoque e catálogo
│   │   │   └── Servicos.tsx      # Cadastro de serviços e preços
│   │   ├── precos/               # Tabela de planos e benefícios
│   │   └── shop/                 # Página pública de agendamento (/b/:slug)
│   ├── types.ts                  # Definições de tipos TypeScript do sistema
│   ├── App.tsx                   # Configuração de rotas da aplicação
│   ├── index.css                 # Importação do Tailwind CSS e fontes globais
│   └── main.tsx                  # Ponto de entrada do React
├── server.ts                     # Servidor Express, rotas da API e integração Vite
├── index.html                    # Entrada HTML, fontes e meta tags
├── metadata.json                 # Metadados da aplicação no AI Studio
├── package.json                  # Dependências e scripts do projeto
├── tsconfig.json                 # Configuração do TypeScript
└── vite.config.ts                # Configurações do Vite
```

---

## 🛠 Como Executar Localmente

### Pré-requisitos
- **Node.js** (versão 20 ou superior recomendada)
- **npm** ou gerenciador de pacotes equivalente

### Passo a Passo

1. **Clone o repositório ou acesse o diretório do projeto**:
   ```bash
   cd ibarbear
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   - Aplicação: [http://localhost:3000](http://localhost:3000)
   - Landing Page: [http://localhost:3000/](http://localhost:3000/)
   - Demonstração da Barbearia: [http://localhost:3000/b/navalha-de-ouro](http://localhost:3000/b/navalha-de-ouro)
   - Painel Administrativo: [http://localhost:3000/painel](http://localhost:3000/painel)

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Node.js/Express integrado ao Vite em modo de desenvolvimento na porta `3000`. |
| `npm run build` | Compila os ativos estáticos do frontend com Vite e empacota o `server.ts` com esbuild para a pasta `dist/`. |
| `npm run start` | Inicia a aplicação compilada em modo de produção (`node dist/server.cjs`). |
| `npm run lint` | Executa o compilador TypeScript (`tsc --noEmit`) para validação estática de tipos. |
| `npm run clean` | Remove as pastas de build e arquivos compilados temporários. |

---

## 🔐 Variáveis de Ambiente

Para rodar com integrações adicionais, consulte o arquivo `.env.example` na raiz do projeto:

```bash
# GEMINI_API_KEY: Chave opcional para recursos inteligentes
GEMINI_API_KEY="SUA_CHAVE_AQUI"

# APP_URL: URL base pública da aplicação
APP_URL="http://localhost:3000"
```

---

## 🎨 Identidade Visual

O **IBarbear** adota uma estética premium *Dark Luxury*, com tipografia imponente e o emblema distintivo da **navalha clássica integrada ao anel líquido**:

- **Fontes**: *Syne* (para títulos expressivos e marcantes) e *Plus Jakarta Sans* (para leitura limpa e moderna).
- **Cores principais**: Preto profundo (`#000000`, `#0a0a0a`), cinzas nobres (`#171717`, `#262626`) e detalhes em branco níquel com toques sutis de esmeralda para confirmações financeiras e WhatsApp.
- **Logotipo e Favicon**: Implementados em formato vetorial SVG (`/public/logo.svg` e `/public/favicon.svg`) e componente React reutilizável (`RazorLogoIcon`).

---

## 📄 Licença

Este projeto está disponível sob a licença [MIT](./LICENSE).
