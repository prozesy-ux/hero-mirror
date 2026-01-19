-- First, deduplicate existing transaction_ids by keeping only the first occurrence
-- This is needed because there are duplicate transaction_ids in the table
WITH duplicates AS (
  SELECT id, transaction_id,
         ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY created_at) as rn
  FROM wallet_transactions
  WHERE transaction_id IS NOT NULL AND status = 'completed'
)
UPDATE wallet_transactions 
SET transaction_id = NULL 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now create the unique partial index
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_unique_completed 
ON wallet_transactions (transaction_id) 
WHERE status = 'completed' AND transaction_id IS NOT NULL;