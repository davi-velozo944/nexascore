import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, MoreVertical, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ticket } from "./TicketList";

export interface Message {
  id: string;
  sender: string;
  message: string;
  created_at: string;
}

interface ChatAreaProps {
  ticket: Ticket | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "aberto": return "bg-yellow-500";
    case "pendente": return "bg-primary";
    case "resolvido": return "bg-green-500";
    default: return "bg-muted";
  }
};

const getInitials = (subject: string) => {
  return subject.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export default function ChatArea({ ticket, messages, onSendMessage }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Selecione um ticket ou crie um novo</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {getInitials(ticket.subject)}
          </div>
          <div>
            <p className="font-medium">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-full", getStatusColor(ticket.status))} />
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">Nenhuma mensagem ainda. Envie a primeira!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.sender === "support" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[70%] rounded-2xl px-4 py-2",
              msg.sender === "support"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary rounded-bl-md"
            )}>
              <p className="text-sm">{msg.message}</p>
              <div className={cn("flex items-center gap-1 mt-1", msg.sender === "support" ? "justify-end" : "justify-start")}>
                <span className={cn("text-xs", msg.sender === "support" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {formatTime(msg.created_at)}
                </span>
                {msg.sender === "support" && <CheckCheck className="h-3 w-3 text-primary-foreground/70" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          />
          <Button variant="default" size="icon" onClick={handleSend}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
