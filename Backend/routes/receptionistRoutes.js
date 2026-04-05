import express from "express";
import {
	approvePendingOrder,
	assignStaffRotaByReceptionist,
	buyStoreStock,
	getAssignableStaff,
	getPendingOrdersToday,
	getReceptionistStoreStockLogs,
	getStaffRotaForReceptionist,
	getStoreStockIngredients,
	loginReceptionist,
	validateReceptionistToken,
} from "../controllers/receptionistController.js";

const router = express.Router();

// POST /api/receptionist/login
router.post("/login", loginReceptionist);
router.get("/validate", validateReceptionistToken);
router.get("/store-stock/ingredients", getStoreStockIngredients);
router.get("/store-stock/logs/:staffId", getReceptionistStoreStockLogs);
router.post("/store-stock/purchase", buyStoreStock);
router.get("/orders/today/pending", getPendingOrdersToday);
router.post("/orders/:orderId/approve", approvePendingOrder);
router.get("/staff/assignable", getAssignableStaff);
router.get("/staff/:staffId/rota", getStaffRotaForReceptionist);
router.post("/staff/:staffId/rota", assignStaffRotaByReceptionist);

export default router;
