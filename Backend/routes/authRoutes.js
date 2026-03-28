import express from "express";
import { adminLogin } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/admin-login
router.post("/admin-login", adminLogin);

export default router;