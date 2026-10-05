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

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {

  try {

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

    const tokenUser =
      verifyAuthToken(
        token
      );

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
