import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Briefcase, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Position {
  id: string;
  title: string;
  department: string | null;
  salary_min: number;
  salary_max: number;
  description: string | null;
  created_at: string;
}

export default function Positions() {
  const { user, canAdd, quota } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", department: "", salary_min: "", salary_max: "", description: "" });

  const fetchPositions = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("positions").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Erro ao carregar cargos"); }
    else setPositions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPositions(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editing && !canAdd("positions", positions.length)) {
      toast.error(`Limite de ${quota.positions} cargos atingido. Faça upgrade do plano.`);
      return;
    }
    const payload = {
      user_id: user.id,
      title: form.title,
      department: form.department || null,
      salary_min: parseFloat(form.salary_min) || 0,
      salary_max: parseFloat(form.salary_max) || 0,
      description: form.description || null,
    };

    if (editing) {
      const { error } = await supabase.from("positions").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Cargo atualizado!");
    } else {
      const { error } = await supabase.from("positions").insert(payload);
      if (error) { toast.error("Erro ao criar cargo"); return; }
      toast.success("Cargo criado!");
    }
    setDialogOpen(false);
    resetForm();
    fetchPositions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cargo?")) return;
    const { error } = await supabase.from("positions").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Cargo excluído!"); fetchPositions(); }
  };

  const handleEdit = (p: Position) => {
    setEditing(p);
    setForm({ title: p.title, department: p.department || "", salary_min: String(p.salary_min), salary_max: String(p.salary_max), description: p.description || "" });
    setDialogOpen(true);
  };

  const resetForm = () => { setForm({ title: "", department: "", salary_min: "", salary_max: "", description: "" }); setEditing(null); };

  const filtered = positions.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.department && p.department.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {!canAdd("positions", positions.length) && (
        <UpgradeBanner resource="cargos" currentCount={positions.length} limit={quota.positions} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Cargos & Salários</h1>
          <p className="text-muted-foreground mt-1">Gerencie a estrutura de cargos da empresa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="nexa"><Plus className="h-4 w-4 mr-2" />Novo Cargo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editing ? "Editar Cargo" : "Novo Cargo"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Título do Cargo *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Analista Financeiro" required />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Ex: Financeiro" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salário Mínimo (R$)</Label>
                  <Input type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Salário Máximo (R$)</Label>
                  <Input type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Responsabilidades do cargo..." rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="nexa">{editing ? "Salvar" : "Criar Cargo"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Total de Cargos</p>
          <p className="text-2xl font-bold mt-1">{positions.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Departamentos</p>
          <p className="text-2xl font-bold mt-1">{new Set(positions.map(p => p.department).filter(Boolean)).size}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Faixa Média</p>
          <p className="text-2xl font-bold mt-1">
            R$ {positions.length > 0 ? Math.round(positions.reduce((s, p) => s + ((p.salary_min + p.salary_max) / 2), 0) / positions.length).toLocaleString("pt-BR") : "0"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cargos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground rounded-2xl bg-card border border-border">
            {positions.length === 0 ? "Nenhum cargo cadastrado. Clique em 'Novo Cargo' para começar." : "Nenhum cargo encontrado."}
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  {p.department && <p className="text-sm text-muted-foreground">{p.department}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Faixa Salarial</p>
              <p className="font-semibold text-primary">
                R$ {p.salary_min.toLocaleString("pt-BR")} — R$ {p.salary_max.toLocaleString("pt-BR")}
              </p>
            </div>
            {p.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
