import express from "express";
import { calculateOrderTotal, createOrder, getCustomerOrders } from "../controllers/orderController.js";

const router = express.Router();

router.post("/calculate-total", calculateOrderTotal);
router.get("/customer/:custId", getCustomerOrders);
router.post("/", createOrder);

export default router;
