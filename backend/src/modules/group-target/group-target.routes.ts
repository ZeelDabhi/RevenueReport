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

const groupTargetViewRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "HO_USER",
] as const;

const groupTargetEditRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
] as const;

router.post(
  "/group-target",

  requireRoles(
    ...groupTargetEditRoles
  ),

  saveGroupRevenueTarget
);

router.get(
  "/group-target",

  requireRoles(
    ...groupTargetViewRoles
  ),
  getGroupRevenueTarget
);

export default router;