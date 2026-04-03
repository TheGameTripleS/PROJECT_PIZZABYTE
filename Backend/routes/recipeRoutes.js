import express from 'express';
import {
  getRecipesForItem,
  addRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
} from '../controllers/recipeController.js';

const router = express.Router();

router.get('/item/:itemId', getRecipesForItem);
router.post('/', addRecipeIngredient);
router.put('/:rowId', updateRecipeIngredient);
router.delete('/:rowId', deleteRecipeIngredient);

export default router;
