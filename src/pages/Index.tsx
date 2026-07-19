import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  FileText, 
  Wallet,
  MessageSquare,
  Check,
  Star,
  Loader2,
} from "lucide-react";
import { useAuth, PLAN_TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const features = [
  {
    icon: BarChart3,
    title: "Dashboard Inteligente",
    description: "Visualize métricas em tempo real com gráficos interativos e insights automáticos.",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Centralize informações, histórico e valor gerado por cada cliente.",
  },
  {
    icon: FileText,
    title: "Contratos Inteligentes",
    description: "Análise de risco automática e sugestões para renovação de contratos.",
  },
  {
    icon: Wallet,
    title: "Controle Financeiro",
    description: "Acompanhe receitas, despesas e lucros com relatórios detalhados.",
  },
  {
    icon: MessageSquare,
    title: "Atendimento Integrado",
    description: "Sistema de tickets com integração WhatsApp Business.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Criptografia de ponta e backups automáticos para seus dados.",
  },
];

const plans = [
  {
    name: "Inicial",
    key: "inicial" as const,
    price: "R$ 97",
    features: ["50 clientes", "10 contratos", "Relatórios básicos"],
    highlighted: false,
  },
  {
    name: "Profissional",
    key: "profissional" as const,
    price: "R$ 197",
    features: ["200 clientes", "50 contratos", "Relatórios avançados", "Integrações", "Suporte prioritário"],
    highlighted: true,
  },
  {
    name: "Premium",
    key: "premium" as const,
    price: "R$ 397",
    features: ["Ilimitado", "Todas as features", "White label", "Suporte 24/7"],
    highlighted: false,
  },
];

export default function Index() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planKey: "inicial" | "profissional" | "premium") => {
    if (!user || !session) {
      navigate("/register");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const priceId = PLAN_TIERS[planKey].price_id;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar checkout: " + (err.message || "Tente novamente"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="nexa">Ir ao Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/register">
                  <Button variant="nexa">Começar Grátis</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8 animate-fade-in">
            <Zap className="h-4 w-4" />
            Performance, segurança e gestão em um só lugar
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Gerencie sua empresa com{" "}
            <span className="text-gradient">inteligência</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            O NexaScore é a plataforma completa para gestão empresarial. 
            Dashboard, clientes, contratos, financeiro e atendimento integrado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/register">
              <Button variant="nexa" size="xl">
                Começar Gratuitamente
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl">
                Ver Demonstração
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "500+", label: "Empresas" },
              { value: "R$ 50M+", label: "Gerenciados" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "Avaliação" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card/50 border border-border">
                <p className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-nexa-darker">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground">
              Recursos poderosos para transformar a gestão da sua empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-card border border-border card-hover animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-muted-foreground">
              Comece gratuitamente e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border ${
                  plan.highlighted
                    ? "bg-card border-primary shadow-nexa-glow"
                    : "bg-card border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="flex items-center gap-1 text-sm text-primary mb-4">
                    <Star className="h-4 w-4 fill-primary" />
                    Mais popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-4">
                  {plan.price}<span className="text-lg text-muted-foreground">/mês</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "nexa" : "outline"}
                  className="w-full mt-6"
                  disabled={loadingPlan === plan.key}
                  onClick={() => handleCheckout(plan.key)}
                >
                  {loadingPlan === plan.key ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {user ? "Assinar Agora" : "Começar Agora"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-nexa-darker">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar sua gestão?
          </h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a mais de 500 empresas que já confiam no NexaScore
          </p>
          <Link to="/register">
            <Button variant="nexa" size="xl">
              Começar Gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 Nexa Tecnologia. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacidade</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Termos</Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contato</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
