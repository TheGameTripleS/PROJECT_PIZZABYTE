DROP ROUTINE IF EXISTS process_checkout(INT, INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB);

CREATE OR REPLACE PROCEDURE process_checkout(
    IN p_cust_id INT,
    IN p_add_id INT,
    IN p_service_type VARCHAR(30),
    IN p_coupon_code VARCHAR(50),
    IN p_payment_method VARCHAR(30),
    IN p_payment_status VARCHAR(30),
    IN p_order_status VARCHAR(30),
    IN p_items JSONB,
    OUT o_order_id INT,
    OUT o_transaction_id INT,
    OUT o_created_at TIMESTAMP,
    OUT o_subtotal NUMERIC(10,2),
    OUT o_discount NUMERIC(10,2),
    OUT o_total NUMERIC(10,2),
    OUT o_coupon_id INT,
    OUT o_coupon_code VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INT;
    v_transaction_id INT;
    v_created_at TIMESTAMP := CURRENT_TIMESTAMP;
    v_receptionist_staff_id INT := NULL;
    v_receptionist_rota_id INT := NULL;
    v_subtotal NUMERIC(10,2) := 0;
    v_discount NUMERIC(10,2) := 0;
    v_total NUMERIC(10,2) := 0;
    v_coupon_id INT := NULL;
    v_coupon_code VARCHAR(50) := NULL;
    v_discount_percent NUMERIC(10,2) := 0;
    v_min_order_amount NUMERIC(10,2) := 0;
    v_missing_item_id INT := NULL;
    v_blocked_item_names TEXT := NULL;
    v_error_message TEXT := NULL;
    v_error_detail TEXT := NULL;
    v_error_hint TEXT := NULL;
BEGIN
    o_order_id := NULL;
    o_transaction_id := NULL;
    o_created_at := NULL;
    o_subtotal := 0;
    o_discount := 0;
    o_total := 0;
    o_coupon_id := NULL;
    o_coupon_code := NULL;

    BEGIN
        IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
            RAISE EXCEPTION 'Items array is required and must not be empty';
        END IF;

        IF p_service_type NOT IN ('dine-in', 'delivery') THEN
            RAISE EXCEPTION 'service_type must be ''dine-in'' or ''delivery''';
        END IF;

        IF p_payment_method NOT IN ('cash', 'card', 'mfs') THEN
            RAISE EXCEPTION 'Payment method must be ''cash'', ''card'', or ''mfs''';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM customers
            WHERE cust_id = p_cust_id
        ) THEN
            RAISE EXCEPTION 'Customer with ID % not found', p_cust_id;
        END IF;

        IF p_service_type = 'delivery' AND p_add_id IS NULL THEN
            RAISE EXCEPTION 'Delivery orders require a valid add_id';
        END IF;

        IF p_add_id IS NOT NULL AND NOT EXISTS (
            SELECT 1
            FROM address
            WHERE add_id = p_add_id
        ) THEN
            RAISE EXCEPTION 'Address with ID % not found', p_add_id;
        END IF;

        SELECT
            rota.staff_id,
            rota.rota_id
        INTO
            v_receptionist_staff_id,
            v_receptionist_rota_id
        FROM rota
        JOIN staff ON staff.staff_id = rota.staff_id
        WHERE staff.position = 'Receptionist'
          AND v_created_at >= rota.start_time
          AND v_created_at <= rota.end_time
        ORDER BY rota.start_time ASC, rota.rota_id ASC
        LIMIT 1;

        IF v_receptionist_staff_id IS NULL OR v_receptionist_rota_id IS NULL THEN
            RAISE EXCEPTION 'We are not available now';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM jsonb_to_recordset(p_items) AS item_data(item_id INT, quantity INT)
            WHERE item_id IS NULL OR quantity IS NULL OR quantity <= 0
        ) THEN
            RAISE EXCEPTION 'Each item must include a valid item_id and quantity';
        END IF;

        WITH normalized_items AS (
            SELECT item_id, SUM(quantity)::INT AS quantity
            FROM jsonb_to_recordset(p_items) AS item_data(item_id INT, quantity INT)
            GROUP BY item_id
        )
        SELECT normalized_items.item_id
        INTO v_missing_item_id
        FROM normalized_items
        LEFT JOIN item ON item.item_id = normalized_items.item_id
        WHERE item.item_id IS NULL
        LIMIT 1;

        IF v_missing_item_id IS NOT NULL THEN
            RAISE EXCEPTION 'Item with ID % not found', v_missing_item_id;
        END IF;

        PERFORM ingredients.ing_id
        FROM ingredients
        JOIN recipe ON recipe.ing_id = ingredients.ing_id
        JOIN (
            SELECT item_id, SUM(quantity)::INT AS quantity
            FROM jsonb_to_recordset(p_items) AS item_data(item_id INT, quantity INT)
            GROUP BY item_id
        ) AS normalized_items ON normalized_items.item_id = recipe.item_id
        ORDER BY ingredients.ing_id
        FOR UPDATE OF ingredients;

        WITH normalized_items AS (
            SELECT item_id, SUM(quantity)::INT AS quantity
            FROM jsonb_to_recordset(p_items) AS item_data(item_id INT, quantity INT)
            GROUP BY item_id
        ),
        required_ingredients AS (
            SELECT
                recipe.ing_id,
                SUM(recipe.ing_amount * normalized_items.quantity)::INT AS required_quantity
            FROM normalized_items
            JOIN recipe ON recipe.item_id = normalized_items.item_id
            GROUP BY recipe.ing_id
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
        available_ingredients AS (
            SELECT
                required_ingredients.ing_id,
                required_ingredients.required_quantity,
                (
                    COALESCE((
                        SELECT SUM(stock_log.change_amount)
                        FROM stock_log
                        WHERE stock_log.ing_id = required_ingredients.ing_id
                    ), 0)::INT
                    - COALESCE(reserved_ingredients.reserved_quantity, 0)
                ) AS available_quantity
            FROM required_ingredients
            LEFT JOIN reserved_ingredients
                ON reserved_ingredients.ing_id = required_ingredients.ing_id
        ),
        insufficient_ingredients AS (
            SELECT ing_id
            FROM available_ingredients
            WHERE available_quantity < required_quantity
        ),
        blocked_items AS (
            SELECT DISTINCT item.item_name
            FROM normalized_items
            JOIN recipe ON recipe.item_id = normalized_items.item_id
            JOIN insufficient_ingredients
                ON insufficient_ingredients.ing_id = recipe.ing_id
            JOIN item ON item.item_id = normalized_items.item_id
        )
        SELECT STRING_AGG(blocked_items.item_name, ', ' ORDER BY blocked_items.item_name)
        INTO v_blocked_item_names
        FROM blocked_items;

        IF v_blocked_item_names IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot place order right now for: %', v_blocked_item_names;
        END IF;

        WITH normalized_items AS (
            SELECT item_id, SUM(quantity)::INT AS quantity
            FROM jsonb_to_recordset(p_items) AS item_data(item_id INT, quantity INT)
            GROUP BY item_id
        )
        SELECT ROUND(COALESCE(SUM(item.item_price * normalized_items.quantity), 0), 2)
        INTO v_subtotal
        FROM normalized_items
        JOIN item ON item.item_id = normalized_items.item_id;

        IF p_coupon_code IS NOT NULL AND BTRIM(p_coupon_code) <> '' THEN
            SELECT
                coupons.coupon_id,
                coupons.code,
                coupons.discount_percent,
                coupons.min_order_amount
            INTO
                v_coupon_id,
                v_coupon_code,
                v_discount_percent,
                v_min_order_amount
            FROM coupons
            WHERE UPPER(coupons.code) = UPPER(BTRIM(p_coupon_code))
              AND coupons.is_active = TRUE
              AND (coupons.start_date IS NULL OR coupons.start_date <= CURRENT_DATE)
              AND (coupons.end_date IS NULL OR coupons.end_date >= CURRENT_DATE)
            LIMIT 1;

            IF v_coupon_id IS NULL THEN
                RAISE EXCEPTION 'Coupon code is invalid or inactive';
            END IF;

            IF v_subtotal < v_min_order_amount THEN
                RAISE EXCEPTION 'This coupon requires a minimum order amount of $%', TO_CHAR(v_min_order_amount, 'FM999999990.00');
            END IF;

            v_discount := ROUND((v_discount_percent * v_min_order_amount / 100.0), 2);
        END IF;

        v_total := ROUND(GREATEST(v_subtotal - v_discount, 0), 2);

        INSERT INTO orders (
            cust_id,
            add_id,
            staff_id,
            rota_id,
            coupon_id,
            created_at,
            status,
            service_type
        )
        VALUES (
            p_cust_id,
            p_add_id,
            v_receptionist_staff_id,
            v_receptionist_rota_id,
            v_coupon_id,
            v_created_at,
            COALESCE(NULLIF(p_order_status, ''), 'pending'),
            p_service_type
        )
        RETURNING orders.order_id, orders.created_at
        INTO v_order_id, v_created_at;

        INSERT INTO order_items (order_id, item_id, item_quantity)
        WITH normalized_items AS (
            SELECT item_id, SUM(quantity)::INT AS quantity
            FROM jsonb_to_recordset(p_items) AS item_data(item_id INT, quantity INT)
            GROUP BY item_id
        )
        SELECT
            v_order_id,
            normalized_items.item_id,
            normalized_items.quantity
        FROM normalized_items
        JOIN item ON item.item_id = normalized_items.item_id;

        INSERT INTO payment (order_id, amount, status, method)
        VALUES (
            v_order_id,
            v_total,
            COALESCE(NULLIF(p_payment_status, ''), 'Paid'),
            p_payment_method
        )
        RETURNING payment.transaction_id
        INTO v_transaction_id;
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS
                v_error_message = MESSAGE_TEXT,
                v_error_detail = PG_EXCEPTION_DETAIL,
                v_error_hint = PG_EXCEPTION_HINT;
    END;

    IF v_error_message IS NOT NULL THEN
        ROLLBACK;

        RAISE EXCEPTION '%', v_error_message
            USING DETAIL = v_error_detail,
                  HINT = v_error_hint;
    END IF;

    o_order_id := v_order_id;
    o_transaction_id := v_transaction_id;
    o_created_at := v_created_at;
    o_subtotal := v_subtotal;
    o_discount := v_discount;
    o_total := v_total;
    o_coupon_id := v_coupon_id;
    o_coupon_code := v_coupon_code;

    COMMIT;
END;
$$;
