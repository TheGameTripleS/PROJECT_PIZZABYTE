CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id INT)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subtotal NUMERIC(10,2) := 0;
    v_discount NUMERIC(10,2) := 0;
    v_coupon_id INT := NULL;
    v_discount_percent NUMERIC(10,2) := 0;
    v_min_order_amount NUMERIC(10,2) := 0;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM orders
        WHERE order_id = p_order_id
    ) THEN
        RAISE EXCEPTION 'Order with ID % not found', p_order_id;
    END IF;

    SELECT
        ROUND(COALESCE(SUM(item.item_price * order_items.item_quantity), 0), 2)
    INTO v_subtotal
    FROM order_items
    JOIN item ON item.item_id = order_items.item_id
    WHERE order_items.order_id = p_order_id;

    SELECT orders.coupon_id
    INTO v_coupon_id
    FROM orders
    WHERE orders.order_id = p_order_id;

    IF v_coupon_id IS NOT NULL THEN
        SELECT
            coupons.discount_percent,
            coupons.min_order_amount
        INTO
            v_discount_percent,
            v_min_order_amount
        FROM coupons
        WHERE coupons.coupon_id = v_coupon_id;

        IF v_discount_percent IS NOT NULL
           AND v_min_order_amount IS NOT NULL
           AND v_subtotal >= v_min_order_amount THEN
            v_discount := ROUND((v_discount_percent * v_min_order_amount / 100.0), 2);
        END IF;
    END IF;

    RETURN ROUND(GREATEST(v_subtotal - v_discount, 0), 2);
END;
$$;

CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_expected_amount NUMERIC(10,2);
BEGIN
    IF NEW.order_id IS NULL THEN
        RAISE EXCEPTION 'Payment must reference an order';
    END IF;

    IF NEW.amount IS NULL THEN
        RAISE EXCEPTION 'Payment amount is required';
    END IF;

    v_expected_amount := calculate_order_total(NEW.order_id);

    IF ROUND(NEW.amount, 2) <> v_expected_amount THEN
        RAISE EXCEPTION
            'Payment amount must exactly match order total. Expected %, received %',
            TO_CHAR(v_expected_amount, 'FM999999990.00'),
            TO_CHAR(ROUND(NEW.amount, 2), 'FM999999990.00');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_match_safety_trigger ON payment;

CREATE TRIGGER payment_match_safety_trigger
BEFORE INSERT OR UPDATE ON payment
FOR EACH ROW
EXECUTE FUNCTION validate_payment_amount();
