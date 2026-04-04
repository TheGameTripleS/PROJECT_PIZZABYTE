CREATE OR REPLACE FUNCTION deduct_stock_on_order_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_chef_rota_id INT;
BEGIN
    IF LOWER(COALESCE(NEW.status, '')) NOT IN ('processing', 'completed') THEN
        RETURN NEW;
    END IF;

    IF LOWER(COALESCE(OLD.status, '')) IN ('processing', 'completed') THEN
        RETURN NEW;
    END IF;

    SELECT rota.rota_id
    INTO v_chef_rota_id
    FROM rota
    JOIN staff ON staff.staff_id = rota.staff_id
    WHERE staff.position = 'Chef'
      AND CURRENT_TIMESTAMP >= rota.start_time
      AND CURRENT_TIMESTAMP <= rota.end_time
    ORDER BY rota.start_time ASC, rota.rota_id ASC
    LIMIT 1;

    IF v_chef_rota_id IS NULL THEN
        RAISE EXCEPTION 'No chef is currently on duty';
    END IF;

    INSERT INTO stock_log (ing_id, rota_id, change_amount, created_at)
    SELECT
        recipe.ing_id,
        v_chef_rota_id,
        -SUM(recipe.ing_amount * order_items.item_quantity)::INT,
        CURRENT_TIMESTAMP
    FROM order_items
    JOIN recipe ON recipe.item_id = order_items.item_id
    WHERE order_items.order_id = NEW.order_id
    GROUP BY recipe.ing_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_stock_deduction_trigger ON orders;

CREATE TRIGGER order_stock_deduction_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_stock_on_order_activation();
