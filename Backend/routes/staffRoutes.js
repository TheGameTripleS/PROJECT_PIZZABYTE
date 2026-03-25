import express from 'express';
import {
	createStaff,
	deleteStaff,
	getStaff,
	getStaffOrders,
	getStaffRelations,
	getStaffRota,
	updateStaff,
} from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getStaff);
router.get('/:staffId/relations', getStaffRelations);
router.get('/:staffId/rota', getStaffRota);
router.get('/:staffId/orders', getStaffOrders);
router.post('/', createStaff);
router.put('/:staffId', updateStaff);
router.delete('/:staffId', deleteStaff);

export default router;
