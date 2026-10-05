import {
  Router,
} from "express";

import {
  getMe,
  login,
} from "./auth.controller.ts";

import {
  authenticateToken,
} from "./auth.middleware.ts";

const router =
  Router();


router.post(
  "/login",
  login
);

router.get(
  "/me",
  authenticateToken,
  getMe
);

export default router;
