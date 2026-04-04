CREATE OR REPLACE FUNCTION receptionist_restock(
    p_staff_id INT,
    p_ing_id INT,
    p_quantity INT,
    p_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    log_id INT,
    ing_id INT,
    rota_id INT,
    change_amount INT,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_position VARCHAR(50);
    v_rota_id INT;
BEGIN
    IF p_staff_id IS NULL OR p_ing_id IS NULL OR p_quantity IS NULL THEN
        RAISE EXCEPTION 'staff_id, ing_id and quantity are required';
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'quantity must be greater than zero';
    END IF;

    SELECT s.position
    INTO v_position
    FROM staff s
    WHERE s.staff_id = p_staff_id;

    IF v_position IS NULL THEN
        RAISE EXCEPTION 'staff not found';
    END IF;

    IF LOWER(COALESCE(v_position, '')) <> 'receptionist' THEN
        RAISE EXCEPTION 'only receptionists can restock inventory';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.ing_id = p_ing_id) THEN
        RAISE EXCEPTION 'ingredient not found';
    END IF;

        -- 1) Prefer an active shift for the given timestamp.
        SELECT r.rota_id
        INTO v_rota_id
        FROM rota r
        WHERE r.staff_id = p_staff_id
            AND r.work_date = p_created_at::date
            AND p_created_at >= r.start_time
            AND p_created_at <= r.end_time
        ORDER BY r.start_time DESC
        LIMIT 1;

        -- 2) If not currently inside shift hours, allow any rota assigned for the same day.
        IF v_rota_id IS NULL THEN
                SELECT r.rota_id
                INTO v_rota_id
                FROM rota r
                WHERE r.staff_id = p_staff_id
                    AND r.work_date = p_created_at::date
                ORDER BY r.start_time DESC
                LIMIT 1;
        END IF;

            -- 3) Final fallback: use the latest assigned rota for this receptionist.
            IF v_rota_id IS NULL THEN
                SELECT r.rota_id
                INTO v_rota_id
                FROM rota r
                WHERE r.staff_id = p_staff_id
                ORDER BY r.work_date DESC, r.start_time DESC
                LIMIT 1;
            END IF;

    IF v_rota_id IS NULL THEN
        RAISE EXCEPTION 'no rota found for receptionist staff_id %', p_staff_id;
    END IF;

    RETURN QUERY
    INSERT INTO stock_log (ing_id, rota_id, change_amount, created_at)
    VALUES (p_ing_id, v_rota_id, p_quantity, p_created_at)
    RETURNING stock_log.log_id, stock_log.ing_id, stock_log.rota_id, stock_log.change_amount, stock_log.created_at;
END;
$$;
