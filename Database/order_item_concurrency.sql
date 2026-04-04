CREATE OR REPLACE FUNCTION validate_order_item_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_status VARCHAR(30);
    v_item_name VARCHAR(255);
    v_shortage_ingredient_names TEXT;
BEGIN
    SELECT status
    INTO v_order_status
    FROM orders
    WHERE order_id = NEW.order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with ID % not found for order item insert', NEW.order_id;
    END IF;

    SELECT item_name
    INTO v_item_name
    FROM item
    WHERE item_id = NEW.item_id;

    IF v_item_name IS NULL THEN
        RAISE EXCEPTION 'Item with ID % not found', NEW.item_id;
    END IF;

    PERFORM ingredients.ing_id
    FROM ingredients
    JOIN recipe ON recipe.ing_id = ingredients.ing_id
    WHERE recipe.item_id = NEW.item_id
    ORDER BY ingredients.ing_id
    FOR UPDATE OF ingredients;

    WITH required_ingredients AS (
        SELECT
            recipe.ing_id,
            (recipe.ing_amount * NEW.item_quantity)::INT AS required_quantity
        FROM recipe
        WHERE recipe.item_id = NEW.item_id
    ),
    reserved_ingredients AS (
        SELECT
            recipe.ing_id,
            COALESCE(SUM(recipe.ing_amount * order_items.item_quantity), 0)::INT AS reserved_quantity
        FROM order_items
        JOIN orders ON orders.order_id = order_items.order_id
        JOIN recipe ON recipe.item_id = order_items.item_id
        WHERE LOWER(COALESCE(orders.status, '')) = 'pending'
        GROUP BY recipe.ing_id
    ),
    unavailable_ingredients AS (
        SELECT ingredients.ing_name
        FROM required_ingredients
        JOIN ingredients ON ingredients.ing_id = required_ingredients.ing_id
        LEFT JOIN reserved_ingredients
            ON reserved_ingredients.ing_id = required_ingredients.ing_id
        WHERE (
            COALESCE((
                SELECT SUM(stock_log.change_amount)
                FROM stock_log
                WHERE stock_log.ing_id = required_ingredients.ing_id
            ), 0)::INT
            - COALESCE(reserved_ingredients.reserved_quantity, 0)
        ) < required_ingredients.required_quantity
    )
    SELECT STRING_AGG(unavailable_ingredients.ing_name, ', ' ORDER BY unavailable_ingredients.ing_name)
    INTO v_shortage_ingredient_names
    FROM unavailable_ingredients;

    IF v_shortage_ingredient_names IS NOT NULL THEN
        RAISE EXCEPTION
            'Cannot place item "%" right now. Not enough stock for: %',
            v_item_name,
            v_shortage_ingredient_names;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_item_stock_guard_trigger ON order_items;

CREATE TRIGGER order_item_stock_guard_trigger
BEFORE INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION validate_order_item_stock();
