import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  PieChart, Loader2, Plus, Trash2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";

interface Tx {
  id: string;
  description: string;
  amount: number;
  type: "receita" | "despesa";
  category: string | null;
  transaction_date: string;
}

const CATEGORIES = ["Vendas", "Serviços", "Salários", "Aluguel", "Impostos", "Marketing", "Tecnologia", "Outros"];

export default function Financial() {
  const { user } = useAuth();
  const { formatCurrency, formatDate } = useLocale();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [category, setCategory] = useState("Vendas");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchTxs = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });
    if (error) toast.error("Erro ao carregar: " + error.message);
    setTxs((data as Tx[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTxs(); }, [user]);

  const resetForm = () => {
    setDescription(""); setAmount(""); setType("receita");
    setCategory("Vendas"); setDate(new Date().toISOString().slice(0, 10));
  };

  const handleAdd = async () => {
    if (!user) return;
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim() || isNaN(value) || value <= 0) {
      toast.error("Preencha descrição e valor válido");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("financial_transactions").insert({
      user_id: user.id,
      description: description.trim(),
      amount: value,
      type, category, transaction_date: date,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Lançamento adicionado");
    resetForm(); setOpen(false); fetchTxs();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lançamento removido");
    setTxs(txs.filter(t => t.id !== id));
  };

  const totalReceita = txs.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
  const totalDespesa = txs.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);
  const lucro = totalReceita - totalDespesa;
  const margem = totalReceita > 0 ? (lucro / totalReceita) * 100 : 0;

  const monthlyData = useMemo(() => {
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const now = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = txs.filter(t => {
        const td = new Date(t.transaction_date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      data.push({
        month: months[d.getMonth()],
        receita: m.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0),
        despesa: m.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0),
      });
    }
    return data;
  }, [txs]);

  const categoryDist = useMemo(() => {
    const map = new Map<string, number>();
    txs.filter(t => t.type === "despesa").forEach(t => {
      const k = t.category || "Outros";
      map.set(k, (map.get(k) || 0) + Number(t.amount));
    });
    const colors = ["hsl(var(--primary))","hsl(var(--nexa-warning))","hsl(var(--nexa-success))","hsl(var(--destructive))","hsl(var(--nexa-info))","hsl(var(--muted-foreground))"];
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [txs]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Controle de receitas e despesas em tempo real</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="nexa"><Plus className="h-4 w-4 mr-2" />Novo lançamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Descrição</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Venda do cliente X" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent></Select></div>
                <div className="space-y-2"><Label>Valor</Label>
                  <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Data</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="nexa" onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-nexa-success/20"><TrendingUp className="h-6 w-6 text-nexa-success" /></div>
            <ArrowUpRight className="h-5 w-5 text-nexa-success" />
          </div>
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalReceita)}</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-destructive/20"><TrendingDown className="h-6 w-6 text-destructive" /></div>
            <ArrowDownRight className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Despesa Total</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalDespesa)}</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${lucro >= 0 ? "bg-primary/20" : "bg-destructive/20"}`}>
              <DollarSign className={`h-6 w-6 ${lucro >= 0 ? "text-primary" : "text-destructive"}`} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Lucro</p>
          <p className={`text-2xl font-bold mt-1 ${lucro >= 0 ? "" : "text-destructive"}`}>{formatCurrency(lucro)}</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-nexa-info/20"><PieChart className="h-6 w-6 text-nexa-info" /></div>
          </div>
          <p className="text-sm text-muted-foreground">Margem</p>
          <p className="text-2xl font-bold mt-1">{margem.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Receitas vs Despesas (7 meses)</h3>
          <div className="h-80">
            {monthlyData.some(d => d.receita > 0 || d.despesa > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--nexa-success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--nexa-success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--nexa-success))" strokeWidth={2} fill="url(#colorR)" name="Receita" />
                  <Area type="monotone" dataKey="despesa" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#colorD)" name="Despesa" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nenhum lançamento ainda</div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Despesas por categoria</h3>
          <div className="h-64">
            {categoryDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categoryDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => formatCurrency(v)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem despesas</div>
            )}
          </div>
          <div className="space-y-2 mt-4">
            {categoryDist.map(c => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Lançamentos</h3>
        </div>
        <div className="divide-y divide-border">
          {txs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lançamento. Clique em "Novo lançamento" para começar.</div>
          ) : txs.map(tx => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === "receita" ? "bg-nexa-success/20" : "bg-destructive/20"}`}>
                  {tx.type === "receita" ? <ArrowUpRight className="h-5 w-5 text-nexa-success" /> : <ArrowDownRight className="h-5 w-5 text-destructive" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(tx.transaction_date)} · {tx.category || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-semibold ${tx.type === "receita" ? "text-nexa-success" : "text-destructive"}`}>
                  {tx.type === "receita" ? "+" : "−"} {formatCurrency(Number(tx.amount))}
                </p>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
