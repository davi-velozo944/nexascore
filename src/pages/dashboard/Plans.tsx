import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown, Sparkles, Loader2, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth, PLAN_TIERS } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Grátis",
    key: "free" as const,
    description: "Para experimentar o NexaScore",
    price: "R$ 0",
    period: "",
    icon: Gift,
    features: [
      "Até 5 clientes",
      "3 contratos ativos",
      "5 funcionários",
      "1 importação bancária/mês",
      "Sem IA ou relatórios",
    ],
    highlighted: false,
  },
  {
    name: "Inicial",
    key: "inicial" as const,
    description: "Para pequenas empresas começando",
    price: "R$ 97",
    period: "/mês",
    icon: Zap,
    features: [
      "Até 50 clientes",
      "10 contratos ativos",
      "20 funcionários",
      "5 importações bancárias/mês",
      "Análise IA básica",
      "Relatórios básicos",
      "Conciliação bancária",
    ],
    highlighted: false,
  },
  {
    name: "Profissional",
    key: "profissional" as const,
    description: "Para empresas em crescimento",
    price: "R$ 197",
    period: "/mês",
    icon: Star,
    features: [
      "Até 200 clientes",
      "50 contratos ativos",
      "100 funcionários",
      "20 importações bancárias/mês",
      "IA avançada + recomendações",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    key: "premium" as const,
    description: "Para grandes operações",
    price: "R$ 397",
    period: "/mês",
    icon: Crown,
    features: [
      "Clientes ilimitados",
      "Contratos ilimitados",
      "Funcionários ilimitados",
      "Importações ilimitadas",
      "IA completa + insights",
      "Relatórios personalizados",
      "Suporte 24/7",
      "White label + API completa",
    ],
    highlighted: false,
  },
];

export default function Plans() {
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const { user, session, subscription, checkSubscription } = useAuth();
  const { t, formatCurrency: fmtCur } = useLocale();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success(t("subscription_success"));
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast.info(t("checkout_cancelled"));
    }
  }, [searchParams, checkSubscription, t]);

  const handleSubscribe = async (planKey: string | null) => {
    if (!planKey) {
      toast.info(t("contact_custom"));
      return;
    }

    if (planKey === "free") {
      toast.info("Você já está no plano Grátis!");
      return;
    }

    if (!user || !session) {
      toast.error(t("must_login"));
      return;
    }

    const tier = PLAN_TIERS[planKey as keyof typeof PLAN_TIERS];
    if (!tier) return;

    setLoadingPlan(planKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.price_id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || t("checkout_error"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) {
      toast.error(t("must_login_short"));
      return;
    }

    setLoadingPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error(error.message || t("portal_error"));
    } finally {
      setLoadingPortal(false);
    }
  };

  const isCurrentPlan = (planKey: string | null) => {
    if (!planKey) return false;
    if (planKey === "free") return subscription.planKey === "free";
    const tier = PLAN_TIERS[planKey as keyof typeof PLAN_TIERS];
    return tier?.product_id === subscription.productId;
  };

  const formatSubscriptionEnd = () => {
    if (!subscription.subscriptionEnd) return null;
    const date = new Date(subscription.subscriptionEnd);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${t("renewal_in")} ${diffDays} ${t("days")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold">{t("plans_pricing")}</h1>
        <p className="text-muted-foreground mt-2">{t("plans_subtitle")}</p>
      </div>

      {/* Current Plan Banner */}
      {user && subscription.planName && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${
          subscription.subscribed ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              subscription.subscribed ? "bg-primary" : "bg-secondary"
            }`}>
              {subscription.subscribed ? (
                <Star className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Gift className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {t("your_plan")}: <span className="text-primary">{subscription.planName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription.subscribed ? formatSubscriptionEnd() : "Faça upgrade para desbloquear mais recursos"}
              </p>
            </div>
          </div>
          {subscription.subscribed && (
            <Button variant="outline" onClick={handleManageSubscription} disabled={loadingPortal}>
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("manage_subscription")
              )}
            </Button>
          )}
        </div>
      )}

      {/* Not Logged In Banner */}
      {!user && (
        <div className="p-4 rounded-xl bg-muted border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{t("login_to_subscribe")}</p>
              <p className="text-sm text-muted-foreground">{t("create_account")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.key);
          
          return (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl border p-6 flex flex-col relative overflow-hidden transition-all duration-300",
                plan.highlighted
                  ? "bg-card border-primary shadow-nexa-glow"
                  : "bg-card border-border hover:border-primary/30",
                isCurrent && "ring-2 ring-primary"
              )}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  {t("popular")}
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 left-0 bg-nexa-success text-primary-foreground text-xs font-medium px-3 py-1 rounded-br-lg">
                  {t("current")}
                </div>
              )}

              <div className="mb-6">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
                  plan.highlighted ? "bg-primary/20" : "bg-secondary"
                )}>
                  <plan.icon className={cn(
                    "h-6 w-6",
                    plan.highlighted ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className={cn(
                      "h-4 w-4 mt-0.5 flex-shrink-0",
                      plan.highlighted ? "text-primary" : "text-nexa-success"
                    )} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "outline" : plan.highlighted ? "nexa" : "secondary"}
                className="w-full"
                disabled={isCurrent || loadingPlan === plan.key}
                onClick={() => handleSubscribe(plan.key)}
              >
                {loadingPlan === plan.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  t("current_plan_btn")
                ) : plan.key === "free" ? (
                  "Plano Atual"
                ) : (
                  t("choose_plan")
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl bg-card border border-border p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">{t("faq")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">{t("faq_change_plan")}</h4>
            <p className="text-sm text-muted-foreground">{t("faq_change_plan_answer")}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("faq_payment")}</h4>
            <p className="text-sm text-muted-foreground">{t("faq_payment_answer")}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("faq_trial")}</h4>
            <p className="text-sm text-muted-foreground">{t("faq_trial_answer")}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("faq_support")}</h4>
            <p className="text-sm text-muted-foreground">{t("faq_support_answer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
