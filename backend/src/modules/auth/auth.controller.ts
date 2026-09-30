import type {
  Request,
  Response,
} from "express";

import {
  prisma,
} from "../../config/database.ts";

import {
  loginUser,
} from "./auth.service.ts";

import type {
  AuthenticatedRequest,
} from "./auth.types.ts";


// ======================================================
// LOGIN
// ======================================================

export async function login(
  req: Request,
  res: Response
) {

  try {

    const data =
      await loginUser(
        req.body?.username,
        req.body?.password
      );


    return res
      .status(200)
      .json({

        success:
          true,

        data,

      });

  } catch (error) {

    return res
      .status(401)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Login failed",

      });

  }

}


// ======================================================
// CURRENT USER
// ======================================================

export async function getMe(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const userId =
      req.authUser?.userId;


    if (!userId) {

      return res
        .status(401)
        .json({

          success:
            false,

          message:
            "Authentication required",

        });

    }


    const user =
      await prisma.user.findUnique({

        where: {
          id:
            userId,
        },

        select: {

          id:
            true,

          name:
            true,

          username:
            true,

          email:
            true,

          mobile:
            true,

          role:
            true,

          unitId:
            true,

          isActive:
            true,

          lastLoginAt:
            true,

          createdAt:
            true,

          unit: {

            select: {

              id:
                true,

              code:
                true,

              name:
                true,

            },

          },

        },

      });


    if (!user) {

      return res
        .status(404)
        .json({

          success:
            false,

          message:
            "User not found",

        });

    }


    return res
      .status(200)
      .json({

        success:
          true,

        data:
          user,

      });

  } catch (error) {

    return res
      .status(500)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load user",

      });

  }

}