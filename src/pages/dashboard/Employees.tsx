import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  position_id: string | null;
  department: string | null;
  salary: number;
  hire_date: string;
  status: string;
  notes: string | null;
}

interface Position {
  id: string;
  title: string;
  department: string | null;
}

export default function Employees() {
  const { user, canAdd, quota } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", cpf: "", position_id: "", department: "",
    salary: "", hire_date: new Date().toISOString().split("T")[0], status: "ativo", notes: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const [empRes, posRes] = await Promise.all([
      supabase.from("employees").select("*").order("created_at", { ascending: false }),
      supabase.from("positions").select("id, title, department").order("title"),
    ]);
    setEmployees(empRes.data || []);
    setPositions(posRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editing && !canAdd("employees", employees.length)) {
      toast.error(`Limite de ${quota.employees} funcionários atingido. Faça upgrade do plano.`);
      return;
    }
    const payload = {
      user_id: user.id,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      cpf: form.cpf || null,
      position_id: form.position_id || null,
      department: form.department || null,
      salary: parseFloat(form.salary) || 0,
      hire_date: form.hire_date,
      status: form.status,
      notes: form.notes || null,
    };

    if (editing) {
      const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Funcionário atualizado!");
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Funcionário cadastrado!");
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este funcionário?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); fetchData(); }
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      name: emp.name, email: emp.email || "", phone: emp.phone || "", cpf: emp.cpf || "",
      position_id: emp.position_id || "", department: emp.department || "",
      salary: String(emp.salary), hire_date: emp.hire_date, status: emp.status, notes: emp.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", cpf: "", position_id: "", department: "", salary: "", hire_date: new Date().toISOString().split("T")[0], status: "ativo", notes: "" });
    setEditing(null);
  };

  const getPositionTitle = (id: string | null) => positions.find(p => p.id === id)?.title || "—";

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.email && e.email.toLowerCase().includes(search.toLowerCase())) ||
    (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSalaries = employees.filter(e => e.status === "ativo").reduce((s, e) => s + e.salary, 0);
  const activeCount = employees.filter(e => e.status === "ativo").length;

  const getStatusColor = (s: string) => {
    if (s === "ativo") return "bg-nexa-success/20 text-nexa-success";
    if (s === "férias") return "bg-nexa-warning/20 text-nexa-warning";
    return "bg-muted text-muted-foreground";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {!canAdd("employees", employees.length) && (
        <UpgradeBanner resource="funcionários" currentCount={employees.length} limit={quota.employees} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground mt-1">Cadastro e gestão de colaboradores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="nexa"><Plus className="h-4 w-4 mr-2" />Novo Funcionário</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select value={form.position_id} onValueChange={v => setForm({ ...form, position_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salário (R$)</Label>
                  <Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Admissão</Label>
                  <Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="férias">Férias</SelectItem>
                      <SelectItem value="afastado">Afastado</SelectItem>
                      <SelectItem value="desligado">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="nexa">{editing ? "Salvar" : "Cadastrar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">{employees.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Ativos</p>
          <p className="text-2xl font-bold mt-1 text-nexa-success">{activeCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Folha Mensal</p>
          <p className="text-2xl font-bold mt-1">R$ {(totalSalaries / 1000).toFixed(1)}k</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Salário Médio</p>
          <p className="text-2xl font-bold mt-1">R$ {activeCount > 0 ? Math.round(totalSalaries / activeCount).toLocaleString("pt-BR") : "0"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar funcionários..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Funcionário</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">Cargo</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">Salário</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {employees.length === 0 ? "Nenhum funcionário cadastrado." : "Nenhum resultado."}
                </td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        {emp.department && <p className="text-sm text-muted-foreground">{emp.department}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{getPositionTitle(emp.position_id)}</td>
                  <td className="p-4 font-medium hidden lg:table-cell">R$ {emp.salary.toLocaleString("pt-BR")}</td>
                  <td className="p-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(emp.status))}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(emp)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(emp.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
