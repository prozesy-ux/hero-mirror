-- Add unique partial index to prevent multiple in-progress withdrawals for buyers
-- Uses normalized status comparison (lowercase + trimmed)
-- Excludes 'approved' as it appears to be a final/completed state
CREATE UNIQUE INDEX IF NOT EXISTS buyer_withdrawals_one_in_progress_per_user
ON public.buyer_withdrawals (user_id)
WHERE lower(trim(status)) IN ('pending', 'processing', 'queued', 'in_review', 'awaiting', 'requested');

-- Add unique partial index to prevent multiple in-progress withdrawals for sellers
CREATE UNIQUE INDEX IF NOT EXISTS seller_withdrawals_one_in_progress_per_seller
ON public.seller_withdrawals (seller_id)
WHERE lower(trim(status)) IN ('pending', 'processing', 'queued', 'in_review', 'awaiting', 'requested');