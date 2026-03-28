import express from 'express';
import { createIngredient, deleteIngredient, getIngredients } from '../controllers/ingredientController.js';

const router = express.Router();

router.get('/', getIngredients);
router.post('/', createIngredient);
router.delete('/:ingId', deleteIngredient);

export default router;