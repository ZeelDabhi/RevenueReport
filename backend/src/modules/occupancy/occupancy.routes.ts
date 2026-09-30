import {
  Router,
} from "express";

import {
  requireRoles,
} from "../auth/auth.middleware.ts";

import {
  getDailyOccupancy,
  saveManualOccupancy,
} from "./occupancy.controller.ts";


const router =
  Router();


// ======================================================
// OCCUPANCY ACCESS
//
// All logged-in roles currently retain the same
// Occupancy access as before.
// ======================================================

const occupancyRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "HO_USER",
] as const;


// ======================================================
// SAVE MANUAL BED OCCUPANCY
//
// POST:
// /api/v1/revenue/occupancy/manual
//
// JSON:
// {
//   "occupancyDate": "2026-09-22",
//   "occupancies": [
//     { "unitCode": "MB", "occupancyCount": 120 },
//     { "unitCode": "OS", "occupancyCount": 95 },
//     { "unitCode": "SV", "occupancyCount": 80 },
//     { "unitCode": "MS", "occupancyCount": 100 },
//     { "unitCode": "BJ", "occupancyCount": 58 },
//     { "unitCode": "JN", "occupancyCount": 90 },
//     { "unitCode": "SM", "occupancyCount": 65 }
//   ]
// }
// ======================================================

router.post(
  "/occupancy/manual",

  requireRoles(
    ...occupancyRoles
  ),

  saveManualOccupancy
);


// ======================================================
// GET DAILY BED OCCUPANCY
//
// GET:
// /api/v1/revenue/occupancy?date=2026-09-22
// ======================================================

router.get(
  "/occupancy",

  requireRoles(
    ...occupancyRoles
  ),

  getDailyOccupancy
);


export default router;
