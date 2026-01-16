-- Fix overly-permissive RLS policies flagged by the linter on admin_sessions
-- These policies were allowing public access via USING/WITH CHECK (true).

DO $$
BEGIN
  -- Drop the permissive policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_sessions' AND policyname = 'Allow public select admin sessions'
  ) THEN
    EXECUTE 'DROP POLICY "Allow public select admin sessions" ON public.admin_sessions';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_sessions' AND policyname = 'Allow public insert admin sessions'
  ) THEN
    EXECUTE 'DROP POLICY "Allow public insert admin sessions" ON public.admin_sessions';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_sessions' AND policyname = 'Allow public delete admin sessions by token'
  ) THEN
    EXECUTE 'DROP POLICY "Allow public delete admin sessions by token" ON public.admin_sessions';
  END IF;
END $$;