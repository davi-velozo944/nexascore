import React, { createContext, useContext, useState, useCallback } from "react";

export type LocaleKey = "pt-BR" | "en-US" | "en-EU";

interface LocaleConfig {
  key: LocaleKey;
  label: string;
  flag: string;
  currency: string;
  currencyCode: string;
  locale: string;
}

export const LOCALES: Record<LocaleKey, LocaleConfig> = {
  "pt-BR": { key: "pt-BR", label: "Brasil", flag: "🇧🇷", currency: "R$", currencyCode: "BRL", locale: "pt-BR" },
  "en-US": { key: "en-US", label: "USA", flag: "🇺🇸", currency: "$", currencyCode: "USD", locale: "en-US" },
  "en-EU": { key: "en-EU", label: "Europe", flag: "🇪🇺", currency: "€", currencyCode: "EUR", locale: "de-DE" },
};

// Translation dictionary
const translations: Record<LocaleKey, Record<string, string>> = {
  "pt-BR": {
    dashboard: "Dashboard",
    clients: "Clientes",
    contracts: "Contratos",
    positions: "Cargos",
    employees: "Funcionários",
    financial: "Financeiro",
    crm: "CRM",
    conciliation: "Conciliação",
    reports_ai: "Relatórios IA",
    support: "Atendimento",
    settings: "Configurações",
    plans: "Planos",
    welcome_back: "Bem-vindo de volta! Aqui está um resumo da sua empresa.",
    view_clients: "Ver Clientes",
    new_client: "+ Novo Cliente",
    active_revenue: "Receita (Contratos Ativos)",
    active: "ativos",
    pending_contracts: "Contratos Pendentes",
    of_total: "total",
    active_contracts: "Contratos Ativos",
    expired: "expirados",
    recent_activity: "Atividade Recente",
    no_activity: "Nenhuma atividade ainda. Cadastre clientes e contratos para começar.",
    contracts_per_month: "Contratos por Mês",
    last_7_months: "Últimos 7 meses",
    distribution: "Distribuição",
    total_contracts: "Total de contratos",
    revenue_per_month: "Receita por Mês",
    active_revenue_label: "Receita Ativa",
    pending: "Pendente",
    total_all: "Valor Total (Todos)",
    avg_ticket: "Ticket Médio",
    per_contract: "por contrato",
    recent_contracts: "Contratos Recentes",
    no_contracts: "Nenhum contrato cadastrado ainda.",
    status_distribution: "Distribuição por Status",
    active_label: "Ativos",
    pending_label: "Pendentes",
    cancelled: "Cancelados",
    expired_label: "Expirados",
    register_contracts: "Cadastre contratos para ver o gráfico de receita",
    no_data: "Sem dados",
    current_plan: "Plano atual",
    search: "Buscar...",
    logout_success: "Logout realizado com sucesso",
    plans_pricing: "Planos e Preços",
    plans_subtitle: "Escolha o plano ideal para o seu negócio. Todos incluem atualizações gratuitas.",
    your_plan: "Seu plano atual",
    renewal_in: "Renovação em",
    days: "dias",
    manage_subscription: "Gerenciar Assinatura",
    login_to_subscribe: "Faça login para assinar",
    create_account: "Crie uma conta para escolher seu plano",
    popular: "Popular",
    current: "Atual",
    choose_plan: "Escolher Plano",
    current_plan_btn: "Plano Atual",
    contact_us: "Fale Conosco",
    contact_custom: "Entre em contato para planos personalizados",
    must_login: "Você precisa estar logado para assinar",
    checkout_error: "Erro ao iniciar checkout",
    subscription_success: "Assinatura realizada com sucesso!",
    checkout_cancelled: "Checkout cancelado",
    portal_error: "Erro ao abrir portal",
    must_login_short: "Você precisa estar logado",
    faq: "Perguntas Frequentes",
    faq_change_plan: "Posso trocar de plano a qualquer momento?",
    faq_change_plan_answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. O valor será calculado proporcionalmente.",
    faq_payment: "Qual forma de pagamento aceita?",
    faq_payment_answer: "Aceitamos cartão de crédito, PIX e boleto bancário. O PIX oferece 5% de desconto.",
    faq_trial: "Existe período de teste?",
    faq_trial_answer: "Sim! Todos os planos possuem 14 dias de teste grátis, sem necessidade de cartão de crédito.",
    faq_support: "Como funciona o suporte?",
    faq_support_answer: "Oferecemos suporte via email, chat e telefone dependendo do plano. Planos Premium têm suporte 24/7.",
    revenue: "Receita",
    value: "Valor",
    client_registered: "Cliente cadastrado",
    contract_label: "Contrato",
    now: "agora",
    min_ago: "min atrás",
    hours_ago: "h atrás",
    days_ago: "d atrás",
    months_ago: "meses atrás",
    active_contracts_count: "contratos ativos",
    pending_contracts_count: "contratos pendentes",
    total_contracts_count: "contratos no total",
    follow_revenue: "Acompanhe receitas e contratos",
    // Plan descriptions
    plan_inicial_desc: "Para pequenas empresas começando",
    plan_profissional_desc: "Para empresas em crescimento",
    plan_premium_desc: "Para grandes operações",
    plan_custom_desc: "Soluções sob medida",
  },
  "en-US": {
    dashboard: "Dashboard",
    clients: "Clients",
    contracts: "Contracts",
    positions: "Positions",
    employees: "Employees",
    financial: "Financial",
    crm: "CRM",
    conciliation: "Reconciliation",
    reports_ai: "AI Reports",
    support: "Support",
    settings: "Settings",
    plans: "Plans",
    welcome_back: "Welcome back! Here's a summary of your business.",
    view_clients: "View Clients",
    new_client: "+ New Client",
    active_revenue: "Revenue (Active Contracts)",
    active: "active",
    pending_contracts: "Pending Contracts",
    of_total: "total",
    active_contracts: "Active Contracts",
    expired: "expired",
    recent_activity: "Recent Activity",
    no_activity: "No activity yet. Register clients and contracts to get started.",
    contracts_per_month: "Contracts per Month",
    last_7_months: "Last 7 months",
    distribution: "Distribution",
    total_contracts: "Total contracts",
    revenue_per_month: "Revenue per Month",
    active_revenue_label: "Active Revenue",
    pending: "Pending",
    total_all: "Total Value (All)",
    avg_ticket: "Average Ticket",
    per_contract: "per contract",
    recent_contracts: "Recent Contracts",
    no_contracts: "No contracts registered yet.",
    status_distribution: "Status Distribution",
    active_label: "Active",
    pending_label: "Pending",
    cancelled: "Cancelled",
    expired_label: "Expired",
    register_contracts: "Register contracts to see revenue chart",
    no_data: "No data",
    current_plan: "Current plan",
    search: "Search...",
    logout_success: "Logged out successfully",
    plans_pricing: "Plans & Pricing",
    plans_subtitle: "Choose the ideal plan for your business. All include free updates.",
    your_plan: "Your current plan",
    renewal_in: "Renewal in",
    days: "days",
    manage_subscription: "Manage Subscription",
    login_to_subscribe: "Login to subscribe",
    create_account: "Create an account to choose your plan",
    popular: "Popular",
    current: "Current",
    choose_plan: "Choose Plan",
    current_plan_btn: "Current Plan",
    contact_us: "Contact Us",
    contact_custom: "Contact us for custom plans",
    must_login: "You need to be logged in to subscribe",
    checkout_error: "Error starting checkout",
    subscription_success: "Subscription completed successfully!",
    checkout_cancelled: "Checkout cancelled",
    portal_error: "Error opening portal",
    must_login_short: "You need to be logged in",
    faq: "Frequently Asked Questions",
    faq_change_plan: "Can I change my plan at any time?",
    faq_change_plan_answer: "Yes! You can upgrade or downgrade your plan at any time. The value will be prorated.",
    faq_payment: "What payment methods are accepted?",
    faq_payment_answer: "We accept credit cards and other local payment methods.",
    faq_trial: "Is there a free trial?",
    faq_trial_answer: "Yes! All plans have a 14-day free trial, no credit card required.",
    faq_support: "How does support work?",
    faq_support_answer: "We offer support via email, chat, and phone depending on the plan. Premium plans have 24/7 support.",
    revenue: "Revenue",
    value: "Value",
    client_registered: "Client registered",
    contract_label: "Contract",
    now: "now",
    min_ago: "min ago",
    hours_ago: "h ago",
    days_ago: "d ago",
    months_ago: "months ago",
    active_contracts_count: "active contracts",
    pending_contracts_count: "pending contracts",
    total_contracts_count: "total contracts",
    follow_revenue: "Track revenue and contracts",
    plan_inicial_desc: "For small businesses getting started",
    plan_profissional_desc: "For growing businesses",
    plan_premium_desc: "For large operations",
    plan_custom_desc: "Custom solutions",
  },
  "en-EU": {
    dashboard: "Dashboard",
    clients: "Clients",
    contracts: "Contracts",
    positions: "Positions",
    employees: "Employees",
    financial: "Financial",
    crm: "CRM",
    conciliation: "Reconciliation",
    reports_ai: "AI Reports",
    support: "Support",
    settings: "Settings",
    plans: "Plans",
    welcome_back: "Welcome back! Here's a summary of your business.",
    view_clients: "View Clients",
    new_client: "+ New Client",
    active_revenue: "Revenue (Active Contracts)",
    active: "active",
    pending_contracts: "Pending Contracts",
    of_total: "total",
    active_contracts: "Active Contracts",
    expired: "expired",
    recent_activity: "Recent Activity",
    no_activity: "No activity yet. Register clients and contracts to get started.",
    contracts_per_month: "Contracts per Month",
    last_7_months: "Last 7 months",
    distribution: "Distribution",
    total_contracts: "Total contracts",
    revenue_per_month: "Revenue per Month",
    active_revenue_label: "Active Revenue",
    pending: "Pending",
    total_all: "Total Value (All)",
    avg_ticket: "Average Ticket",
    per_contract: "per contract",
    recent_contracts: "Recent Contracts",
    no_contracts: "No contracts registered yet.",
    status_distribution: "Status Distribution",
    active_label: "Active",
    pending_label: "Pending",
    cancelled: "Cancelled",
    expired_label: "Expired",
    register_contracts: "Register contracts to see revenue chart",
    no_data: "No data",
    current_plan: "Current plan",
    search: "Search...",
    logout_success: "Logged out successfully",
    plans_pricing: "Plans & Pricing",
    plans_subtitle: "Choose the ideal plan for your business. All include free updates.",
    your_plan: "Your current plan",
    renewal_in: "Renewal in",
    days: "days",
    manage_subscription: "Manage Subscription",
    login_to_subscribe: "Login to subscribe",
    create_account: "Create an account to choose your plan",
    popular: "Popular",
    current: "Current",
    choose_plan: "Choose Plan",
    current_plan_btn: "Current Plan",
    contact_us: "Contact Us",
    contact_custom: "Contact us for custom plans",
    must_login: "You need to be logged in to subscribe",
    checkout_error: "Error starting checkout",
    subscription_success: "Subscription completed successfully!",
    checkout_cancelled: "Checkout cancelled",
    portal_error: "Error opening portal",
    must_login_short: "You need to be logged in",
    faq: "Frequently Asked Questions",
    faq_change_plan: "Can I change my plan at any time?",
    faq_change_plan_answer: "Yes! You can upgrade or downgrade your plan at any time. The value will be prorated.",
    faq_payment: "What payment methods are accepted?",
    faq_payment_answer: "We accept credit cards and SEPA direct debit.",
    faq_trial: "Is there a free trial?",
    faq_trial_answer: "Yes! All plans have a 14-day free trial, no credit card required.",
    faq_support: "How does support work?",
    faq_support_answer: "We offer support via email, chat, and phone depending on the plan. Premium plans have 24/7 support.",
    revenue: "Revenue",
    value: "Value",
    client_registered: "Client registered",
    contract_label: "Contract",
    now: "now",
    min_ago: "min ago",
    hours_ago: "h ago",
    days_ago: "d ago",
    months_ago: "months ago",
    active_contracts_count: "active contracts",
    pending_contracts_count: "pending contracts",
    total_contracts_count: "total contracts",
    follow_revenue: "Track revenue and contracts",
    plan_inicial_desc: "For small businesses getting started",
    plan_profissional_desc: "For growing businesses",
    plan_premium_desc: "For large operations",
    plan_custom_desc: "Custom solutions",
  },
};

interface LocaleContextType {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
  formatDate: (date: string | Date) => string;
  config: LocaleConfig;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleKey>(() => {
    const saved = localStorage.getItem("nexascore-locale");
    if (saved && saved in LOCALES) return saved as LocaleKey;
    // Auto-detect from browser
    const browserLang = navigator.language;
    if (browserLang.startsWith("pt")) return "pt-BR";
    if (browserLang.startsWith("en")) return "en-US";
    return "pt-BR";
  });

  const setLocale = useCallback((newLocale: LocaleKey) => {
    setLocaleState(newLocale);
    localStorage.setItem("nexascore-locale", newLocale);
  }, []);

  const config = LOCALES[locale];

  const t = useCallback((key: string): string => {
    return translations[locale]?.[key] || translations["pt-BR"]?.[key] || key;
  }, [locale]);

  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }, [config]);

  const formatDate = useCallback((date: string | Date): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(config.locale);
  }, [config]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, formatCurrency, formatDate, config }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
