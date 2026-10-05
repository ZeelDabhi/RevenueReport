import {
  Router,
} from "express";

import {
  prisma,
} from "../config/database.ts";

import authRoutes
  from "../modules/auth/auth.routes.ts";

import {
  authenticateToken,
} from "../modules/auth/auth.middleware.ts";

import userRoutes
  from "../modules/user/user.routes.ts";

import revenueRoutes
  from "../modules/revenue/revenue.routes.ts";

import dashboardRoutes
  from "../modules/dashboard/dashboard.routes.ts";

import targetRoutes
  from "../modules/target/target.routes.ts";

import groupTargetRoutes
  from "../modules/group-target/group-target.routes.ts";

import occupancyRoutes
  from "../modules/occupancy/occupancy.routes.ts";

import uploadStatusRoutes
  from "../modules/upload-status/upload-status.routes.ts";

import specialityRoutes
  from "../modules/speciality/speciality.routes.ts";


const router =
  Router();


// ======================================================
// API ROOT
// PUBLIC
// ======================================================

router.get(
  "/",
  (
    _req,
    res
  ) => {

    return res.json({

      success:
        true,

      message:
        "Revenue Report API is working",

    });

  }
);


// ======================================================
// DATABASE HEALTH
// PUBLIC
// ======================================================

router.get(
  "/health",
  async (
    _req,
    res
  ) => {

    try {

      await prisma
        .$queryRaw`
          SELECT 1
        `;


      return res.json({

        success:
          true,

        database:
          "connected",

      });

    }
    catch (
      error
    ) {

      return res
        .status(
          500
        )
        .json({

          success:
            false,

          database:
            "disconnected",

          message:
            error instanceof Error
              ? error.message
              : "Database connection failed",

        });

    }

  }
);


// ======================================================
// AUTH
// PUBLIC
//
// POST /api/v1/auth/login
// GET  /api/v1/auth/me
// ======================================================

router.use(
  "/auth",
  authRoutes
);


// ======================================================
// USER MANAGEMENT
//
// Authentication + role permissions are handled
// inside user.routes.ts.
//
// GET   /api/v1/users
// POST  /api/v1/users
// PATCH /api/v1/users/:id/status
// ======================================================

router.use(
  "/users",
  userRoutes
);


// ======================================================
// PROTECT ALL EXISTING REVENUE APIs
//
// Login is required for all /revenue APIs.
// ======================================================

router.use(
  "/revenue",
  authenticateToken
);


// ======================================================
// REVENUE UPLOAD
// EXISTING
// ======================================================

router.use(
  "/revenue",
  revenueRoutes
);


// ======================================================
// DASHBOARD
// EXISTING
// ======================================================

router.use(
  "/revenue",
  dashboardRoutes
);


// ======================================================
// UNIT-WISE TARGET
// EXISTING
// ======================================================

router.use(
  "/revenue",
  targetRoutes
);


// ======================================================
// GROUP TARGET
// EXISTING
// ======================================================

router.use(
  "/revenue",
  groupTargetRoutes
);


// ======================================================
// DAILY OCCUPANCY
// EXISTING
// ======================================================

router.use(
  "/revenue",
  occupancyRoutes
);


// ======================================================
// DAILY UPLOAD STATUS
// EXISTING
// ======================================================

router.use(
  "/revenue",
  uploadStatusRoutes
);


// ======================================================
// PROTECT SPECIALITY REVENUE APIs
//
// All /speciality APIs require valid JWT login.
// ======================================================

router.use(
  "/speciality",
  authenticateToken
);

router.use(
  "/speciality",
  specialityRoutes
);


export default router;