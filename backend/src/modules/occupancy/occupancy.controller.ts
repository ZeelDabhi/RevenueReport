import type {
  Request,
  Response,
} from "express";

import {
  getOccupancyDate,
  REQUIRED_OCCUPANCY_UNITS,
} from "./occupancy.validation.ts";

import {
  getOccupancyByDate,
  saveManualOccupancyBatch,
} from "./occupancy.service.ts";

type ManualOccupancyItem = {

  unitCode?:
    unknown;

  occupancyCount?:
    unknown;

};

function getManualOccupancies(
  value: unknown
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    throw new Error(
      "occupancies must be an array"
    );

  }


  if (
    value.length !==
    REQUIRED_OCCUPANCY_UNITS.length
  ) {

    throw new Error(
      `Occupancy for all ${REQUIRED_OCCUPANCY_UNITS.length} units is required`
    );

  }

  const occupancies =
    value.map(
      (
        item
      ) => {

        const rawItem =
          item as
            ManualOccupancyItem;


        const unitCode =
          String(
            rawItem.unitCode ??
            ""
          )
            .trim()
            .toUpperCase();


        if (
          !REQUIRED_OCCUPANCY_UNITS.includes(
            unitCode as
              (
                typeof REQUIRED_OCCUPANCY_UNITS
              )[number]
          )
        ) {

          throw new Error(
            `Invalid Occupancy Unit Code: ${unitCode || "Blank"}`
          );

        }


        const occupancyCount =
          Number(
            rawItem.occupancyCount
          );


        if (
          !Number.isInteger(
            occupancyCount
          ) ||
          occupancyCount <
            0
        ) {

          throw new Error(
            `Valid whole-number occupancy is required for ${unitCode}`
          );
        }
        return {

          unitCode,

          occupancyCount,
        };
      }
    );

  const uniqueUnits =
    new Set(
      occupancies.map(
        (
          item
        ) =>
          item.unitCode
      )
    );


  if (
    uniqueUnits.size !==
    occupancies.length
  ) {

    throw new Error(
      "Duplicate Occupancy Unit detected"
    );

  }

  const missingUnits =
    REQUIRED_OCCUPANCY_UNITS
      .filter(
        (
          unitCode
        ) =>
          !uniqueUnits.has(
            unitCode
          )
      );


  if (
    missingUnits.length >
    0
  ) {

    throw new Error(
      `Missing Occupancy Unit(s): ${missingUnits.join(
        ", "
      )}`
    );

  }

  return occupancies;
}

export async function saveManualOccupancy(
  req: Request,
  res: Response
) {

  try {

    const occupancyDate =
      getOccupancyDate(
        req.body
          ?.occupancyDate
      );

    const occupancies =
      getManualOccupancies(
        req.body
          ?.occupancies
      );

    const result =
      await saveManualOccupancyBatch(
        occupancyDate,
        occupancies
      );


    return res
      .status(200)
      .json({

        success:
          true,

        message:
          "Bed Occupancy saved successfully",

        data:
          result,

      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to save Bed Occupancy",

      });

  }

}

export async function getDailyOccupancy(
  req: Request,
  res: Response
) {

  try {

    const occupancyDate =
      getOccupancyDate(
        req.query
          .date
      );

    const result =
      await getOccupancyByDate(
        occupancyDate
      );

    return res
      .status(200)
      .json({

        success:
          true,

        data:
          result,
      });
  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to get Occupancy data",
      });
  }
}
