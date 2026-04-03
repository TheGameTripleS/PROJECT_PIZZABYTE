import express from "express";
import { loginReceptionist } from "../controllers/receptionistController.js";

const router = express.Router();

// POST /api/receptionist/login
router.post("/login", loginReceptionist);

export default router;
