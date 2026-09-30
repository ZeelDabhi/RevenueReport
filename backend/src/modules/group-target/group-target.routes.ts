import {
  Router,
} from "express";

import {
  requireRoles,
} from "../auth/auth.middleware.ts";

import {
  saveGroupRevenueTarget,
  getGroupRevenueTarget,
} from "./group-target.controller.ts";


const router =
  Router();


// ======================================================
// GROUP TARGET VIEW ROLES
// ======================================================

const groupTargetViewRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "HO_USER",
] as const;


// ======================================================
// GROUP TARGET EDIT ROLES
//
// HO_USER cannot add/edit.
// ======================================================

const groupTargetEditRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
] as const;


// ======================================================
// SAVE / UPDATE GROUP TARGET
//
// POST:
// /api/v1/revenue/group-target
// ======================================================

router.post(
  "/group-target",

  requireRoles(
    ...groupTargetEditRoles
  ),

  saveGroupRevenueTarget
);


// ======================================================
// GET GROUP TARGET
//
// GET:
// /api/v1/revenue/group-target?year=2026&month=9
// ======================================================

router.get(
  "/group-target",

  requireRoles(
    ...groupTargetViewRoles
  ),

  getGroupRevenueTarget
);


export default router;