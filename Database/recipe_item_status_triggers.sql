-- ===================================================================
-- Triggers to enforce recipe requirement for item 'continued' status
-- ===================================================================

-- Trigger 1: Prevent item from being set to 'continued' without a recipe
-- Fires on INSERT or UPDATE of item table
CREATE OR REPLACE FUNCTION check_recipe_before_continued_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new status is 'continued'
    IF NEW.status = 'continued' THEN
        -- Check if the item has at least one recipe
        IF NOT EXISTS (
            SELECT 1 FROM recipe WHERE item_id = NEW.item_id
        ) THEN
            RAISE EXCEPTION 'Cannot set item status to "continued" without an associated recipe';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT for item table
DROP TRIGGER IF EXISTS check_recipe_before_item_insert ON item;
CREATE TRIGGER check_recipe_before_item_insert
BEFORE INSERT ON item
FOR EACH ROW
EXECUTE FUNCTION check_recipe_before_continued_status();

-- Create trigger on UPDATE for item table
DROP TRIGGER IF EXISTS check_recipe_before_item_update ON item;
CREATE TRIGGER check_recipe_before_item_update
BEFORE UPDATE ON item
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION check_recipe_before_continued_status();


-- ===================================================================
-- Trigger 2: Prevent deletion of recipe if it's the last recipe 
--            for an item with 'continued' status
-- ===================================================================

CREATE OR REPLACE FUNCTION check_recipe_deletion_for_continued_item()
RETURNS TRIGGER AS $$
DECLARE
    recipe_count INT;
    item_status VARCHAR(20);
BEGIN
    -- Get the item's current status
    SELECT status INTO item_status FROM item WHERE item_id = OLD.item_id;
    
    -- Count remaining recipes for this item after deletion
    SELECT COUNT(*) INTO recipe_count 
    FROM recipe 
    WHERE item_id = OLD.item_id;
    
    -- Check if this is the last recipe and item is in 'continued' status
    IF recipe_count = 1 AND item_status = 'continued' THEN
        RAISE EXCEPTION 'Cannot delete the last recipe for an item with "continued" status. Change the item status first.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on DELETE for recipe table
DROP TRIGGER IF EXISTS check_recipe_deletion_for_continued_item ON recipe;
CREATE TRIGGER check_recipe_deletion_for_continued_item
BEFORE DELETE ON recipe
FOR EACH ROW
EXECUTE FUNCTION check_recipe_deletion_for_continued_item();


-- ===================================================================
-- Trigger 3: Auto-update item status when all recipes are deleted
-- (Optional - logs when an item loses all its recipes)
-- ===================================================================

CREATE OR REPLACE FUNCTION log_recipe_deletion_status()
RETURNS TRIGGER AS $$
DECLARE
    recipe_count INT;
    item_status VARCHAR(20);
BEGIN
    -- Get the item's current status
    SELECT status INTO item_status FROM item WHERE item_id = OLD.item_id;
    
    -- Count remaining recipes for this item after deletion
    SELECT COUNT(*) INTO recipe_count 
    FROM recipe 
    WHERE item_id = OLD.item_id;
    
    -- Log when an item loses all its recipes (if not already 'continued')
    IF recipe_count = 0 AND item_status IS NOT NULL THEN
        -- Optional: You can insert into an audit/log table here
        RAISE NOTICE 'Item ID % now has no recipes. Current status: %', OLD.item_id, item_status;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on DELETE for recipe table (after the main trigger)
DROP TRIGGER IF EXISTS log_recipe_deletion_status ON recipe;
CREATE TRIGGER log_recipe_deletion_status
AFTER DELETE ON recipe
FOR EACH ROW
EXECUTE FUNCTION log_recipe_deletion_status();
