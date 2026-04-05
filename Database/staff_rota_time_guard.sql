CREATE OR REPLACE FUNCTION enforce_rota_business_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    existing_rota_count INT;
BEGIN
    IF NEW.start_time IS NULL OR NEW.end_time IS NULL THEN
        RAISE EXCEPTION 'Invalid rota: start_time and end_time are required';
    END IF;

    NEW.work_date := NEW.start_time::date;

    IF NEW.start_time::date <> NEW.end_time::date THEN
        RAISE EXCEPTION 'Invalid rota: start_time and end_time must be on the same date';
    END IF;

    IF NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION 'Invalid rota: start_time must be earlier than end_time';
    END IF;

    IF NEW.start_time::time < TIME '08:00' OR NEW.end_time::time > TIME '21:00' THEN
        RAISE EXCEPTION 'Invalid rota: staff shift must be between 08:00 and 21:00';
    END IF;

    SELECT COUNT(*) INTO existing_rota_count
    FROM rota
    WHERE staff_id = NEW.staff_id
      AND work_date = NEW.work_date
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time
      AND (TG_OP = 'INSERT' OR rota_id <> NEW.rota_id);

    IF existing_rota_count > 0 THEN
        RAISE EXCEPTION 'Duplicate rota: This staff member already has a rota with the same date and time';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rota_business_hours_trigger ON rota;

CREATE TRIGGER rota_business_hours_trigger
BEFORE INSERT OR UPDATE ON rota
FOR EACH ROW
EXECUTE FUNCTION enforce_rota_business_hours();
