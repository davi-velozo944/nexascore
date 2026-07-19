import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { toast } from "sonner";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  total_revenue: number;
  contracts_count: number;
  created_at: string;
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { user, canAdd, quota } = useAuth();

  const { lookup: lookupCnpj, loading: cnpjLoading } = useCnpjLookup();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    cnpj: "",
    status: "ativo",
    notes: "",
  });

  const handleCnpjLookup = async () => {
    const result = await lookupCnpj(formData.cnpj);
    if (result) {
      setFormData(prev => ({
        ...prev,
        name: result.razao_social || prev.name,
        company: result.nome_fantasia || result.razao_social || prev.company,
        email: prev.email || result.email || "",
        phone: prev.phone || result.ddd_telefone_1 || "",
        notes: prev.notes 
          ? prev.notes 
          : `Cidade: ${result.municipio}/${result.uf} | CNAE: ${result.cnae_fiscal_descricao}`,
      }));
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    }
  };

  // Auto-fill when a complete 14-digit CNPJ is typed
  const lastFetchedCnpjRef = useRef<string>("");
  useEffect(() => {
    const cleaned = formData.cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    if (lastFetchedCnpjRef.current === cleaned) return;
    lastFetchedCnpjRef.current = cleaned;
    (async () => {
      const result = await lookupCnpj(cleaned, { silent: true });
      if (!result) return;
      setFormData(prev => ({
        ...prev,
        name: prev.name || result.razao_social || "",
        company: prev.company || result.nome_fantasia || result.razao_social || "",
        email: prev.email || result.email || "",
        phone: prev.phone || result.ddd_telefone_1 || "",
        notes: prev.notes
          ? prev.notes
          : `Cidade: ${result.municipio}/${result.uf} | CNAE: ${result.cnae_fiscal_descricao}`,
      }));
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cnpj]);

  const fetchClients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editingClient && !canAdd("clients", clients.length)) {
      toast.error(`Limite de ${quota.clients} clientes atingido. Faça upgrade do plano.`);
      return;
    }

    // Sanitiza dados antes de enviar ao banco — evita rejeições por
    // strings vazias, status inválidos ou CNPJ mal formatado.
    const allowedStatus = ["ativo", "pendente", "inativo"] as const;
    const safeStatus = allowedStatus.includes(formData.status as typeof allowedStatus[number])
      ? formData.status
      : "ativo";
    const cleanName = formData.name.trim();
    if (!cleanName) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const cleanCnpj = formData.cnpj.replace(/\D/g, "");
    const cnpjNote = cleanCnpj ? `CNPJ: ${cleanCnpj}` : "";
    const baseNotes = formData.notes.trim();
    const mergedNotes = [baseNotes, cnpjNote].filter(Boolean).join(" | ") || null;

    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update({
            name: cleanName,
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            company: formData.company.trim() || null,
            status: safeStatus,
            notes: mergedNotes,
          })
          .eq("id", editingClient.id);

        if (error) throw error;
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            name: cleanName,
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            company: formData.company.trim() || null,
            status: safeStatus,
            notes: mergedNotes,
          });

        if (error) throw error;
        toast.success("Cliente criado com sucesso!");
      }

      handleCloseDialog();
      fetchClients();
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast.error(error?.message || "Erro ao salvar cliente");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Cliente excluído com sucesso!");
      fetchClients();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error("Erro ao excluir cliente");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      cnpj: "",
      status: client.status,
      notes: client.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      cnpj: "",
      status: "ativo",
      notes: "",
    });
    setEditingClient(null);
  };

  // Fechamento seguro do modal: usado pelo botão "Cancelar".
  // Apenas atualiza estado local — não toca em refs do DOM nem dispara
  // unmounts que causavam o erro `removeChild` no React.
  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Reset agendado após o ciclo de animação do Dialog para evitar
    // mutações de estado durante o unmount do Radix Portal.
    setTimeout(() => resetForm(), 0);
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-nexa-success/20 text-nexa-success";
      case "pendente":
        return "bg-nexa-warning/20 text-nexa-warning";
      case "inativo":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const totalRevenue = clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
  const activeClients = clients.filter(c => c.status === "ativo").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!canAdd("clients", clients.length) && (
        <UpgradeBanner resource="clientes" currentCount={clients.length} limit={quota.clients} />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de clientes e acompanhe o histórico
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="nexa">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* CNPJ Lookup */}
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (preenche dados automaticamente)</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                  <Button type="button" variant="outline" onClick={handleCnpjLookup} disabled={cnpjLoading}>
                    {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas sobre o cliente..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" variant="nexa">
                  {editingClient ? "Salvar" : "Criar Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Total de Clientes</p>
          <p className="text-2xl font-bold mt-1">{clients.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          <p className="text-2xl font-bold mt-1 text-nexa-success">{activeClients}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-2xl font-bold mt-1">R$ {(totalRevenue / 1000).toFixed(1)}k</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-bold mt-1">
            R$ {clients.length > 0 ? (totalRevenue / clients.length).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                    Cliente
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">Telefone</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {clients.length === 0 
                      ? "Nenhum cliente cadastrado. Clique em 'Novo Cliente' para começar."
                      : "Nenhum cliente encontrado com os filtros aplicados."
                    }
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.company && (
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {client.email || "-"}
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">
                      {client.phone || "-"}
                    </td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(client.status))}>
                        {client.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredClients.length} de {clients.length} clientes
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" disabled={filteredClients.length <= 10}>Próximo</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
