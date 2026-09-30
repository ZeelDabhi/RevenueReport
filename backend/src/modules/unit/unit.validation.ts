export type UnitCode =
  | "MB"
  | "OS"
  | "SV"
  | "MS"
  | "BJ"
  | "JN"
  | "SM";


// ======================================================
// UNIT IDENTIFIERS
// ======================================================

const UNIT_IDENTIFIERS: Record<UnitCode, string[]> = {

  MB: [
    "MORBI",
  ],

  OS: [
    "OSWAL",
  ],

  SV: [
    "SURENDRANAGAR",
  ],

  MS: [
    "MEHSANA",
  ],

  BJ: [
    "BHUJ",
  ],

  JN: [
    "JUNAGADH",
  ],

  SM: [
    "SAMARPAN",
  ],

};


// ======================================================
// VALID UNIT LIST
// ======================================================

const VALID_UNITS: UnitCode[] = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
];


// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(
  value: string
): string {

  return value
    .toUpperCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();

}


// ======================================================
// CHECK SHORT UNIT CODE IN FILE NAME
//
// Example:
//
// MB_report.csv
// report_MB.csv
// report-OS-123.csv
// ======================================================

function containsUnitCode(
  text: string,
  code: UnitCode
): boolean {

  const regex =
    new RegExp(
      `(^|[^A-Z0-9])${code}([^A-Z0-9]|$)`,
      "i"
    );


  return regex.test(
    text
  );

}


// ======================================================
// CHECK WHETHER FILE LOOKS LIKE
// HIMS REVENUE CSV
//
// Required columns:
//
// Revenue On
// Total Net Amount
//
// This fallback is used only when
// unit identity is not present in file.
// ======================================================

function isRevenueCsv(
  fileBuffer: Buffer
): boolean {

  if (
    !fileBuffer ||
    fileBuffer.length === 0
  ) {

    return false;

  }


  const fileContent =
    normalizeText(
      fileBuffer.toString(
        "utf8"
      )
    );


  const hasRevenueOn =
    fileContent.includes(
      "REVENUE ON"
    );


  const hasTotalNetAmount =
    fileContent.includes(
      "TOTAL NET AMOUNT"
    );


  return (
    hasRevenueOn &&
    hasTotalNetAmount
  );

}


// ======================================================
// DETECT UNIT FROM FILE
// ======================================================

export function detectUnitFromFile(
  fileName: string,
  fileBuffer: Buffer
): UnitCode | null {

  const fileNameText =
    normalizeText(
      fileName
    );


  const fileContent =
    normalizeText(
      fileBuffer.toString(
        "utf8"
      )
    );


  // ----------------------------------------------------
  // CHECK FULL UNIT NAME
  //
  // FILE NAME + CSV CONTENT
  // ----------------------------------------------------

  for (
    const code of
    Object.keys(
      UNIT_IDENTIFIERS
    ) as UnitCode[]
  ) {

    const identifiers =
      UNIT_IDENTIFIERS[
        code
      ];


    for (
      const identifier
      of identifiers
    ) {

      const normalizedIdentifier =
        normalizeText(
          identifier
        );


      if (
        fileNameText.includes(
          normalizedIdentifier
        ) ||
        fileContent.includes(
          normalizedIdentifier
        )
      ) {

        return code;

      }

    }

  }


  // ----------------------------------------------------
  // CHECK SHORT UNIT CODE IN FILE NAME
  //
  // MB / OS / SV / MS / BJ / JN / SM
  // ----------------------------------------------------

  for (
    const code of
    VALID_UNITS
  ) {

    if (
      containsUnitCode(
        fileNameText,
        code
      )
    ) {

      return code;

    }

  }


  // ----------------------------------------------------
  // UNIT COULD NOT BE IDENTIFIED
  // ----------------------------------------------------

  return null;

}


// ======================================================
// VALIDATE SELECTED UNIT VS UPLOADED FILE
// ======================================================

export function validateUnitFile(
  selectedUnitCode: string,
  file: Express.Multer.File
): UnitCode {

  const selectedUnit =
    selectedUnitCode
      .trim()
      .toUpperCase() as UnitCode;


  // ----------------------------------------------------
  // SELECTED UNIT VALIDATION
  // ----------------------------------------------------

  if (
    !VALID_UNITS.includes(
      selectedUnit
    )
  ) {

    throw new Error(
      `Invalid Unit Code: ${selectedUnitCode}`
    );

  }


  // ----------------------------------------------------
  // FILE VALIDATION
  // ----------------------------------------------------

  if (
    !file ||
    !file.buffer
  ) {

    throw new Error(
      "Uploaded file is missing or empty."
    );

  }


  // ----------------------------------------------------
  // DETECT FILE UNIT
  // ----------------------------------------------------

  const detectedUnit =
    detectUnitFromFile(
      file.originalname,
      file.buffer
    );


  // ----------------------------------------------------
  // UNIT FOUND IN FILE
  //
  // If detected unit exists,
  // it MUST match selected unit.
  // ----------------------------------------------------

  if (
    detectedUnit
  ) {

    if (
      detectedUnit !==
      selectedUnit
    ) {

      throw new Error(
        `Wrong unit file. Selected Unit: ${selectedUnit}. Uploaded File Unit: ${detectedUnit}.`
      );

    }


    return detectedUnit;

  }


  // ----------------------------------------------------
  // UNIT IDENTITY NOT FOUND
  //
  // HIMS revenue files may not contain
  // hospital/unit name.
  //
  // In that case:
  //
  // Revenue On +
  // Total Net Amount
  //
  // must exist.
  //
  // Then selected unit is trusted.
  // ----------------------------------------------------

  const validRevenueStructure =
    isRevenueCsv(
      file.buffer
    );


  if (
    validRevenueStructure
  ) {

    return selectedUnit;

  }


  // ----------------------------------------------------
  // UNKNOWN FILE
  //
  // No unit identity
  // AND
  // not a valid revenue CSV
  // ----------------------------------------------------

  throw new Error(
    `Unit identity not found and valid revenue structure was not detected in file "${file.originalname}". Upload stopped for safety.`
  );

}