-- Add chat_allowed column to ai_accounts table
ALTER TABLE ai_accounts 
ADD COLUMN chat_allowed boolean DEFAULT true;