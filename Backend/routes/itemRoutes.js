import express from 'express';
import { getItems, getItem, createItem, updateItem, deleteItem} from '../controllers/itemController.js';

const router = express.Router();

router.get('/', getItems);
router.get('/:sku', getItem);
router.post('/', createItem);
router.put('/:sku', updateItem);
router.delete('/:sku', deleteItem);

export default router;


