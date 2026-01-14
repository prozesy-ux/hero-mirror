-- Fix admin_sessions RLS policies - remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can create admin session" ON public.admin_sessions;
DROP POLICY IF EXISTS "Anyone can view admin sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can manage admin sessions" ON public.admin_sessions;

-- Admin sessions should be managed only via edge function (service role)
-- No public access needed
CREATE POLICY "No public access to admin sessions" ON public.admin_sessions
    FOR SELECT USING (false);

CREATE POLICY "No public insert to admin sessions" ON public.admin_sessions
    FOR INSERT WITH CHECK (false);

CREATE POLICY "No public delete of admin sessions" ON public.admin_sessions
    FOR DELETE USING (false);