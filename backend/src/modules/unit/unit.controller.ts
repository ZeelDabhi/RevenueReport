import type {
  Request,
  Response,
} from "express";

import {
  prisma,
} from "../../config/database.ts";


// ======================================================
// GET ACTIVE UNITS
//
// GET /api/v1/units
//
// Only units where:
// isActive = true
//
// Future:
// Any inactive unit can be activated from DB
// without changing this API.
// ======================================================

export async function getActiveUnits(
  _req: Request,
  res: Response
) {

  try {

    const units =
      await prisma.unit.findMany({

        where: {

          isActive:
            true,

        },

        orderBy: {

          id:
            "asc",

        },

        select: {

          id:
            true,

          code:
            true,

          name:
            true,

          isActive:
            true,

        },

      });


    return res
      .status(
        200
      )
      .json({

        success:
          true,

        total:
          units.length,

        data:
          units,

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

        message:
          error instanceof Error
            ? error.message
            : "Unable to load active units",

      });

  }

}