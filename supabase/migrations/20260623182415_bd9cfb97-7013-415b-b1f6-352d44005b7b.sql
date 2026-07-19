
-- 1) bank_imports: missing UPDATE policy
CREATE POLICY "Users can update their own bank imports"
ON public.bank_imports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) support_messages: missing UPDATE and DELETE policies
CREATE POLICY "Users can update their own support messages"
ON public.support_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own support messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3) realtime.messages: restrict channel subscriptions to authorized users.
-- The app subscribes to channel topics of the form 'messages-<ticket_id>'.
-- Only allow access when the ticket belongs to the authenticated user.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own ticket realtime channels" ON realtime.messages;

CREATE POLICY "Users can access their own ticket realtime channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_tickets st
    WHERE st.user_id = auth.uid()
      AND realtime.topic() = 'messages-' || st.id::text
  )
);
