import { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AiInsightsCard } from "@/components/dashboard/AiInsightsCard";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Ticket, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useNavigate } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  total_revenue: number | null;
  created_at: string;
  status: string;
}

interface Contract {
  id: string;
  client_name: string;
  contract_value: number;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { t, formatCurrency } = useLocale();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [clientsRes, contractsRes] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id),
        supabase.from("contracts").select("*").eq("user_id", user.id),
      ]);
      setClients(clientsRes.data || []);
      setContracts(contractsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const totalRevenue = contracts
      .filter(c => c.status === "ativo")
      .reduce((acc, c) => acc + c.contract_value, 0);
    const activeContracts = contracts.filter(c => c.status === "ativo").length;
    const pendingContracts = contracts.filter(c => c.status === "pendente").length;
    const expiredContracts = contracts.filter(c => {
      if (!c.end_date) return false;
      return new Date(c.end_date) < new Date();
    }).length;
    const totalClients = clients.length;

    return { totalRevenue, activeContracts, pendingContracts, expiredContracts, totalClients };
  }, [clients, contracts]);

  const revenueData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthContracts = contracts.filter(c => {
        const start = new Date(c.start_date);
        return start.getMonth() === d.getMonth() && start.getFullYear() === d.getFullYear();
      });
      data.push({
        month: months[d.getMonth()],
        receita: monthContracts.reduce((acc, c) => acc + c.contract_value, 0),
      });
    }
    return data;
  }, [contracts]);

  const contractsDistribution = useMemo(() => [
    { name: t("active_label"), value: stats.activeContracts },
    { name: t("pending_label"), value: stats.pendingContracts },
    { name: t("expired_label"), value: stats.expiredContracts },
    { name: `${t("new")} (30d)`, value: contracts.filter(c => {
      const created = new Date(c.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return created >= thirtyDaysAgo;
    }).length },
  ], [contracts, stats, t]);

  const recentActivity = useMemo(() => {
    const activities: { id: string; type: string; message: string; time: string }[] = [];
    
    const sortedClients = [...clients].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 3);
    
    const sortedContracts = [...contracts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 3);

    sortedClients.forEach(c => {
      activities.push({
        id: `client-${c.id}`,
        type: "client",
        message: `${t("client_registered")}: ${c.name}`,
        time: formatTimeAgo(c.created_at, t),
      });
    });

    sortedContracts.forEach(c => {
      activities.push({
        id: `contract-${c.id}`,
        type: "contract",
        message: `${t("contract_label")}: ${c.client_name} - ${formatCurrency(c.contract_value)}`,
        time: formatTimeAgo(c.created_at, t),
      });
    });

    return activities
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5);
  }, [clients, contracts, t, formatCurrency]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{t("dashboard")}</h1>
          <p className="text-muted-foreground mt-1">{t("welcome_back")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/clients")}>{t("view_clients")}</Button>
          <Button variant="nexa" onClick={() => navigate("/dashboard/clients")}>{t("new_client")}</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title={t("active_revenue")}
          value={formatCurrency(stats.totalRevenue)}
          change={`${stats.activeContracts} ${t("active")}`}
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-nexa-success"
        />
        <StatCard
          title={t("pending_contracts")}
          value={String(stats.pendingContracts)}
          change={`${contracts.length} ${t("of_total")}`}
          changeType={stats.pendingContracts > 0 ? "negative" : "positive"}
          icon={FileText}
          iconColor="text-nexa-warning"
        />
        <StatCard
          title={t("active_contracts")}
          value={String(stats.activeContracts)}
          change={`${stats.expiredContracts} ${t("expired")}`}
          changeType="positive"
          icon={FileText}
          iconColor="text-primary"
        />
        <StatCard
          title={t("clients")}
          value={String(stats.totalClients)}
          change={`${clients.filter(c => c.status === "ativo").length} ${t("active")}`}
          changeType="positive"
          icon={Users}
          iconColor="text-nexa-info"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">{t("contracts_per_month")}</h3>
              <p className="text-sm text-muted-foreground">{t("last_7_months")}</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), t("value")]}
                />
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" name={t("revenue")} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">{t("contracts")}</h3>
              <p className="text-sm text-muted-foreground">{t("distribution")}</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractsDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("total_contracts")}</span>
              <span className="font-semibold">{contracts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t("recent_activity")}</h3>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("no_activity")}</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {activity.type === "client" && <Users className="h-5 w-5 text-primary" />}
                    {activity.type === "contract" && <FileText className="h-5 w-5 text-nexa-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <AiInsightsCard />
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("now");
  if (diffMin < 60) return `${diffMin} ${t("min_ago")}`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}${t("hours_ago")}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}${t("days_ago")}`;
  return `${Math.floor(diffDays / 30)} ${t("months_ago")}`;
}
