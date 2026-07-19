import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Key,
  Shield,
  Bell,
  Building2,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { maskTaxId, validateTaxId } from "@/lib/taxId";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";

const tabs = [
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "notifications", label: "Notificações", icon: Bell },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("company");
  const [companyName, setCompanyName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { lookup: lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const lastFetchedRef = useRef<string>("");

  // Auto-fill company info via BrasilAPI when a complete CNPJ is typed
  useEffect(() => {
    const cleaned = taxId.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    if (lastFetchedRef.current === cleaned) return;
    lastFetchedRef.current = cleaned;
    (async () => {
      const result = await lookupCnpj(cleaned, { silent: true });
      if (!result) return;
      setCompanyName(prev => prev || result.nome_fantasia || result.razao_social || "");
      if (result.ddd_telefone_1) {
        setPhone(prev => prev || result.ddd_telefone_1 || "");
      }
      if (result.email) {
        setEmail(prev => prev || result.email || "");
      }
      toast.success("Dados da empresa preenchidos automaticamente!");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxId]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setCompanyName(data.company_name || "");
        setResponsibleName(data.responsible_name || "");
        setEmail(data.email || user.email || "");
        setPhone(data.phone || "");
        setTaxId(data.tax_id ? maskTaxId(data.tax_id) : "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveCompany = async () => {
    if (!user) return;
    let tax_id: string | null = null;
    let tax_id_type: "cpf" | "cnpj" | null = null;
    if (taxId.trim()) {
      const v = validateTaxId(taxId);
      if (!v.valid) {
        toast.error("CPF ou CNPJ inválido");
        return;
      }
      tax_id = v.cleaned;
      tax_id_type = v.type;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName,
        responsible_name: responsibleName,
        email,
        phone,
        tax_id,
        tax_id_type,
      })
      .eq("user_id", user.id);
    
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
  };

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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Configure informações e preferências do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-card border border-border p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "company" && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-6">Informações da Empresa</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input 
                    value={responsibleName} 
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF ou CNPJ</Label>
                  <div className="relative">
                    <Input
                      value={taxId}
                      onChange={(e) => setTaxId(maskTaxId(e.target.value))}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      inputMode="numeric"
                      className="pr-10"
                    />
                    {cnpjLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ao digitar um CNPJ completo, preenchemos os dados via BrasilAPI.
                  </p>
                </div>
                <Button variant="nexa" onClick={handleSaveCompany} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-6">Segurança</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação em dois fatores</p>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline">Ativar</Button>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alterar senha</p>
                    <p className="text-sm text-muted-foreground">Última alteração: desconhecida</p>
                  </div>
                  <Button variant="outline">Alterar</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-6">Notificações</h3>
              <div className="space-y-4">
                {[
                  { title: "Contratos", description: "Alertas sobre contratos próximos do vencimento" },
                  { title: "Relatórios", description: "Resumo semanal por email" },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-primary flex items-center px-1">
                      <div className="h-4 w-4 rounded-full bg-primary-foreground ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
