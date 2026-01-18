-- Add chat_allowed column to seller_products table
ALTER TABLE seller_products 
ADD COLUMN chat_allowed boolean DEFAULT true;