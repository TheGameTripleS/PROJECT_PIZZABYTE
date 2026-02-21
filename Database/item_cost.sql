-- 1. Calculate the unit cost of each item from the recipe
-- 2. Multiply it by the quantity ordered to get the total_cost
WITH ItemUnitCost AS (
    SELECT item_id, SUM(cost_per_ing) AS base_cost
    FROM recipe
    GROUP BY item_id
)
UPDATE order_items oi
SET total_cost = iuc.base_cost * oi.item_quantity
FROM ItemUnitCost iuc
WHERE oi.item_id = iuc.item_id;