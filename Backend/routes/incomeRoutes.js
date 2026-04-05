import express from 'express';
import { getDailyIncome, getProfitSummary } from '../controllers/incomeController.js';

const router = express.Router();

router.get('/profit-summary', getProfitSummary);
router.get('/', getDailyIncome);

export default router;
