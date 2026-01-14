-- Enable realtime for prompts table so user dashboard updates automatically
ALTER PUBLICATION supabase_realtime ADD TABLE public.prompts;