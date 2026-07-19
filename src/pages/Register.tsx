import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Building2, User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, IdCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { maskTaxId, validateTaxId } from "@/lib/taxId";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";

export default function Register() {
  const [companyName, setCompanyName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const { lookup: lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const lastFetchedRef = useRef<string>("");

  // Auto-fill via BrasilAPI when a complete CNPJ (14 digits) is entered
  useEffect(() => {
    const cleaned = taxId.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    if (lastFetchedRef.current === cleaned) return;
    lastFetchedRef.current = cleaned;
    (async () => {
      const result = await lookupCnpj(cleaned, { silent: true });
      if (!result) return;
      if (!companyName) setCompanyName(result.nome_fantasia || result.razao_social || "");
      if (!email && result.email) setEmail(result.email);
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxId]);

  const passwordStrength = () => {
    if (password.length === 0) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const tax = validateTaxId(taxId);
    if (!tax.valid) {
      toast.error("CPF ou CNPJ inválido");
      return;
    }
    setIsLoading(true);
    
    const { error } = await signUp(email, password, {
      company_name: companyName,
      responsible_name: responsibleName,
      tax_id: tax.cleaned,
      tax_id_type: tax.type!,
    });
    
    setIsLoading(false);
    
    if (error) {
      toast.error(error.message || "Erro ao criar conta");
      return;
    }
    
    toast.success("Conta criada com sucesso!");
    navigate("/dashboard/plans");
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    
    if (error) {
      toast.error(error.message || "Erro ao cadastrar com Google");
    }
  };

  const features = [
    "Dashboard completo em tempo real",
    "Gestão de clientes e contratos",
    "Análise financeira inteligente",
    "Sistema de tickets integrado",
    "Relatórios personalizados",
    "Suporte 24/7",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6 animate-fade-in py-8">
          <Link to="/" className="inline-block">
            <Logo size="md" />
          </Link>

          <div>
            <h2 className="text-2xl lg:text-3xl font-bold">Crie sua conta</h2>
            <p className="mt-2 text-muted-foreground">
              Comece a gerenciar sua empresa com inteligência
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Sua Empresa Ltda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleName">Nome do Responsável</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="responsibleName"
                  type="text"
                  placeholder="João Silva"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">CPF ou CNPJ</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="taxId"
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={taxId}
                  onChange={(e) => setTaxId(maskTaxId(e.target.value))}
                  className="pl-10 pr-10"
                  inputMode="numeric"
                  required
                />
                {cnpjLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Digite um CNPJ completo (14 dígitos) e preencheremos o resto automaticamente via BrasilAPI.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@suaempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength() >= level
                            ? level <= 2
                              ? "bg-destructive"
                              : level === 3
                              ? "bg-nexa-warning"
                              : "bg-nexa-success"
                            : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength() <= 2 ? "Senha fraca" : passwordStrength() === 3 ? "Senha média" : "Senha forte"}
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" variant="nexa" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">ou continue com</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Cadastrar com Google
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">Termos de Serviço</a>
            {" "}e{" "}
            <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-nexa-darker">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Tudo que você precisa para
            <span className="text-gradient"> gerenciar sua empresa</span>
          </h2>

          <div className="mt-12 space-y-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/30 animate-slide-in-left"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl glass">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-nexa-gradient flex items-center justify-center text-xl font-bold text-primary-foreground">
                N
              </div>
              <div>
                <p className="font-semibold">Nexa Tecnologia</p>
                <p className="text-sm text-muted-foreground">Confiado por +500 empresas</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              "O NexaScore transformou a forma como gerenciamos nossa empresa. 
              Interface intuitiva e recursos poderosos."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
