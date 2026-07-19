import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Building2, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";

type Status = "prospeccao" | "proposta" | "fechado" | "perdido";

interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  estimated_value: number;
  status: Status;
  notes: string | null;
  position: number;
}

const COLUMNS: { key: Status; title: string; tone: string }[] = [
  { key: "prospeccao", title: "Prospecção", tone: "bg-nexa-info/10 border-nexa-info/30" },
  { key: "proposta", title: "Proposta", tone: "bg-nexa-warning/10 border-nexa-warning/30" },
  { key: "fechado", title: "Fechado", tone: "bg-nexa-success/10 border-nexa-success/30" },
  { key: "perdido", title: "Perdido", tone: "bg-destructive/10 border-destructive/30" },
];

function LeadCard({ lead, onDelete }: { lead: Lead; onDelete: (id: string) => void }) {
  const { formatCurrency } = useLocale();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-xl bg-card border border-border cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{lead.name}</p>
          {lead.company && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Building2 className="h-3 w-3" />{lead.company}</p>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {lead.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2 truncate"><Mail className="h-3 w-3" />{lead.email}</p>}
      {lead.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{lead.phone}</p>}
      {lead.estimated_value > 0 && (
        <p className="text-sm font-semibold text-primary mt-3">{formatCurrency(Number(lead.estimated_value))}</p>
      )}
    </div>
  );
}

function Column({ column, leads, onDelete }: { column: { key: Status; title: string; tone: string }; leads: Lead[]; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const total = leads.reduce((s, l) => s + Number(l.estimated_value), 0);
  const { formatCurrency } = useLocale();
  return (
    <div ref={setNodeRef} className={`rounded-2xl border ${column.tone} p-4 min-h-[400px] transition-colors ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{column.title}</h3>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      {total > 0 && <p className="text-xs text-muted-foreground mb-3">{formatCurrency(total)}</p>}
      <div className="space-y-2">
        {leads.map(l => <LeadCard key={l.id} lead={l} onDelete={onDelete} />)}
        {leads.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Arraste leads aqui</p>}
      </div>
    </div>
  );
}

export default function CRM() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads").select("*").eq("user_id", user.id)
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [user]);

  const handleAdd = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    const { error } = await supabase.from("crm_leads").insert({
      user_id: user.id,
      name: name.trim(),
      company: company.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      estimated_value: parseFloat(value.replace(",", ".")) || 0,
      notes: notes.trim() || null,
      status: "prospeccao",
      position: leads.filter(l => l.status === "prospeccao").length,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead criado");
    setName(""); setCompany(""); setEmail(""); setPhone(""); setValue(""); setNotes("");
    setOpen(false); fetchLeads();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("crm_leads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLeads(leads.filter(l => l.id !== id));
    toast.success("Lead removido");
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = String(over.id) as Status;
    if (!COLUMNS.find(c => c.key === newStatus)) return;
    const lead = leads.find(l => l.id === active.id);
    if (!lead || lead.status === newStatus) return;

    // Optimistic
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from("crm_leads")
      .update({ status: newStatus }).eq("id", lead.id);
    if (error) {
      toast.error("Erro ao mover: " + error.message);
      fetchLeads();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Pipeline de vendas — arraste leads entre colunas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="nexa"><Plus className="h-4 w-4 mr-2" />Novo lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Empresa</Label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
                <div className="space-y-2"><Label>Valor estimado</Label><Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="nexa" onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <Column key={col.key} column={col} leads={leads.filter(l => l.status === col.key)} onDelete={handleDelete} />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} onDelete={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
