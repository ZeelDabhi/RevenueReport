import {
  Router,
} from "express";

import {
  authenticateToken,
  requireRoles,
} from "../auth/auth.middleware.ts";

import {
  changeOwnPassword,
  changeUserRole,
  createUser,
  deleteUser,
  getUserPasswordStatus,
  listUsers,
  resetUserPassword,
  updateUserDetails,
  updateUserStatus,
} from "./user.controller.ts";


const router =
  Router();


// ======================================================
// ALL USER ROUTES REQUIRE LOGIN
// ======================================================

router.use(
  authenticateToken
);


// ======================================================
// CHANGE OWN PASSWORD
// ======================================================

router.patch(
  "/me/password",
  changeOwnPassword
);


// ======================================================
// LIST USERS
// ======================================================

router.get(
  "/",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR",
    "INCHARGE_DIRECTOR"
  ),
  listUsers
);


// ======================================================
// CREATE USER
// ======================================================

router.post(
  "/",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR"
  ),
  createUser
);


// ======================================================
// PASSWORD STATUS
//
// Allowed:
// SUPER_ADMIN
// MASTER_ADMIN
// ADMIN
// DIRECTOR
//
// Does NOT return passwordHash.
// ======================================================

router.get(
  "/:id/password-status",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR"
  ),
  getUserPasswordStatus
);


// ======================================================
// RESET USER PASSWORD
//
// Allowed:
// SUPER_ADMIN
// MASTER_ADMIN
// ADMIN
// DIRECTOR
//
// Backend generates temporary password.
// Plain password is returned only once.
// Database stores bcrypt hash only.
// ======================================================

router.post(
  "/:id/reset-password",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR"
  ),
  resetUserPassword
);


// ======================================================
// EDIT USER DETAILS
// ======================================================

router.patch(
  "/:id",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR",
    "INCHARGE_DIRECTOR"
  ),
  updateUserDetails
);


// ======================================================
// ACTIVE / INACTIVE
// ======================================================

router.patch(
  "/:id/status",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR"
  ),
  updateUserStatus
);


// ======================================================
// CHANGE ROLE
// ======================================================

router.patch(
  "/:id/role",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR"
  ),
  changeUserRole
);


// ======================================================
// DELETE USER
// ======================================================

router.delete(
  "/:id",
  requireRoles(
    "SUPER_ADMIN",
    "MASTER_ADMIN",
    "ADMIN",
    "DIRECTOR"
  ),
  deleteUser
);


export default router;