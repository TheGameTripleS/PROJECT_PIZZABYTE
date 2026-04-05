import express from 'express';
import {
	createStaff,
	deleteStaff,
	getReceptionists,
	getStaff,
	getStaffRelations,
	getStaffRota,
	assignReceptionistRota,
	setReceptionistPassword,
	updateStaff,
} from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getStaff);
router.get('/receptionists', getReceptionists);
router.post('/receptionists/:staffId/password', setReceptionistPassword);
router.post('/receptionists/:staffId/rota', assignReceptionistRota);
router.get('/:staffId/relations', getStaffRelations);
router.get('/:staffId/rota', getStaffRota);
router.post('/', createStaff);
router.put('/:staffId', updateStaff);
router.delete('/:staffId', deleteStaff);

export default router;