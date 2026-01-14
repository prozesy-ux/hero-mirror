-- Allow admins to delete support messages older than 1 day
CREATE POLICY "Admins can delete old messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_at < NOW() - INTERVAL '1 day'
);