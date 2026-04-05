CREATE OR REPLACE FUNCTION enforce_rota_business_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.work_date IS NULL OR NEW.start_time IS NULL OR NEW.end_time IS NULL THEN
        RAISE EXCEPTION 'Invalid rota: work_date, start_time and end_time are required';
    END IF;

    IF NEW.start_time::date <> NEW.work_date OR NEW.end_time::date <> NEW.work_date THEN
        RAISE EXCEPTION 'Invalid rota: start and end time must match work_date';
    END IF;

    IF NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION 'Invalid rota: start_time must be earlier than end_time';
    END IF;

    IF NEW.start_time::time < TIME '09:00' OR NEW.end_time::time > TIME '17:00' THEN
        RAISE EXCEPTION 'Invalid rota: staff shift must be between 09:00 and 17:00';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rota_business_hours_trigger ON rota;

CREATE TRIGGER rota_business_hours_trigger
BEFORE INSERT OR UPDATE ON rota
FOR EACH ROW
EXECUTE FUNCTION enforce_rota_business_hours();
