import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Users, Wallet, Sparkles, RefreshCw, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * RELATÓRIOS — NexaScore
 * Processado pela Edge Function `generate-report` no Supabase usando
 * GEMINI_API_KEY armazenada como secret no backend.
 */

type ReportType = "contracts" | "financial" | "clients" | "all";

interface ReportTypeConfig {
  id: ReportType;
  name: string;
  icon: typeof FileText;
  description: string;
}

const reportTypes: ReportTypeConfig[] = [
  { id: "contracts", name: "Contratos", icon: FileText, description: "Análise de contratos ativos e pendentes" },
  { id: "financial", name: "Financeiro", icon: Wallet, description: "Receitas, despesas e projeções" },
  { id: "clients", name: "Clientes", icon: Users, description: "Performance e engajamento de clientes" },
  { id: "all", name: "Completo", icon: Sparkles, description: "Relatório completo com todos os dados" },
];

export default function Reports() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ReportType>("all");
  const [report, setReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateReport = async (): Promise<void> => {
    if (!user) {
      toast.error("Você precisa estar logado para gerar relatórios");
      return;
    }

    setIsGenerating(true);
    setReport("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { type: selectedType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data?.report || "Não foi possível gerar o relatório.");
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao gerar relatório: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (): Promise<void> => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Relatório copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = (): void => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${selectedType}-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório baixado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios com IA</h1>
        <p className="text-muted-foreground">
          Dados processados de forma segura no backend pelo Gemini.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === type.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelectedType(type.id)}
          >
            <CardContent className="p-4 text-center">
              <type.icon
                className={`h-8 w-8 mx-auto mb-2 ${
                  selectedType === type.id ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <h3 className="font-medium">{type.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={generateReport} disabled={isGenerating} className="gap-2 px-8">
          {isGenerating ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Gerar Relatório de {reportTypes.find((t) => t.id === selectedType)?.name}
            </>
          )}
        </Button>
      </div>

      {(report || isGenerating) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Relatório Gerado
              </CardTitle>
              <CardDescription>
                {isGenerating ? "Gerando análise..." : "Análise completa dos seus dados"}
              </CardDescription>
            </div>
            {report && !isGenerating && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {report || (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analisando seus dados...
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}