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


// ======================================================
// LOGIN
// ======================================================

router.post(
  "/login",
  login
);


// ======================================================
// CURRENT USER
// ======================================================

router.get(
  "/me",
  authenticateToken,
  getMe
);


export default router;
