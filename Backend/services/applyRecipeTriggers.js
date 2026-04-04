import { pool } from '../../Database/db.js';

async function applyRecipeTriggers() {
    let client;
    try {
        console.log('📋 Applying recipe management triggers...\n');

        client = await pool.connect();

        // Create function: check_recipe_before_continued_status
        await client.query(`
            CREATE OR REPLACE FUNCTION check_recipe_before_continued_status()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.status = 'continued' THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM recipe WHERE item_id = NEW.item_id
                    ) THEN
                        RAISE EXCEPTION 'Cannot set item status to "continued" without an associated recipe';
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log(`✅ Function check_recipe_before_continued_status created`);

        // Drop existing triggers if they exist
        await client.query(`DROP TRIGGER IF EXISTS check_recipe_before_item_insert ON item`);
        await client.query(`DROP TRIGGER IF EXISTS check_recipe_before_item_update ON item`);
        console.log(`✅ Old triggers cleaned up`);

        // Create triggers for item table
        await client.query(`
            CREATE TRIGGER check_recipe_before_item_insert
            BEFORE INSERT ON item
            FOR EACH ROW
            EXECUTE FUNCTION check_recipe_before_continued_status()
        `);
        console.log(`✅ Trigger check_recipe_before_item_insert created`);

        await client.query(`
            CREATE TRIGGER check_recipe_before_item_update
            BEFORE UPDATE ON item
            FOR EACH ROW
            WHEN (NEW.status IS DISTINCT FROM OLD.status)
            EXECUTE FUNCTION check_recipe_before_continued_status()
        `);
        console.log(`✅ Trigger check_recipe_before_item_update created`);

        // Create function: check_recipe_deletion_for_continued_item
        await client.query(`
            CREATE OR REPLACE FUNCTION check_recipe_deletion_for_continued_item()
            RETURNS TRIGGER AS $$
            DECLARE
                recipe_count INT;
                item_status VARCHAR(20);
            BEGIN
                SELECT status INTO item_status FROM item WHERE item_id = OLD.item_id;
                SELECT COUNT(*) INTO recipe_count FROM recipe WHERE item_id = OLD.item_id;
                
                IF recipe_count = 1 AND item_status = 'continued' THEN
                    RAISE EXCEPTION 'Cannot delete the last recipe for an item with "continued" status. Change the item status first.';
                END IF;
                
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log(`✅ Function check_recipe_deletion_for_continued_item created`);

        // Drop and create recipe deletion trigger
        await client.query(`DROP TRIGGER IF EXISTS check_recipe_deletion_for_continued_item ON recipe`);
        await client.query(`
            CREATE TRIGGER check_recipe_deletion_for_continued_item
            BEFORE DELETE ON recipe
            FOR EACH ROW
            EXECUTE FUNCTION check_recipe_deletion_for_continued_item()
        `);
        console.log(`✅ Trigger check_recipe_deletion_for_continued_item created`);

        console.log(`\n✨ Recipe triggers applied successfully!\n`);
        return true;
    } catch (error) {
        console.error('❌ Failed to apply recipe triggers:', error.message);
        return false;
    } finally {
        if (client) {
            await client.release();
        }
    }
}

export default applyRecipeTriggers;
