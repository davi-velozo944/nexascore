-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  notes TEXT,
  total_revenue NUMERIC DEFAULT 0,
  contracts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own clients"
ON public.clients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
ON public.clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add client_id to contracts table for relationship
ALTER TABLE public.contracts ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create contract_alerts table for expiration notifications
CREATE TABLE public.contract_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'expiration',
  alert_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for alerts
ALTER TABLE public.contract_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
ON public.contract_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
ON public.contract_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.contract_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON public.contract_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Create function to auto-generate alerts for new contracts
CREATE OR REPLACE FUNCTION public.generate_contract_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Alert 30 days before expiration
  IF NEW.end_date IS NOT NULL THEN
    INSERT INTO public.contract_alerts (user_id, contract_id, alert_type, alert_date)
    VALUES (NEW.user_id, NEW.id, 'expiration_30d', NEW.end_date - INTERVAL '30 days');
    
    -- Alert 7 days before expiration
    INSERT INTO public.contract_alerts (user_id, contract_id, alert_type, alert_date)
    VALUES (NEW.user_id, NEW.id, 'expiration_7d', NEW.end_date - INTERVAL '7 days');
    
    -- Alert on expiration day
    INSERT INTO public.contract_alerts (user_id, contract_id, alert_type, alert_date)
    VALUES (NEW.user_id, NEW.id, 'expiration', NEW.end_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating alerts
CREATE TRIGGER create_contract_alerts
AFTER INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.generate_contract_alerts();