import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import TicketList, { type Ticket } from "@/components/support/TicketList";
import ChatArea, { type Message } from "@/components/support/ChatArea";
import NewTicketDialog from "@/components/support/NewTicketDialog";

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar tickets", description: error.message, variant: "destructive" });
      return;
    }

    // Fetch last message for each ticket
    const ticketsWithMessages = await Promise.all(
      (data || []).map(async (ticket: any) => {
        const { data: msgs } = await supabase
          .from("support_messages")
          .select("message")
          .eq("ticket_id", ticket.id)
          .order("created_at", { ascending: false })
          .limit(1);
        return { ...ticket, last_message: msgs?.[0]?.message || "" };
      })
    );

    setTickets(ticketsWithMessages);
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) return;
    setMessages((data || []) as Message[]);
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);

      // Realtime subscription for messages
      const channel = supabase
        .channel(`messages-${selectedTicket.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${selectedTicket.id}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket?.id]);

  const handleCreateTicket = async (subject: string, message: string, priority: string) => {
    if (!user) return;
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject, priority })
      .select()
      .single();

    if (error || !ticket) {
      toast({ title: "Erro ao criar ticket", description: error?.message, variant: "destructive" });
      return;
    }

    await supabase.from("support_messages").insert({
      ticket_id: (ticket as any).id,
      user_id: user.id,
      sender: "client",
      message,
    });

    toast({ title: "Ticket criado com sucesso!" });
    fetchTickets();
    setSelectedTicket(ticket as Ticket);
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !selectedTicket) return;
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      sender: "support",
      message: text,
    });

    if (error) {
      toast({ title: "Erro ao enviar mensagem", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Atendimento</h1>
          <p className="text-muted-foreground mt-1">Sistema de tickets integrado</p>
        </div>
        <NewTicketDialog onCreateTicket={handleCreateTicket} />
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden h-[calc(100vh-220px)] flex">
        <TicketList
          tickets={tickets}
          selectedTicketId={selectedTicket?.id || null}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectTicket={(t) => setSelectedTicket(t)}
        />
        <ChatArea
          ticket={selectedTicket}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
