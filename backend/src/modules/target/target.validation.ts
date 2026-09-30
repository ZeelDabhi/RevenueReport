export type TargetInput = {
  unitCode: string;
  targetLakhs: number;
};


// ======================================================
// VALID UNIT CODES
// ======================================================

const VALID_UNITS = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
] as const;


// ======================================================
// YEAR VALIDATION
// ======================================================

export function validateTargetYear(
  value: unknown
): number {

  const year =
    Number(
      value
    );


  if (
    !Number.isInteger(
      year
    ) ||
    year < 2000 ||
    year > 2100
  ) {

    throw new Error(
      "Valid year is required"
    );

  }


  return year;

}


// ======================================================
// MONTH VALIDATION
// ======================================================

export function validateTargetMonth(
  value: unknown
): number {

  const month =
    Number(
      value
    );


  if (
    !Number.isInteger(
      month
    ) ||
    month < 1 ||
    month > 12
  ) {

    throw new Error(
      "Month must be between 1 and 12"
    );

  }


  return month;

}


// ======================================================
// TARGET LIST VALIDATION
// ======================================================

export function validateTargets(
  value: unknown
): TargetInput[] {

  if (
    !Array.isArray(
      value
    )
  ) {

    throw new Error(
      "targets array is required"
    );

  }


  if (
    value.length !== 7
  ) {

    throw new Error(
      "Targets for all 7 units are required"
    );

  }


  const result: TargetInput[] =
    value.map(
      (
        item: any
      ) => {

        const unitCode =
          String(
            item?.unitCode ??
            ""
          )
            .trim()
            .toUpperCase();


        if (
          !VALID_UNITS.includes(
            unitCode as
              (
                typeof VALID_UNITS
              )[number]
          )
        ) {

          throw new Error(
            `Invalid unitCode: ${unitCode}`
          );

        }


        const targetLakhs =
          Number(
            item?.targetLakhs
          );


        if (
          !Number.isFinite(
            targetLakhs
          ) ||
          targetLakhs < 0
        ) {

          throw new Error(
            `Invalid target for unit ${unitCode}`
          );

        }


        return {

          unitCode,

          targetLakhs,

        };

      }
    );


  // ====================================================
  // DUPLICATE UNIT CHECK
  // ====================================================

  const uniqueUnits =
    new Set(
      result.map(
        (
          item
        ) =>
          item.unitCode
      )
    );


  if (
    uniqueUnits.size !== 7
  ) {

    throw new Error(
      "Duplicate unitCode found in targets"
    );

  }


  // ====================================================
  // ENSURE ALL 7 REQUIRED UNITS EXIST
  // ====================================================

  const missingUnits =
    VALID_UNITS.filter(
      (
        unitCode
      ) =>
        !uniqueUnits.has(
          unitCode
        )
    );


  if (
    missingUnits.length > 0
  ) {

    throw new Error(
      `Missing target for unit(s): ${missingUnits.join(
        ", "
      )}`
    );

  }


  return result;

}