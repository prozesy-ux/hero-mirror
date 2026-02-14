
-- Step 1: Create support_tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  ticket_type TEXT DEFAULT 'problem',
  assigned_to TEXT,
  assigned_team TEXT DEFAULT 'Customer Service',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Step 2: Create sequence for ticket numbers
CREATE SEQUENCE public.ticket_number_seq START 1;

-- Step 3: Create trigger function for auto-generating ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'TC-' || LPAD(nextval('public.ticket_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();

-- Step 4: Auto-update updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 5: Add ticket_id to support_messages
ALTER TABLE public.support_messages ADD COLUMN ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL;

-- Step 6: Add ticket_id to seller_support_messages  
ALTER TABLE public.seller_support_messages ADD COLUMN ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL;

-- Step 7: Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies
-- Users can see their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Sellers can see their own tickets
CREATE POLICY "Sellers can view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.is_seller(auth.uid()) AND seller_id IN (
  SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
));

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Sellers can create tickets
CREATE POLICY "Sellers can create tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (public.is_seller(auth.uid()) AND seller_id IN (
  SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
));

-- Users can update own tickets (star, close)
CREATE POLICY "Users can update own tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Sellers can update own tickets
CREATE POLICY "Sellers can update own tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.is_seller(auth.uid()) AND seller_id IN (
  SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
));

-- Step 9: Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- Step 10: Create index for faster lookups
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_seller_id ON public.support_tickets(seller_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX idx_seller_support_messages_ticket_id ON public.seller_support_messages(ticket_id);
