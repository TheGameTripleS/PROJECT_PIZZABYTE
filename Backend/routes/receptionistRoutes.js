import express from "express";
import {
	approvePendingOrder,
	buyStoreStock,
	getPendingOrdersToday,
	getReceptionistStoreStockLogs,
	getStoreStockIngredients,
	loginReceptionist,
} from "../controllers/receptionistController.js";

const router = express.Router();

// POST /api/receptionist/login
router.post("/login", loginReceptionist);
router.get("/store-stock/ingredients", getStoreStockIngredients);
router.get("/store-stock/logs/:staffId", getReceptionistStoreStockLogs);
router.post("/store-stock/purchase", buyStoreStock);
router.get("/orders/today/pending", getPendingOrdersToday);
router.post("/orders/:orderId/approve", approvePendingOrder);

export default router;
