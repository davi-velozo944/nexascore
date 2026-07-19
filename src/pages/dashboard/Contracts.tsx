import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  ExternalLink,
  Filter,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { toast } from "sonner";

interface Contract {
  id: string;
  client_name: string;
  contract_value: number;
  duration_months: number;
  start_date: string;
  end_date: string | null;
  status: string;
  risk_level: string | null;
  notes: string | null;
  created_at: string;
}

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, canAdd, quota } = useAuth();

  // Form state
  const [clientName, setClientName] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [riskLevel, setRiskLevel] = useState("baixo");
  const [notes, setNotes] = useState("");

  const fetchContracts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Erro ao carregar contratos");
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canAdd("contracts", contracts.length)) {
      toast.error(`Limite de ${quota.contracts} contratos atingido. Faça upgrade do plano.`);
      return;
    }

    setIsSaving(true);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

    const { error } = await supabase.from("contracts").insert({
      user_id: user.id,
      client_name: clientName,
      contract_value: parseFloat(contractValue),
      duration_months: parseInt(durationMonths),
      start_date: startDate,
      end_date: endDate.toISOString().split('T')[0],
      risk_level: riskLevel,
      notes: notes || null,
    });

    setIsSaving(false);

    if (error) {
      console.error("Error creating contract:", error);
      toast.error("Erro ao criar contrato");
    } else {
      toast.success("Contrato criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      fetchContracts();
    }
  };

  const handleDelete = async (contractId: string) => {
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);
    
    if (error) {
      toast.error("Erro ao excluir contrato");
    } else {
      toast.success("Contrato excluído");
      setSelectedContract(null);
      fetchContracts();
    }
  };

  const resetForm = () => {
    setClientName("");
    setContractValue("");
    setDurationMonths("");
    setStartDate(new Date().toISOString().split('T')[0]);
    setRiskLevel("baixo");
    setNotes("");
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "baixo":
        return "bg-nexa-success/20 text-nexa-success";
      case "médio":
        return "bg-nexa-warning/20 text-nexa-warning";
      case "alto":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ativo":
        return <CheckCircle2 className="h-4 w-4 text-nexa-success" />;
      case "vencendo":
        return <Clock className="h-4 w-4 text-nexa-warning" />;
      case "vencido":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalValue = contracts.reduce((sum, c) => sum + Number(c.contract_value), 0);
  const activeContracts = contracts.filter(c => c.status === 'ativo').length;

  return (
    <div className="space-y-6">
      {!canAdd("contracts", contracts.length) && (
        <UpgradeBanner resource="contratos" currentCount={contracts.length} limit={quota.contracts} />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie contratos, analise riscos e receba sugestões inteligentes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="nexa">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Contrato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: David Alencar"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
                <Input
                  id="contractValue"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 15000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMonths">Duração (meses)</Label>
                <Input
                  id="durationMonths"
                  type="number"
                  placeholder="Ex: 2"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskLevel">Nível de Risco</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível de risco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="médio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre o contrato..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="nexa" className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar Contrato"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold">{contracts.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-nexa-success" />
            <span className="text-sm text-muted-foreground">Ativos</span>
          </div>
          <p className="text-2xl font-bold">{activeContracts}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Risco Alto</span>
          </div>
          <p className="text-2xl font-bold">{contracts.filter(c => c.risk_level === 'alto').length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Valor Total</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contratos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {contracts.length === 0 
                  ? "Nenhum contrato cadastrado ainda" 
                  : "Nenhum contrato encontrado"}
              </p>
              {contracts.length === 0 && (
                <Button 
                  variant="nexa" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro contrato
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredContracts.map((contract) => (
                <div 
                  key={contract.id} 
                  onClick={() => setSelectedContract(contract)}
                  className={cn(
                    "p-4 hover:bg-secondary/20 transition-colors cursor-pointer",
                    selectedContract?.id === contract.id && "bg-secondary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(contract.status)}
                        <span className="font-mono text-sm text-muted-foreground">
                          #{contract.id.slice(0, 8)}
                        </span>
                      </div>
                      <h4 className="font-semibold truncate">{contract.client_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.start_date} → {contract.end_date || 'N/A'} ({contract.duration_months} meses)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(Number(contract.contract_value))}</p>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getRiskColor(contract.risk_level))}>
                        Risco {contract.risk_level}
                      </span>
                    </div>
                  </div>
                  {contract.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-primary">{contract.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract Details */}
        <div className="rounded-2xl bg-card border border-border p-6">
          {selectedContract ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Detalhes do Contrato</h3>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID do Contrato</p>
                  <p className="font-mono font-medium">#{selectedContract.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedContract.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-2xl font-bold text-gradient">
                    {formatCurrency(Number(selectedContract.contract_value))}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">{selectedContract.start_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Término</p>
                    <p className="font-medium">{selectedContract.end_date || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium">{selectedContract.duration_months} meses</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nível de Risco</p>
                  <span className={cn("px-3 py-1 rounded-full text-sm font-medium", getRiskColor(selectedContract.risk_level))}>
                    {selectedContract.risk_level ? 
                      selectedContract.risk_level.charAt(0).toUpperCase() + selectedContract.risk_level.slice(1) 
                      : 'Não definido'}
                  </span>
                </div>
                {selectedContract.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="text-sm mt-1">{selectedContract.notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <Button variant="nexa" className="w-full">Renovar Contrato</Button>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => handleDelete(selectedContract.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Contrato
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center py-12">
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground">Selecione um contrato para ver os detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}