import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
}

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectTicket: (ticket: Ticket) => void;
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

const getRelativeTime = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export default function TicketList({ tickets, selectedTicketId, searchTerm, onSearchChange, onSelectTicket }: TicketListProps) {
  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-border flex flex-col hidden md:flex">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground text-center">Nenhum ticket encontrado</p>
        )}
        {filtered.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className={cn(
              "p-4 border-b border-border cursor-pointer transition-colors",
              selectedTicketId === ticket.id ? "bg-secondary/50" : "hover:bg-secondary/30"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {getInitials(ticket.subject)}
                </div>
                <div className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card", getStatusColor(ticket.status))} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate text-sm">{ticket.subject}</p>
                  <span className="text-xs text-muted-foreground">{getRelativeTime(ticket.updated_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">{ticket.last_message || "Sem mensagens"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
