import { Router } from "express";
import {
  authToken,
  authUser,
  createUser,
  deleteUser,
  deleteUserAddress,
  getStatistics,
  loginUser,
  logoutUser,
  updateUser,
} from "../controllers/users.controller.js";
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
});

const usersRouter = Router();

usersRouter.get("/auth", authToken, authUser);
usersRouter.get("/stats/get", getStatistics);
usersRouter.post("/login", loginUser);
usersRouter.post("/logout", logoutUser);
usersRouter.put("/update", updateUser);
usersRouter.delete("/address/delete", authToken, deleteUserAddress);
usersRouter.post("/", limiter, createUser);
usersRouter.delete("/:id", deleteUser);

export default usersRouter;
