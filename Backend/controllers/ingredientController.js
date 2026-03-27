import { sql } from '../../Database/db.js';

const ALLOWED_MEASUREMENTS = ['g', 'ml'];

export const getIngredients = async (_req, res) => {
  try {
    const ingredients = await sql`
      SELECT ing_id, ing_name, weight, meas, ing_price
      FROM ingredients
      ORDER BY ing_id DESC
    `;

    res.status(200).json({ success: true, data: ingredients });
  } catch (error) {
    console.error('Error in getIngredients function:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createIngredient = async (req, res) => {
  const { ing_name, weight, meas, ing_price } = req.body;

  if (!ing_name || weight === undefined || weight === null || !meas || ing_price === undefined || ing_price === null) {
    return res.status(400).json({
      success: false,
      message: 'ing_name, weight, meas and ing_price are required',
    });
  }

  const normalizedMeasurement = String(meas).toLowerCase();
  if (!ALLOWED_MEASUREMENTS.includes(normalizedMeasurement)) {
    return res.status(400).json({
      success: false,
      message: 'meas must be one of: g, ml',
    });
  }

  try {
    const created = await sql`
      INSERT INTO ingredients (ing_name, weight, meas, ing_price)
      VALUES (${ing_name}, ${weight}, ${normalizedMeasurement}, ${ing_price})
      RETURNING ing_id, ing_name, weight, meas, ing_price
    `;

    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('Error in createIngredient function:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteIngredient = async (req, res) => {
  const { ingId } = req.params;

  try {
    const deleted = await sql`
      DELETE FROM ingredients
      WHERE ing_id = ${ingId}
      RETURNING ing_id, ing_name, weight, meas, ing_price
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    res.status(200).json({ success: true, data: deleted[0] });
  } catch (error) {
    console.error('Error in deleteIngredient function:', error);

    if (error?.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete ingredient because it is referenced in recipe or stock records',
      });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
