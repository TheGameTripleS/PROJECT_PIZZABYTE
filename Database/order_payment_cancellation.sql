CREATE OR REPLACE FUNCTION cancel_payment_on_order_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF LOWER(COALESCE(NEW.status, '')) <> 'cancelled' THEN
        RETURN NEW;
    END IF;

    IF LOWER(COALESCE(OLD.status, '')) = 'cancelled' THEN
        RETURN NEW;
    END IF;

    UPDATE payment
    SET status = 'Cancelled'
    WHERE order_id = NEW.order_id
      AND LOWER(COALESCE(status, '')) <> 'cancelled';

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_payment_cancellation_trigger ON orders;

CREATE TRIGGER order_payment_cancellation_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION cancel_payment_on_order_cancellation();
