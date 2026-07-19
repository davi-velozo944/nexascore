# NexaScore — Plataforma Inteligente de Compliance e Gestão Empresarial

> SaaS completo de **gestão financeira, fiscal e de relacionamento** com IA, focado em compliance contábil/tributário para empresas brasileiras e internacionais.

[![Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Vite%205%20%2B%20TS-3b82f6)]()
[![Backend](https://img.shields.io/badge/backend-Supabase-3ecf8e)]()
[![Deploy](https://img.shields.io/badge/deploy-Vercel%20Ready-black)]()

---

## 📌 Visão Geral

**NexaScore** centraliza em uma única plataforma os pilares operacionais de uma empresa moderna: **Compliance**, **Gestão Financeira**, **CRM**, **RH** e **Conciliação Bancária**, tudo potencializado por **IA (Google Gemini)** para análise preditiva, categorização automática e geração de relatórios executivos.

O sistema é multi-idioma (PT-BR `R$`, EN-US `$`, EN-EU `€`), suporta **CPF e CNPJ** com validação matemática, e foi arquitetado para **independência total de plataforma** — o código exportado roda em Vercel/Netlify usando apenas as variáveis de ambiente configuradas.

---

## 🛡️ Módulos de Compliance

### 1. Identificação Fiscal (CPF/CNPJ)
- Campo único e inteligente que aceita **CPF** ou **CNPJ**.
- **Validação matemática** dos dígitos verificadores (`src/lib/taxId.ts`).
- Máscara automática conforme o tipo detectado.
- **Auto-preenchimento** de dados empresariais via **BrasilAPI** ao informar CNPJ.

### 2. Gestão de Contratos
- Cadastro de contratos vinculados a clientes com vigência, valor e status.
- **Alertas automáticos** de vencimento gerados por trigger (`generate_contract_alerts`).
- Histórico imutável e rastreabilidade por usuário (RLS).

### 3. Conciliação Bancária
- Upload de extratos **OFX/CSV** (Open Finance ready — Pluggy/Belvo).
- **Categorização automática** das transações via IA (Gemini).
- Confirmação manual antes da gravação definitiva.
- Importações limitadas por plano para controle de uso.

### 4. Auditoria e Segurança
- **Row-Level Security (RLS)** ativo em todas as tabelas: `auth.uid() = user_id`.
- Roles em tabela separada (`user_roles`) — anti-escalada de privilégios.
- Secrets isolados em Edge Functions (Stripe, Resend, Gemini).
- Autenticação por e-mail/senha + Google OAuth com confirmação de e-mail.

### 5. Relatórios Inteligentes
- Geração de relatórios financeiros e fiscais via Edge Function `generate-report`.
- Análise consultiva da saúde financeira via `analyze-financial` (IA).
- Exportação em formatos compatíveis com prestação de contas.

---

## 📊 Módulos de Gestão

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs em tempo real: receita, despesa, lucro, saldo e indicadores de IA. |
| **Clientes** | CRUD completo com CPF/CNPJ, histórico e segmentação. |
| **Contratos** | Vigência, valor, alertas e vinculação ao cliente. |
| **Financeiro** | Lançamentos de receita/despesa, categorias e cálculo automático de fluxo de caixa. |
| **CRM (Kanban)** | Pipeline visual drag-and-drop (`@dnd-kit`) com persistência de status. |
| **Cargos & Funcionários** | Estrutura organizacional e folha de pagamento básica. |
| **Conciliação** | Importação e categorização IA de extratos bancários. |
| **Relatórios IA** | Análises geradas pelo Gemini sob demanda. |
| **Suporte** | Sistema de tickets em tempo real estilo WhatsApp. |
| **Planos** | Gestão de assinatura via Stripe (Checkout + Portal). |
| **Configurações** | Perfil, idioma, moeda e dados fiscais. |

---

## 🧱 Stack Técnica

- **Frontend:** React 18 · Vite 5 · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions Deno)
- **IA:** Google Gemini (`gemini-2.5-flash` / `gemini-2.5-pro`)
- **Pagamentos:** Stripe (Checkout, Customer Portal, Webhooks)
- **E-mail:** Resend
- **Drag & Drop:** @dnd-kit
- **APIs externas:** BrasilAPI (consulta CNPJ)

---

## ⚙️ Variáveis de Ambiente

### Frontend (`.env` — Vercel/Netlify)
```env
VITE_SUPABASE_URL="https://SEU_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key"
VITE_SUPABASE_PROJECT_ID="SEU_REF"
```

### Backend (Secrets — Supabase Dashboard → Edge Functions)
```
GEMINI_API_KEY            # Google AI Studio
RESEND_API_KEY            # Resend.com
STRIPE_SECRET_KEY         # Stripe
STRIPE_WEBHOOK_SECRET     # Stripe Webhooks
```
> `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente nas Edge Functions.

Veja `.env.example` para o template completo.

---

## 🚀 Instalação e Execução

```bash
# 1. Clone
git clone https://github.com/SEU_USUARIO/nexascore.git
cd nexascore

# 2. Instale dependências
npm install

# 3. Configure o .env (copie do exemplo)
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 4. Rode em desenvolvimento
npm run dev

# 5. Build de produção
npm run build
npx vite preview
```

---

## ☁️ Deploy

### Vercel (Recomendado)
| Configuração | Valor |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **Settings → Environment Variables**.

### Edge Functions (Supabase CLI)
```bash
npm i -g supabase
supabase login
supabase link --project-ref SEU_REF
supabase functions deploy
```

---

## 💰 Planos e Limites

| Recurso | Grátis | Inicial (R$97) | Profissional (R$197) | Premium (R$397) |
|---|---|---|---|---|
| Clientes | 5 | 50 | 200 | ∞ |
| Contratos | 3 | 10 | 50 | ∞ |
| Funcionários | 5 | 20 | 100 | ∞ |
| Importações/mês | 1 | 10 | 50 | ∞ |
| IA | Básica | Básica | Avançada | Completa |

---

## 📁 Estrutura do Projeto

```
nexascore/
├── src/
│   ├── components/      # UI (shadcn) e componentes de domínio
│   ├── contexts/        # AuthContext, LocaleContext
│   ├── hooks/           # Hooks customizados (useCnpjLookup, etc.)
│   ├── integrations/    # Cliente Supabase (auto-gerado)
│   ├── lib/             # Utilitários (taxId, utils)
│   ├── pages/           # Rotas públicas e dashboard
│   └── index.css        # Design system (HSL tokens)
├── supabase/
│   ├── functions/       # Edge Functions (Deno)
│   └── migrations/      # SQL versionado
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔒 Segurança

- RLS obrigatório em todas as tabelas com dados de usuário.
- Validação server-side via Edge Functions para operações críticas.
- Secrets nunca expostos ao cliente — apenas variáveis `VITE_*` públicas.
- Senhas validadas contra **HIBP** (Have I Been Pwned) — habilitar no painel.
- OAuth Google com escopos mínimos.

---

## 📄 Licença

Projeto privado — Todos os direitos reservados © NexaScore.
