import { Router } from "express";
import { getMe, login, register } from "../controller/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const authRoute = Router();

authRoute.post("/register", register);
authRoute.post("/login", login);
authRoute.get("/me", requireAuth, getMe);

export default authRoute;
