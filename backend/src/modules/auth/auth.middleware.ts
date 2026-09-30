import type {
  NextFunction,
  Response,
} from "express";

import {
  prisma,
} from "../../config/database.ts";

import {
  verifyAuthToken,
} from "./auth.service.ts";

import type {
  AppUserRole,
  AuthenticatedRequest,
} from "./auth.types.ts";


// ======================================================
// AUTHENTICATION
//
// Every protected request must use JWT authentication.
// No localhost / development Super Admin bypass.
//
// User identity is based on the signed userId.
// Current username, role, unit and active status are
// always reloaded from the database.
//
// Because username is editable, an old JWT username
// does NOT invalidate the session by itself.
// ======================================================

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {

  try {

    // ==================================================
    // AUTHORIZATION HEADER
    // ==================================================

    const authorization =
      String(
        req.headers.authorization ??
        ""
      ).trim();


    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {

      return res
        .status(401)
        .json({

          success:
            false,

          message:
            "Authentication token is required",

        });

    }


    // ==================================================
    // TOKEN
    // ==================================================

    const token =
      authorization
        .substring(7)
        .trim();


    if (
      !token
    ) {

      return res
        .status(401)
        .json({

          success:
            false,

          message:
            "Authentication token is required",

        });

    }


    // ==================================================
    // VERIFY JWT
    // ==================================================

    const tokenUser =
      verifyAuthToken(
        token
      );


    // ==================================================
    // CURRENT DATABASE USER
    // ==================================================

    const currentUser =
      await prisma.user.findUnique({

        where: {

          id:
            tokenUser.userId,

        },

        select: {

          id:
            true,

          username:
            true,

          role:
            true,

          unitId:
            true,

          isActive:
            true,

        },

      });


    // ==================================================
    // USER EXISTS + ACTIVE
    // ==================================================

    if (
      !currentUser ||
      !currentUser.isActive
    ) {

      return res
        .status(401)
        .json({

          success:
            false,

          message:
            "User account is inactive or unavailable",

        });

    }


    // ==================================================
    // INCHARGE DIRECTOR MUST HAVE UNIT
    // ==================================================

    if (
      currentUser.role ===
        "INCHARGE_DIRECTOR" &&
      currentUser.unitId ===
        null
    ) {

      return res
        .status(403)
        .json({

          success:
            false,

          message:
            "No unit is assigned to this Incharge Director",

        });

    }


    // ==================================================
    // SET CURRENT AUTH USER
    //
    // IMPORTANT:
    // Current username / role / unit come from database.
    // ==================================================

    req.authUser = {

      userId:
        currentUser.id,

      username:
        currentUser.username,

      role:
        currentUser.role as AppUserRole,

      unitId:
        currentUser.unitId,

    };


    return next();

  }
  catch {

    return res
      .status(401)
      .json({

        success:
          false,

        message:
          "Invalid or expired authentication token",

      });

  }

}


// ======================================================
// ROLE AUTHORIZATION
// ======================================================

export function requireRoles(
  ...roles: AppUserRole[]
) {

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {

    const user =
      req.authUser;


    // ==================================================
    // AUTH REQUIRED
    // ==================================================

    if (
      !user
    ) {

      return res
        .status(401)
        .json({

          success:
            false,

          message:
            "Authentication required",

        });

    }


    // ==================================================
    // ROLE CHECK
    // ==================================================

    if (
      !roles.includes(
        user.role
      )
    ) {

      return res
        .status(403)
        .json({

          success:
            false,

          message:
            "You do not have permission to perform this action",

        });

    }


    return next();

  };

}
