import { Router } from "express";

import {
  saveRevenueTargets,
  getRevenueTargets,
} from "./target.controller.ts";

const router = Router();


// ======================================================
// SAVE / UPDATE TARGETS
//
// POST:
// /api/v1/revenue/targets
// ======================================================

router.post(
  "/targets",
  saveRevenueTargets
);


// ======================================================
// GET TARGETS BY YEAR + MONTH
//
// GET:
// /api/v1/revenue/targets?year=2026&month=9
// ======================================================

router.get(
  "/targets",
  getRevenueTargets
);


// ======================================================
// EXPORT
// ======================================================

export default router;