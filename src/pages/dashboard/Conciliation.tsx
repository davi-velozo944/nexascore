import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureLocked } from "@/components/dashboard/UpgradeBanner";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface BankTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: string;
  category: string | null;
  confirmed: boolean;
  import_id: string | null;
}

interface BankImport {
  id: string;
  file_name: string;
  total_transactions: number;
  total_income: number;
  total_expense: number;
  ai_summary: string | null;
  created_at: string;
}

export default function Conciliation() {
  const { user, session, quota } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [imports, setImports] = useState<BankImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [txRes, impRes] = await Promise.all([
      supabase.from("bank_transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: false }),
      supabase.from("bank_imports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setTransactions((txRes.data as BankTransaction[]) || []);
    setImports((impRes.data as BankImport[]) || []);
    if (impRes.data?.[0]?.ai_summary) setLastSummary(impRes.data[0].ai_summary);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const processFile = async (file: File) => {
    if (!session?.access_token) { toast.error("Faça login primeiro"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "ofx"].includes(ext || "")) {
      toast.error("Formato não suportado. Use CSV ou OFX.");
      return;
    }
    setUploading(true);
    try {
      const fileContent = await file.text();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-bank-statement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fileContent, fileName: file.name, fileType: ext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar");
      toast.success(`${data.total_transactions} transações importadas e categorizadas pela IA!`);
      setLastSummary(data.summary);
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const confirmTransaction = async (id: string) => {
    await supabase.from("bank_transactions").update({ confirmed: true }).eq("id", id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, confirmed: true } : t));
    toast.success("Transação confirmada!");
  };

  const monthlyChart = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTx = transactions.filter(t => {
        const td = new Date(t.transaction_date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      data.push({
        month: months[d.getMonth()],
        ganhos: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        gastos: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return data;
  }, [transactions]);

  const categoryChart = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      const cat = t.category || "Outros";
      cats[cat] = (cats[cat] || 0) + t.amount;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const pendingCount = transactions.filter(t => !t.confirmed).length;

  if (!quota.conciliation) {
    return <FeatureLocked feature="Conciliação Bancária" minPlan="Inicial" />;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Conciliação Bancária</h1>
        <p className="text-muted-foreground mt-1">Importe seu extrato e deixe a IA categorizar tudo automaticamente.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-nexa-success/20"><TrendingUp className="h-5 w-5 text-nexa-success" /></div>
            <span className="text-sm text-muted-foreground">Total Ganhos</span>
          </div>
          <p className="text-xl font-bold">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-destructive/20"><TrendingDown className="h-5 w-5 text-destructive" /></div>
            <span className="text-sm text-muted-foreground">Total Gastos</span>
          </div>
          <p className="text-xl font-bold">R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/20"><Sparkles className="h-5 w-5 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Lucro/Prejuízo</span>
          </div>
          <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-nexa-success" : "text-destructive"}`}>
            R$ {(totalIncome - totalExpense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-nexa-warning/20"><FileText className="h-5 w-5 text-nexa-warning" /></div>
            <span className="text-sm text-muted-foreground">Pendentes</span>
          </div>
          <p className="text-xl font-bold">{pendingCount} <span className="text-sm font-normal text-muted-foreground">transações</span></p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Processando com IA... Categorizando transações automaticamente</p>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Arraste e solte seu extrato aqui</p>
              <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar · Formatos: OFX, CSV</p>
            </div>
            <input type="file" accept=".ofx,.csv" onChange={handleFileInput} className="hidden" />
          </label>
        )}
      </div>

      {/* AI Summary */}
      {lastSummary && (
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Relatório de Performance — IA</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{lastSummary}</p>
        </div>
      )}

      {/* Charts */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ganhos vs Gastos */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-4">Ganhos vs Gastos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChart}>
                  <defs>
                    <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                  <Area type="monotone" dataKey="ganhos" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fillOpacity={1} fill="url(#colorGanhos)" name="Ganhos" />
                  <Area type="monotone" dataKey="gastos" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" name="Gastos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gastos por Categoria */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Valor"]} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List with Conciliation */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transações Importadas</h3>
          <span className="text-sm text-muted-foreground">{transactions.length} transações</span>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Importe um extrato bancário para começar a conciliação automática.
            </div>
          ) : (
            transactions.slice(0, 50).map(tx => (
              <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.type === "income" ? "bg-nexa-success/20" : "bg-destructive/20"
                }`}>
                  {tx.type === "income" ? <ArrowUpRight className="h-5 w-5 text-nexa-success" /> : <ArrowDownRight className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</span>
                    {tx.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{tx.category}</span>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-semibold whitespace-nowrap ${tx.type === "income" ? "text-nexa-success" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                {!tx.confirmed ? (
                  <Button variant="outline" size="sm" className="flex-shrink-0 gap-1" onClick={() => confirmTransaction(tx.id)}>
                    <Check className="h-3.5 w-3.5" /> Confirmar
                  </Button>
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-nexa-success flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
