import express from 'express';
import { createStaff, deleteStaff, getStaff, updateStaff } from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:staffId', updateStaff);
router.delete('/:staffId', deleteStaff);

export default router;
