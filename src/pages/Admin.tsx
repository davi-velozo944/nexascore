import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Search,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";

type PlanKey = "gratis" | "bronze" | "prata" | "ouro";

const PLAN_PRICES: Record<PlanKey, number> = {
  gratis: 0,
  bronze: 49,
  prata: 99,
  ouro: 199,
};

const PLAN_LABELS: Record<PlanKey, string> = {
  gratis: "Grátis",
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
};

interface AdminProfile {
  id: string;
  user_id: string;
  email: string | null;
  responsible_name: string | null;
  company_name: string | null;
  created_at: string;
  plan: PlanKey;
  status: string;
  ai_usage_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        navigate("/login");
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      await fetchProfiles();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, email, responsible_name, company_name, created_at, plan, status, ai_usage_count")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setProfiles((data ?? []) as unknown as AdminProfile[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.responsible_name ?? "").toLowerCase().includes(q) ||
        (p.company_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const metrics = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((p) => p.status === "active").length;
    const revenue = profiles
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + (PLAN_PRICES[p.plan] ?? 0), 0);
    const aiUsage = profiles.reduce((sum, p) => sum + (p.ai_usage_count ?? 0), 0);
    return { total, active, revenue, aiUsage };
  }, [profiles]);

  const updateProfile = async (id: string, patch: Partial<AdminProfile>) => {
    setSavingId(id);
    const { error } = await supabase
      .from("profiles")
      .update(patch as never)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } as AdminProfile : p)));
      toast({ title: "Atualizado", description: "Alteração aplicada com sucesso." });
    }
    setSavingId(null);
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-200 p-6">
        <Card className="max-w-md w-full border-slate-800 bg-[#0b0f17]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-400">
              <Shield className="h-5 w-5" /> Acesso restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-400">
            <p>Você não tem permissão para acessar o painel administrativo.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-[#07090e] via-[#0b0f17] to-[#07090e]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Painel Administrativo</h1>
              <p className="text-xs text-slate-500">Centro de comando NexaScore</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Empresas cadastradas"
            value={metrics.total.toString()}
          />
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Usuários ativos"
            value={metrics.active.toString()}
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Faturamento mensal"
            value={`R$ ${metrics.revenue.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Uso da IA (Gemini)"
            value={metrics.aiUsage.toLocaleString("pt-BR")}
          />
        </div>

        <Card className="border-slate-800/80 bg-[#0b0f17] shadow-[0_8px_30px_-12px_rgba(56,189,248,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base text-slate-100">Gerenciamento de clientes</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Override manual de planos e status. Sobrescreve validações externas.
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, empresa ou e-mail"
                className="pl-9 bg-[#07090e] border-slate-800"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Cliente</TableHead>
                      <TableHead className="text-slate-400">Empresa</TableHead>
                      <TableHead className="text-slate-400">E-mail</TableHead>
                      <TableHead className="text-slate-400">Cadastro</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Plano</TableHead>
                      <TableHead className="text-slate-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                          Nenhum cliente encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((p) => {
                        const blocked = p.status !== "active";
                        return (
                          <TableRow key={p.id} className="border-slate-800 hover:bg-slate-900/40">
                            <TableCell className="font-medium text-slate-100">
                              {p.responsible_name ?? "—"}
                            </TableCell>
                            <TableCell className="text-slate-300">{p.company_name ?? "—"}</TableCell>
                            <TableCell className="text-slate-400">{p.email ?? "—"}</TableCell>
                            <TableCell className="text-slate-400">
                              {new Date(p.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  blocked
                                    ? "border-red-500/30 text-red-400 bg-red-500/10"
                                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                }
                              >
                                {blocked ? "Bloqueado" : "Ativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={p.plan}
                                onValueChange={(v) =>
                                  updateProfile(p.id, { plan: v as PlanKey })
                                }
                                disabled={savingId === p.id}
                              >
                                <SelectTrigger className="w-[130px] bg-[#07090e] border-slate-800 text-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0b0f17] border-slate-800">
                                  {(Object.keys(PLAN_LABELS) as PlanKey[]).map((k) => (
                                    <SelectItem key={k} value={k}>
                                      {PLAN_LABELS[k]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingId === p.id}
                                onClick={() =>
                                  updateProfile(p.id, {
                                    status: blocked ? "active" : "blocked",
                                  })
                                }
                                className={
                                  blocked
                                    ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                                    : "border-red-500/40 text-red-400 hover:bg-red-500/10"
                                }
                              >
                                {blocked ? (
                                  <>
                                    <Unlock className="h-3.5 w-3.5 mr-1" /> Ativar
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3.5 w-3.5 mr-1" /> Bloquear
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Card className="border-slate-800/80 bg-gradient-to-br from-[#0b0f17] to-[#07090e] shadow-[0_8px_30px_-12px_rgba(56,189,248,0.2)]">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-sky-400">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-100">{value}</div>
    </CardContent>
  </Card>
);

export default Admin;