-- 1. Delete the total_discount column from orders
ALTER TABLE orders DROP COLUMN total_discount;

-- 2. Rename total_price to total_cost in order_items
ALTER TABLE order_items RENAME COLUMN total_price TO total_cost;