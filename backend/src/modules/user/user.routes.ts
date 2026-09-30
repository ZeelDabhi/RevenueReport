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
//
// Any authenticated user can change own password.
// Current password is required.
// ======================================================

router.patch(
  "/me/password",
  changeOwnPassword
);


// ======================================================
// LIST USERS
//
// FULL MANAGEMENT:
// SUPER_ADMIN
// MASTER_ADMIN
// ADMIN
// DIRECTOR
//
// INCHARGE_DIRECTOR:
// Allowed to open Users page,
// but controller returns ONLY:
// - same unit
// - INCHARGE_DIRECTOR role
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
//
// INCHARGE_DIRECTOR NOT ALLOWED
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
// SUPER ADMIN PASSWORD STATUS
//
// Does not return passwordHash.
// Returns only change metadata.
// ======================================================

router.get(
  "/:id/password-status",
  requireRoles(
    "SUPER_ADMIN"
  ),
  getUserPasswordStatus
);


// ======================================================
// SUPER ADMIN RESET PASSWORD
//
// Body:
// {
//   "password": "optional-password"
// }
//
// If password is omitted, backend generates one.
// Temporary password is returned only in this response.
// Database stores only bcrypt hash.
// ======================================================

router.post(
  "/:id/reset-password",
  requireRoles(
    "SUPER_ADMIN"
  ),
  resetUserPassword
);


// ======================================================
// EDIT USER DETAILS
//
// FULL MANAGEMENT:
// Can edit allowed full fields.
//
// Password rule:
// Only SUPER_ADMIN can change password through this route.
//
// INCHARGE_DIRECTOR:
// Can edit same-unit Incharge Directors,
// but controller blocks:
// - Password
// - Role
// - Unit
// - Status
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
//
// INCHARGE_DIRECTOR NOT ALLOWED
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
//
// INCHARGE_DIRECTOR NOT ALLOWED
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
//
// INCHARGE_DIRECTOR NOT ALLOWED
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
