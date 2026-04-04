import { sql } from '../../Database/db.js';

export const getRecipesForItem = async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    return res.status(400).json({
      success: false,
      error: 'itemId is required',
    });
  }

  try {
    const recipes = await sql`
      SELECT 
        r.row_id,
        r.item_id,
        r.ing_id,
        r.ing_amount,
        r.cost_per_ing,
        i.ing_name,
        i.weight,
        i.meas,
        i.ing_price
      FROM recipe r
      JOIN ingredients i ON r.ing_id = i.ing_id
      WHERE r.item_id = ${parseInt(itemId)}
      ORDER BY r.row_id ASC
    `;

    res.status(200).json({ success: true, data: recipes });
  } catch (error) {
    console.error('Error in getRecipesForItem function:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const addRecipeIngredient = async (req, res) => {
  const { item_id, ing_id, ing_amount } = req.body;

  if (!item_id || !ing_id || ing_amount === undefined || ing_amount === null) {
    return res.status(400).json({
      success: false,
      error: 'item_id, ing_id, and ing_amount are required',
    });
  }

  try {
    // Check if item exists
    const itemExists = await sql`
      SELECT item_id FROM item WHERE item_id = ${parseInt(item_id)}
    `;

    if (itemExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    // Check if ingredient exists and get its price/weight for cost calculation
    const ingExists = await sql`
      SELECT ing_id, ing_price, weight FROM ingredients WHERE ing_id = ${parseInt(ing_id)}
    `;

    if (ingExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ingredient not found',
      });
    }

    // Check if this ingredient is already in the recipe
    const recipeExists = await sql`
      SELECT row_id FROM recipe 
      WHERE item_id = ${parseInt(item_id)} AND ing_id = ${parseInt(ing_id)}
    `;

    if (recipeExists.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This ingredient is already in the recipe',
      });
    }

    // Calculate cost_per_ing: (ingredient_price / weight) * amount
    const { ing_price, weight } = ingExists[0];
    const costPerIng = ing_price * ing_amount;

    // Add recipe ingredient with calculated cost
    const created = await sql`
      INSERT INTO recipe (item_id, ing_id, ing_amount, cost_per_ing)
      VALUES (${parseInt(item_id)}, ${parseInt(ing_id)}, ${parseInt(ing_amount)}, ${costPerIng})
      RETURNING row_id, item_id, ing_id, ing_amount, cost_per_ing
    `;

    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('Error in addRecipeIngredient function:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateRecipeIngredient = async (req, res) => {
  const { rowId } = req.params;
  const { ing_amount } = req.body;

  if (!rowId || ing_amount === undefined || ing_amount === null) {
    return res.status(400).json({
      success: false,
      error: 'rowId and ing_amount are required',
    });
  }

  try {
    // Check if recipe exists and get ingredient details
    const recipeExists = await sql`
      SELECT r.row_id, r.ing_id, i.ing_price, i.weight 
      FROM recipe r
      JOIN ingredients i ON r.ing_id = i.ing_id
      WHERE r.row_id = ${parseInt(rowId)}
    `;

    if (recipeExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipe ingredient not found',
      });
    }

    // Calculate new cost_per_ing: (ingredient_price / weight) * new_amount
    const { ing_price, weight } = recipeExists[0];
    const newCostPerIng = ing_price * ing_amount;

    // Update recipe ingredient with calculated cost
    const updated = await sql`
      UPDATE recipe 
      SET ing_amount = ${parseInt(ing_amount)}, cost_per_ing = ${newCostPerIng}
      WHERE row_id = ${parseInt(rowId)}
      RETURNING row_id, item_id, ing_id, ing_amount, cost_per_ing
    `;

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error in updateRecipeIngredient function:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteRecipeIngredient = async (req, res) => {
  const { rowId } = req.params;

  if (!rowId) {
    return res.status(400).json({
      success: false,
      error: 'rowId is required',
    });
  }

  try {
    // Check if recipe exists
    const recipeExists = await sql`
      SELECT row_id, item_id FROM recipe WHERE row_id = ${parseInt(rowId)}
    `;

    if (recipeExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipe ingredient not found',
      });
    }

    // Delete recipe ingredient
    await sql`
      DELETE FROM recipe WHERE row_id = ${parseInt(rowId)}
    `;

    res.status(200).json({
      success: true,
      message: 'Recipe ingredient deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteRecipeIngredient function:', error);
    
    // Handle last recipe constraint violation
    if (error.message && error.message.includes('last recipe')) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete the last recipe for an item with "continued" status. Change the item status to "discontinued" or "hold" first.',
        code: 'LAST_RECIPE_CONSTRAINT'
      });
    }
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
