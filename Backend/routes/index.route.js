import { Router } from "express";
import usersRouter from "./users.route.js";
import captchaRouter from "./captcha.route.js";
import addressRouter from "./address.route.js";
import receptionistRouter from "./receptionistRoutes.js";

const indexRouter = Router();

indexRouter.get("/", (_, res) => {
  res.send("Server Deployed 🥳");
});
indexRouter.use("/users", usersRouter);

indexRouter.use("/verify-recaptcha", captchaRouter);

indexRouter.use("/addresses", addressRouter);

indexRouter.use("/receptionist", receptionistRouter);

export default indexRouter;
