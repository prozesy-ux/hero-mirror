
-- Allow users to mark messages as read on their own tickets
CREATE POLICY "Users can mark own messages as read"
ON public.support_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
