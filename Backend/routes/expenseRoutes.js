import express from 'express';
import { getDailyExpenses } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', getDailyExpenses);

export default router;