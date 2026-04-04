import express from "express";
import { calculateOrderTotal, createOrder } from "../controllers/orderController.js";

const router = express.Router();

router.post("/calculate-total", calculateOrderTotal);
router.post("/", createOrder);

export default router;
