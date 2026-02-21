-- Update the cost_per_ing in the recipe table
UPDATE recipe r
SET cost_per_ing = r.ing_amount * i.ing_price
FROM ingredients i
WHERE r.ing_id = i.ing_id;