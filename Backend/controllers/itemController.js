import { sql, pool } from '../../Database/db.js';

export const getItems = async (req, res) => {
    try {
        const { search } = req.query;
        let items;

        if (search) {
            const searchPattern = `%${search}%`;
            
            items = await sql`
                SELECT * FROM item
                WHERE item_name ILIKE ${searchPattern} 
                   OR sku ILIKE ${searchPattern}
                ORDER BY item_name DESC
            `;
        } else {
            items = await sql`
                SELECT * FROM item
                ORDER BY item_name DESC
            `;
        }

        console.log(`Fetched ${items.length} items. Search term:`, search || "None");
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        console.error('Error in getItems function:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createItem = async (req, res) => {
    const { sku, item_name, category, size, item_price, image_url, status } = req.body;

    console.log('Raw request body:', req.body);
    console.log('Destructured values:');
    console.log('  sku:', sku, '(type:', typeof sku, ')');
    console.log('  item_name:', item_name, '(type:', typeof item_name, ')');
    console.log('  category:', category, '(type:', typeof category, ')');
    console.log('  size:', size, '(type:', typeof size, ')');
    console.log('  item_price:', item_price, '(type:', typeof item_price, ')');
    console.log('  image_url:', image_url, '(type:', typeof image_url, ')');
    console.log('  status:', status, '(type:', typeof status, ')');

    // Trim strings and check required fields
    const trimmedSku = typeof sku === 'string' ? sku.trim() : sku;
    const trimmedItemName = typeof item_name === 'string' ? item_name.trim() : item_name;
    const trimmedCategory = typeof category === 'string' ? category.trim() : category;
    const trimmedSize = typeof size === 'string' ? size.trim() : size;
    const trimmedPrice = typeof item_price === 'string' ? item_price.trim() : item_price;

    // Only required fields: sku, item_name, category, size, item_price
    // image_url is optional and can be null
    if (!trimmedSku || !trimmedItemName || !trimmedCategory || !trimmedSize || !trimmedPrice) {
        console.log('Validation failed. Missing fields:');
        if (!trimmedSku) console.log('  - sku is missing');
        if (!trimmedItemName) console.log('  - item_name is missing');
        if (!trimmedCategory) console.log('  - category is missing');
        if (!trimmedSize) console.log('  - size is missing');
        if (!trimmedPrice) console.log('  - item_price is missing');
        return res.status(400).json({ success: false, message: 'SKU, item name, category, size, and price are required' });
    }

    try {
        const newItem = await sql`
            INSERT INTO item (sku, item_name, category, size, item_price, image_url, status)
            VALUES (${trimmedSku}, ${trimmedItemName}, ${trimmedCategory}, ${trimmedSize}, ${trimmedPrice}, ${image_url || null}, ${status || 'continued'})
            RETURNING *
        `;

        res.status(201).json({ success: true, data: newItem[0] });
    } catch (error) {
        console.error('Error in createItem function:', error);
        
        // Handle recipe constraint violation
        if (error.message && error.message.includes('without an associated recipe')) {
            return res.status(409).json({
                success: false,
                message: 'Cannot set item status to "continued" without an associated recipe. Please add recipes to this item first or use a different status (discontinued/hold).',
                code: 'RECIPE_REQUIRED'
            });
        }
        
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getItem = async (req, res) => {
    const { sku } = req.params;

    try {
        const item = await sql`
            SELECT * FROM item
            WHERE sku = ${sku}
        `;

        res.status(200).json({ success: true, data: item[0] });
    } catch (error) {
        console.error('Error in getItem function:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateItem = async (req, res) => {
    const { sku: currentSku } = req.params;
    console.log('update request',req.body);
    const { sku: newSku, item_name, category, size, item_price, image_url, status } = req.body;

    try {
        const updatedItem = await sql`
            UPDATE item
            SET
                sku = COALESCE(${newSku || null}, sku),
                item_name = COALESCE(${item_name || null}, item_name),
                category = COALESCE(${category || null}, category),
                size = COALESCE(${size || null}, size),
                item_price = COALESCE(${item_price || null}, item_price),
                image_url = COALESCE(${image_url || null}, image_url),
                status = COALESCE(${status || null}, status)
            WHERE sku = ${currentSku}
            RETURNING *
        `;

        if (updatedItem.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        console.log('Updated item:', updatedItem);
        res.status(200).json({ success: true, data: updatedItem[0] });
    } catch (error) {
        console.error('Error in updateItem function:', error);
        
        // Handle recipe constraint violation
        if (error.message && error.message.includes('without an associated recipe')) {
            return res.status(409).json({
                success: false,
                message: 'Cannot set item status to "continued" without an associated recipe. Please add recipes to this item first or use a different status (discontinued/hold).',
                code: 'RECIPE_REQUIRED'
            });
        }
        
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteItem = async (req, res) => {
    const { sku } = req.params;
    let client;

    try {
        // Get a client from the pool for transaction handling
        client = await pool.connect();

        // Start transaction
        await client.query('BEGIN');

        try {
            // Fetch item details before deletion
            const itemResult = await client.query(
                'SELECT item_id, sku, item_name, category, size, item_price, image_url, status FROM item WHERE sku = $1',
                [sku]
            );

            if (itemResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ 
                    success: false, 
                    message: `Item with SKU "${sku}" not found` 
                });
            }

            const itemToDelete = itemResult.rows[0];
            const itemId = itemToDelete.item_id;

            // Count recipes before deletion
            const recipeCountResult = await client.query(
                'SELECT COUNT(*) as count FROM recipe WHERE item_id = $1',
                [itemId]
            );
            const deletedRecipesCount = parseInt(recipeCountResult.rows[0].count, 10);

            // Delete item (recipes will be deleted automatically via ON DELETE CASCADE)
            await client.query(
                'DELETE FROM item WHERE item_id = $1',
                [itemId]
            );

            // Commit transaction
            await client.query('COMMIT');

            console.log(`✅ Successfully deleted item "${itemToDelete.item_name}" (SKU: ${sku}) with ${deletedRecipesCount} associated recipe(s)`);
            
            res.status(200).json({ 
                success: true, 
                message: `Item "${itemToDelete.item_name}" and ${deletedRecipesCount} associated recipe(s) deleted successfully`,
                data: itemToDelete,
                recipes_deleted: deletedRecipesCount
            });
        } catch (innerError) {
            // Rollback on any error during deletion
            await client.query('ROLLBACK');
            throw innerError;
        }
    } catch (error) {
        console.error('❌ Error deleting item:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'Database error during deletion. Transaction was rolled back to ensure consistency.',
            error: error.message 
        });
    } finally {
        // Always release the client back to the pool
        if (client) {
            client.release();
        }
    }
};