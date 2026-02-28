import { sql } from '../../Database/db.js';

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
    console.log('Create item request body:', req.body);

    if (!sku || !item_name || !category || !size || !item_price || !image_url) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const newItem = await sql`
            INSERT INTO item (sku, item_name, category, size, item_price, image_url, status)
            VALUES (${sku}, ${item_name}, ${category}, ${size}, ${item_price}, ${image_url}, ${status})
            RETURNING *
        `;

        console.log('Created item:', newItem);
        res.status(201).json({ success: true, data: newItem[0] });
    } catch (error) {
        console.error('Error in createItem function:', error);
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
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteItem = async (req, res) => {
    const { sku } = req.params;

    try {
        const deletedItem = await sql`
            DELETE FROM item
            WHERE sku = ${sku}
            RETURNING *
        `;
        
        if (deletedItem.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        console.log('Deleted item:', deletedItem);
        res.status(200).json({ success: true, data: deletedItem[0] });
    } catch (error) {
        console.error('Error in deleteItem function:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};