import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UpgradeBannerProps {
  resource: string;
  currentCount: number;
  limit: number;
  compact?: boolean;
}

export function UpgradeBanner({ resource, currentCount, limit, compact }: UpgradeBannerProps) {
  const navigate = useNavigate();
  const { getUpgradePlan } = useAuth();
  const nextPlan = getUpgradePlan();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Lock className="h-4 w-4 text-primary" />
        <span>
          {currentCount}/{limit === Infinity ? "∞" : limit} {resource}
        </span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-primary"
          onClick={() => navigate("/dashboard/plans")}
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">
            Limite atingido: {currentCount}/{limit} {resource}
          </p>
          <p className="text-xs text-muted-foreground">
            Faça upgrade para o plano <strong className="capitalize">{nextPlan}</strong> para desbloquear mais.
          </p>
        </div>
      </div>
      <Button size="sm" onClick={() => navigate("/dashboard/plans")}>
        Fazer Upgrade
      </Button>
    </div>
  );
}

interface FeatureLockedProps {
  feature: string;
  minPlan?: string;
}

export function FeatureLocked({ feature, minPlan = "Inicial" }: FeatureLockedProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{feature}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Este recurso está disponível a partir do plano <strong>{minPlan}</strong>.
        </p>
      </div>
      <Button onClick={() => navigate("/dashboard/plans")}>
        Ver Planos
      </Button>
    </div>
  );
}
