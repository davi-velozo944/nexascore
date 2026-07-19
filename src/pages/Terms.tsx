import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
        <h1 className="text-3xl lg:text-4xl font-bold mb-8">Termos de Uso</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground text-lg">
            Última atualização: Janeiro de 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e usar o NexaScore, você concorda em cumprir estes Termos de Uso e todas as leis 
              e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de 
              usar ou acessar este serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O NexaScore é uma plataforma de gestão empresarial que oferece:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Dashboard de métricas e análises</li>
              <li>Gestão de clientes e contratos</li>
              <li>Controle financeiro</li>
              <li>Relatórios inteligentes com IA</li>
              <li>Sistema de atendimento integrado</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Conta do Usuário</h2>
            <p className="text-muted-foreground">
              Para usar o NexaScore, você deve:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer informações verdadeiras e completas</li>
              <li>Manter a confidencialidade da sua senha</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Planos e Pagamentos</h2>
            <p className="text-muted-foreground">
              Os planos são cobrados mensalmente. O cancelamento pode ser feito a qualquer momento, 
              mas não há reembolso proporcional pelo período não utilizado. Preços podem ser alterados 
              com aviso prévio de 30 dias.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Uso Aceitável</h2>
            <p className="text-muted-foreground">
              Você concorda em não:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Usar o serviço para atividades ilegais</li>
              <li>Tentar acessar dados de outros usuários</li>
              <li>Sobrecarregar ou interferir no funcionamento do sistema</li>
              <li>Revender ou redistribuir o serviço sem autorização</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todo o conteúdo do NexaScore, incluindo textos, gráficos, logos, ícones e software, 
              é propriedade da Nexa Tecnologia e protegido por leis de direitos autorais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              O NexaScore é fornecido "como está". Não garantimos que o serviço será ininterrupto 
              ou livre de erros. Em nenhum caso seremos responsáveis por danos indiretos, incidentais 
              ou consequenciais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Alterações nos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por email ou através do serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Contato</h2>
            <p className="text-muted-foreground">
              Para dúvidas sobre estes termos:
            </p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:suporte@nexascore.com" className="text-primary hover:underline">suporte@nexascore.com</a>
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
