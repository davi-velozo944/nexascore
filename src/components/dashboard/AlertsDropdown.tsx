import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  contract_id: string;
  alert_type: string;
  alert_date: string;
  is_read: boolean;
  client_name?: string;
  contract_value?: number;
}

export function AlertsDropdown() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      // Fetch alerts with contract info
      const { data: alertsData, error: alertsError } = await supabase
        .from("contract_alerts")
        .select(`
          id,
          contract_id,
          alert_type,
          alert_date,
          is_read
        `)
        .eq("is_read", false)
        .gte("alert_date", format(addDays(new Date(), -7), "yyyy-MM-dd"))
        .lte("alert_date", format(addDays(new Date(), 30), "yyyy-MM-dd"))
        .order("alert_date", { ascending: true })
        .limit(10);

      if (alertsError) throw alertsError;

      if (alertsData && alertsData.length > 0) {
        // Fetch contract details for each alert
        const contractIds = alertsData.map(a => a.contract_id);
        const { data: contracts } = await supabase
          .from("contracts")
          .select("id, client_name, contract_value")
          .in("id", contractIds);

        const enrichedAlerts = alertsData.map(alert => {
          const contract = contracts?.find(c => c.id === alert.contract_id);
          return {
            ...alert,
            client_name: contract?.client_name,
            contract_value: contract?.contract_value,
          };
        });

        setAlerts(enrichedAlerts);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 300000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from("contract_alerts")
        .update({ is_read: true })
        .eq("id", alertId);
      
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const alertIds = alerts.map(a => a.id);
      await supabase
        .from("contract_alerts")
        .update({ is_read: true })
        .in("id", alertIds);
      
      setAlerts([]);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "expiration":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "expiration_7d":
        return <Clock className="h-4 w-4 text-nexa-warning" />;
      case "expiration_30d":
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertMessage = (alert: Alert) => {
    const daysUntil = Math.ceil(
      (new Date(alert.alert_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntil < 0) {
      return `Contrato expirou há ${Math.abs(daysUntil)} dias`;
    } else if (daysUntil === 0) {
      return "Contrato expira hoje!";
    } else if (daysUntil <= 7) {
      return `Contrato expira em ${daysUntil} dias`;
    } else {
      return `Contrato expira em ${daysUntil} dias`;
    }
  };

  const getAlertColor = (alert: Alert) => {
    const daysUntil = Math.ceil(
      (new Date(alert.alert_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntil <= 0) return "border-l-destructive bg-destructive/5";
    if (daysUntil <= 7) return "border-l-nexa-warning bg-nexa-warning/5";
    return "border-l-primary bg-primary/5";
  };

  const unreadCount = alerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Alertas de Contratos</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-nexa-success" />
              <p className="text-sm">Nenhum alerta pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 hover:bg-secondary/50 cursor-pointer transition-colors border-l-4",
                    getAlertColor(alert)
                  )}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {alert.client_name || "Contrato"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getAlertMessage(alert)}
                      </p>
                      {alert.contract_value && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Valor: R$ {alert.contract_value.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {alerts.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/dashboard/contracts">Ver todos os contratos</a>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
