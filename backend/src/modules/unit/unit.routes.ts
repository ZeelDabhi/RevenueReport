import {
  Router,
} from "express";

import {
  getActiveUnits,
} from "./unit.controller.ts";


const router =
  Router();


// ======================================================
// ACTIVE UNIT MASTER
//
// GET /api/v1/units
// ======================================================

router.get(
  "/",
  getActiveUnits
);


export default router;