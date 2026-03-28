import express from 'express';
import {
	createStaff,
	deleteStaff,
	getStaff,
	getStaffRelations,
	getStaffRota,
	updateStaff,
} from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getStaff);
router.get('/:staffId/relations', getStaffRelations);
router.get('/:staffId/rota', getStaffRota);
router.post('/', createStaff);
router.put('/:staffId', updateStaff);
router.delete('/:staffId', deleteStaff);

export default router;