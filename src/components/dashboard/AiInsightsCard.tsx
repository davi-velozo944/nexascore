import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FinancialAnalysis {
  resumo: string;
  score: number;
  insights: string[];
  alertas: string[];
  recomendacoes: string[];
  metricas: {
    receita_mensal: number;
    despesa_mensal: number;
    lucro_mensal: number;
    margem_percentual: number;
  };
}

export function AiInsightsCard() {
  const { session } = useAuth();
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!session?.access_token) {
      toast.error("Faça login para usar a análise inteligente");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-financial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro na análise");
      }

      const data = await res.json();
      setAnalysis(data);
      toast.success("Análise concluída!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao analisar");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-nexa-success";
    if (score >= 40) return "text-nexa-warning";
    return "text-destructive";
  };

  if (!analysis) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Dashboard Inteligente</h3>
            <p className="text-sm text-muted-foreground">Análise de gastos e lucros com IA</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Clique para gerar uma análise inteligente completa dos seus dados financeiros.
        </p>
        <Button variant="nexa" onClick={runAnalysis} disabled={loading} className="w-full gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analisando..." : "Analisar com IA"}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
      {/* Header + Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Dashboard Inteligente</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={runAnalysis} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
          {analysis.score}
        </div>
        <div>
          <p className="text-sm font-medium">Score Financeiro</p>
          <p className="text-xs text-muted-foreground">{analysis.resumo}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-nexa-success/10 border border-nexa-success/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-nexa-success" />
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <p className="font-semibold text-sm">R$ {analysis.metricas.receita_mensal.toLocaleString("pt-BR")}</p>
        </div>
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs text-muted-foreground">Despesa</span>
          </div>
          <p className="font-semibold text-sm">R$ {analysis.metricas.despesa_mensal.toLocaleString("pt-BR")}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Lucro</p>
          <p className="font-semibold text-sm">R$ {analysis.metricas.lucro_mensal.toLocaleString("pt-BR")}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Margem</p>
          <p className="font-semibold text-sm">{analysis.metricas.margem_percentual.toFixed(1)}%</p>
        </div>
      </div>

      {/* Alerts */}
      {analysis.alertas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-nexa-warning">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Alertas</span>
          </div>
          {analysis.alertas.map((a, i) => (
            <p key={i} className="text-sm text-muted-foreground pl-6">• {a}</p>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {analysis.recomendacoes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm font-medium">Recomendações</span>
          </div>
          {analysis.recomendacoes.slice(0, 3).map((r, i) => (
            <p key={i} className="text-sm text-muted-foreground pl-6">• {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}
