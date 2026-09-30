import {
  prisma,
} from "../../config/database.ts";

import type {
  TargetInput,
} from "./target.validation.ts";


// ======================================================
// ACTIVE UNIT ORDER
// ======================================================

const UNIT_ORDER = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
];


// ======================================================
// SAVE / UPDATE ALL UNIT TARGETS
// ======================================================

export async function saveTargets(
  year: number,
  month: number,
  targets: TargetInput[]
) {

  // ====================================================
  // GET ALL REQUIRED ACTIVE UNITS
  // ====================================================

  const unitCodes =
    targets.map(
      (
        item
      ) =>
        item.unitCode
    );


  const units =
    await prisma.unit.findMany({

      where: {

        code: {

          in:
            unitCodes,

        },

        isActive:
          true,

      },

    });


  // ====================================================
  // CHECK ALL 7 ACTIVE UNITS EXIST
  // ====================================================

  if (
    units.length !==
    targets.length
  ) {

    const foundCodes =
      new Set(
        units.map(
          (
            unit
          ) =>
            unit.code
        )
      );


    const missingUnits =
      unitCodes.filter(
        (
          unitCode
        ) =>
          !foundCodes.has(
            unitCode
          )
      );


    throw new Error(
      `One or more active units not found in database: ${missingUnits.join(
        ", "
      )}`
    );

  }


  // ====================================================
  // SAVE ALL TARGETS IN ONE TRANSACTION
  // ====================================================

  const results =
    await prisma.$transaction(

      async (
        tx
      ) => {

        const savedTargets =
          [];


        for (
          const target
          of targets
        ) {

          const unit =
            units.find(
              (
                item
              ) =>
                item.code ===
                target.unitCode
            );


          if (
            !unit
          ) {

            throw new Error(
              `Active Unit ${target.unitCode} not found`
            );

          }


          // =============================================
          // UPSERT
          //
          // Same Unit + Year + Month
          // => Update existing target
          // =============================================

          const saved =
            await tx
              .revenueTarget
              .upsert({

                where: {

                  unitId_year_month: {

                    unitId:
                      unit.id,

                    year,

                    month,

                  },

                },


                update: {

                  targetLakhs:
                    target.targetLakhs,

                },


                create: {

                  unitId:
                    unit.id,

                  year,

                  month,

                  targetLakhs:
                    target.targetLakhs,

                },

              });


          savedTargets.push({

            id:
              saved.id,

            unitId:
              unit.id,

            unitCode:
              unit.code,

            unitName:
              unit.name,

            year,

            month,

            targetLakhs:
              Number(
                saved.targetLakhs
              ),

          });

        }


        return savedTargets;

      }

    );


  // ====================================================
  // FIXED ACTIVE UNIT ORDER
  // ====================================================

  results.sort(
    (
      a,
      b
    ) =>

      UNIT_ORDER.indexOf(
        a.unitCode
      ) -

      UNIT_ORDER.indexOf(
        b.unitCode
      )
  );


  // ====================================================
  // UNIT TARGET TOTAL
  // ====================================================

  const totalTargetLakhs =
    results.reduce(
      (
        total,
        item
      ) =>
        total +
        item.targetLakhs,

      0
    );


  return {

    year,

    month,

    totalUnits:
      results.length,

    totalTargetLakhs:
      Number(
        totalTargetLakhs.toFixed(
          2
        )
      ),

    targets:
      results,

  };

}


// ======================================================
// GET TARGETS BY YEAR + MONTH
//
// Only active units are returned.
//
// Historical targets for inactive units remain stored
// safely in database but are not returned.
// ======================================================

export async function getTargets(
  year: number,
  month: number
) {

  const records =
    await prisma
      .revenueTarget
      .findMany({

        where: {

          year,

          month,

          unit: {

            isActive:
              true,

          },

        },

        include: {

          unit:
            true,

        },

      });


  const targets =
    records
      .map(
        (
          record
        ) => ({

          id:
            record.id,

          unitId:
            record.unitId,

          unitCode:
            record.unit.code,

          unitName:
            record.unit.name,

          year:
            record.year,

          month:
            record.month,

          targetLakhs:
            Number(
              record.targetLakhs
            ),

        })
      )
      .sort(
        (
          a,
          b
        ) =>

          UNIT_ORDER.indexOf(
            a.unitCode
          ) -

          UNIT_ORDER.indexOf(
            b.unitCode
          )
      );


  const totalTargetLakhs =
    targets.reduce(
      (
        total,
        item
      ) =>
        total +
        item.targetLakhs,

      0
    );


  return {

    year,

    month,

    totalUnits:
      targets.length,

    totalTargetLakhs:
      Number(
        totalTargetLakhs.toFixed(
          2
        )
      ),

    targets,

  };

}