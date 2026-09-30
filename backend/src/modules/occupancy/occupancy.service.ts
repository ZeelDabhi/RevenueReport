import {
  prisma,
} from "../../config/database.ts";


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
// TYPES
// ======================================================

export interface ManualOccupancyInput {

  unitCode:
    string;

  occupancyCount:
    number;

}


// ======================================================
// SAVE MANUAL OCCUPANCY
//
// One record per Unit + Occupancy Date.
//
// Re-save on the same date:
// Existing record is updated.
//
// CSV is no longer required.
// ======================================================

export async function saveManualOccupancyBatch(
  occupancyDate: Date,
  inputs: ManualOccupancyInput[]
) {

  const unitCodes =
    inputs.map(
      (
        input
      ) =>
        input.unitCode
          .trim()
          .toUpperCase()
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

      select: {

        id:
          true,

        code:
          true,

        name:
          true,

      },

    });


  if (
    units.length !==
    inputs.length
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
      `Active Unit(s) not found in Unit Master: ${missingUnits.join(
        ", "
      )}`
    );

  }


  const savedRecords =
    await prisma.$transaction(

      inputs.map(
        (
          input
        ) => {

          const unitCode =
            input.unitCode
              .trim()
              .toUpperCase();


          const unit =
            units.find(
              (
                item
              ) =>
                item.code ===
                unitCode
            );


          if (
            !unit
          ) {

            throw new Error(
              `Active Unit ${unitCode} not found`
            );

          }


          return prisma
            .dailyOccupancy
            .upsert({

              where: {

                unitId_occupancyDate: {

                  unitId:
                    unit.id,

                  occupancyDate,

                },

              },

              update: {

                occupancyCount:
                  input.occupancyCount,

                // Manual Entry
                sourceFileName:
                  null,

                rawRowCount:
                  0,

              },

              create: {

                unitId:
                  unit.id,

                occupancyDate,

                occupancyCount:
                  input.occupancyCount,

                // Manual Entry
                sourceFileName:
                  null,

                rawRowCount:
                  0,

              },

            });

        }
      )

    );


  const results =
    savedRecords
      .map(
        (
          saved
        ) => {

          const unit =
            units.find(
              (
                item
              ) =>
                item.id ===
                saved.unitId
            );


          if (
            !unit
          ) {

            throw new Error(
              `Unit ID ${saved.unitId} not found while building Occupancy response`
            );

          }


          return {

            id:
              saved.id,

            unitId:
              unit.id,

            unitCode:
              unit.code,

            unitName:
              unit.name,

            occupancyDate:
              saved.occupancyDate,

            occupancyCount:
              saved.occupancyCount,

            available:
              true,

            entryType:
              "MANUAL",

            createdAt:
              saved.createdAt,

            updatedAt:
              saved.updatedAt,

          };

        }
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


  const totalOccupancy =
    results.reduce(
      (
        total,
        item
      ) =>
        total +
        item.occupancyCount,
      0
    );


  return {

    occupancyDate,

    totalUnits:
      results.length,

    savedUnits:
      results.length,

    totalOccupancy,

    units:
      results,

  };

}


// ======================================================
// GET OCCUPANCY BY DATE
//
// Returns all 7 active units.
//
// If a unit has not been saved for the selected date:
// available = false
// occupancyCount = 0
//
// Historical records for inactive units remain stored
// but are not shown.
// ======================================================

export async function getOccupancyByDate(
  occupancyDate: Date
) {

  const [
    activeUnits,
    records,
  ] =
    await Promise.all([

      prisma.unit.findMany({

        where: {
          isActive:
            true,
        },

        select: {

          id:
            true,

          code:
            true,

          name:
            true,

        },

      }),


      prisma.dailyOccupancy.findMany({

        where: {

          occupancyDate,

          unit: {
            isActive:
              true,
          },

        },

        select: {

          id:
            true,

          unitId:
            true,

          occupancyDate:
            true,

          occupancyCount:
            true,

          sourceFileName:
            true,

          rawRowCount:
            true,

          createdAt:
            true,

          updatedAt:
            true,

        },

      }),

    ]);


  const recordMap =
    new Map(
      records.map(
        (
          record
        ) => [
          record.unitId,
          record,
        ]
      )
    );


  const units =
    activeUnits
      .map(
        (
          unit
        ) => {

          const record =
            recordMap.get(
              unit.id
            );


          return {

            id:
              record?.id ??
              null,

            unitId:
              unit.id,

            unitCode:
              unit.code,

            unitName:
              unit.name,

            occupancyDate,

            occupancyCount:
              record?.occupancyCount ??
              0,

            available:
              Boolean(
                record
              ),

            entryType:
              record
                ? (
                    record.sourceFileName
                      ? "CSV"
                      : "MANUAL"
                  )
                : null,

            sourceFileName:
              record?.sourceFileName ??
              null,

            rawRowCount:
              record?.rawRowCount ??
              0,

            createdAt:
              record?.createdAt ??
              null,

            updatedAt:
              record?.updatedAt ??
              null,

          };

        }
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


  const savedUnits =
    units.filter(
      (
        unit
      ) =>
        unit.available
    )
      .length;


  const totalOccupancy =
    units.reduce(
      (
        total,
        unit
      ) =>
        total +
        (
          unit.available
            ? unit.occupancyCount
            : 0
        ),
      0
    );


  return {

    occupancyDate,

    totalUnits:
      units.length,

    savedUnits,

    totalOccupancy,

    complete:
      savedUnits ===
      units.length,

    units,

  };

}
