import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground text-lg">
            Última atualização: Janeiro de 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground">
              A NexaScore coleta informações que você nos fornece diretamente, incluindo:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Informações de cadastro (nome, email, telefone)</li>
              <li>Dados da empresa (razão social, CNPJ)</li>
              <li>Informações de contratos e clientes</li>
              <li>Dados financeiros para análise</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Gerar relatórios e análises personalizadas</li>
              <li>Enviar comunicações sobre atualizações e novidades</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provedores de serviços que nos auxiliam na operação</li>
              <li>Parceiros de pagamento para processamento de transações</li>
              <li>Autoridades legais quando exigido por lei</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Segurança dos Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, 
              incluindo criptografia de dados, backups automáticos e controle de acesso rigoroso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Seus Direitos</h2>
            <p className="text-muted-foreground">
              Conforme a LGPD, você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre esta política ou para exercer seus direitos, entre em contato:
            </p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:privacidade@nexascore.com" className="text-primary hover:underline">privacidade@nexascore.com</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Nexa Tecnologia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
