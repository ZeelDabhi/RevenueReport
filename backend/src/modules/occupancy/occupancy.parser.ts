import {
  parse,
} from "csv-parse/sync";

export const OCCUPANCY_UNIT_CODES = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
] as const;

export type OccupancyUnitCode =
  (
    typeof OCCUPANCY_UNIT_CODES
  )[number];

export interface ParsedOccupancyCsv {

  unitCode:
    OccupancyUnitCode;

  occupancyCount:
    number;

  rawRowCount:
    number;

  validRowCount:
    number;

  duplicateAdmissionCount:
    number;

}

function normalizeText(
  value: unknown
): string {

  return String(
    value ?? ""
  )
    .replace(
      /^\uFEFF/,
      ""
    )
    .trim();

}

function normalizeHeader(
  value: string
): string {

  return value
    .replace(
      /^\uFEFF/,
      ""
    )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );

}

function findColumnName(
  headers: string[],
  acceptedNames: string[]
): string | null {

  const normalizedAccepted =
    acceptedNames.map(
      (
        name
      ) =>
        normalizeHeader(
          name
        )
    );


  for (
    const header
    of headers
  ) {

    const normalizedHeader =
      normalizeHeader(
        header
      );


    if (
      normalizedAccepted.includes(
        normalizedHeader
      )
    ) {

      return header;

    }

  }


  return null;

}


// ======================================================
// DETECT UNIT FROM ADMISSION NUMBER
//
// Supported:
//
// MB
// OS
// SV
// MS
// BJ
// JN
// SM
//
// Rajkot (RJ) is intentionally not supported.
// ======================================================

function detectUnitFromAdmissionNo(
  admissionNo: string
): OccupancyUnitCode | null {

  const normalized =
    admissionNo
      .trim()
      .toUpperCase();


  for (
    const code
    of OCCUPANCY_UNIT_CODES
  ) {

    const regex =
      new RegExp(
        `^${code}(?:-|_|\\s)`
      );


    if (
      regex.test(
        normalized
      )
    ) {

      return code;

    }

  }


  return null;

}


// ======================================================
// PARSE OCCUPANCY CSV
// ======================================================

export function parseOccupancyCsv(
  fileBuffer: Buffer
): ParsedOccupancyCsv {

  const csvText =
    fileBuffer.toString(
      "utf8"
    );


  let records:
    Record<
      string,
      unknown
    >[];


  // ----------------------------------------------------
  // READ CSV
  // ----------------------------------------------------

  try {

    records =
      parse(
        csvText,
        {

          columns:
            true,

          skip_empty_lines:
            true,

          bom:
            true,

          trim:
            true,

          relax_column_count:
            true,

          relax_quotes:
            true,

        }
      );

  }
  catch (
    error
  ) {

    throw new Error(
      `Unable to read Occupancy CSV: ${
        error instanceof Error
          ? error.message
          : "Invalid CSV"
      }`
    );

  }


  // ----------------------------------------------------
  // BASIC CSV VALIDATION
  // ----------------------------------------------------

  if (
    !Array.isArray(
      records
    )
  ) {

    throw new Error(
      "Invalid Occupancy CSV file"
    );

  }


  if (
    records.length === 0
  ) {

    throw new Error(
      "Occupancy CSV contains no patient rows"
    );

  }


  // ----------------------------------------------------
  // HEADERS
  // ----------------------------------------------------

  const headers =
    Object.keys(
      records[0]
    );


  const admissionColumn =
    findColumnName(
      headers,
      [
        "Admission No.",
        "Admission No",
        "Admission Number",
        "AdmissionNo",
      ]
    );


  const wardColumn =
    findColumnName(
      headers,
      [
        "Ward",
        "Ward Name",
      ]
    );


  const bedColumn =
    findColumnName(
      headers,
      [
        "Bed",
        "Bed No",
        "Bed No.",
        "Bed Number",
        "Bed Name",
      ]
    );


  // ----------------------------------------------------
  // REQUIRED COLUMN VALIDATION
  // ----------------------------------------------------

  if (
    !admissionColumn
  ) {

    throw new Error(
      'Required column "Admission No." not found in Occupancy CSV'
    );

  }


  if (
    !wardColumn
  ) {

    throw new Error(
      'Required column "Ward" not found in Occupancy CSV'
    );

  }


  if (
    !bedColumn
  ) {

    throw new Error(
      'Required column "Bed" not found in Occupancy CSV'
    );

  }


  // ----------------------------------------------------
  // COUNTERS
  // ----------------------------------------------------

  const rawRowCount =
    records.length;


  const uniqueAdmissions =
    new Set<string>();


  const detectedUnits =
    new Set<
      OccupancyUnitCode
    >();


  let validRowCount =
    0;


  // ----------------------------------------------------
  // PROCESS ROWS
  // ----------------------------------------------------

  for (
    const row
    of records
  ) {

    const admissionNo =
      normalizeText(
        row[
          admissionColumn
        ]
      );


    const ward =
      normalizeText(
        row[
          wardColumn
        ]
      );


    const bed =
      normalizeText(
        row[
          bedColumn
        ]
      );


    // -----------------------------------------------
    // OCCUPIED ROW MUST HAVE:
    //
    // Admission No
    // Ward
    // Bed
    // -----------------------------------------------

    if (
      !admissionNo ||
      !ward ||
      !bed
    ) {

      continue;

    }


    validRowCount++;


    const normalizedAdmission =
      admissionNo
        .toUpperCase()
        .trim();


    const detectedUnit =
      detectUnitFromAdmissionNo(
        normalizedAdmission
      );


    // -----------------------------------------------
    // UNKNOWN / REMOVED UNIT
    //
    // RJ will fail here.
    // -----------------------------------------------

    if (
      !detectedUnit
    ) {

      throw new Error(
        `Unit could not be detected from Admission No.: ${admissionNo}`
      );

    }


    detectedUnits.add(
      detectedUnit
    );


    uniqueAdmissions.add(
      normalizedAdmission
    );

  }


  // ----------------------------------------------------
  // VALID ROW CHECK
  // ----------------------------------------------------

  if (
    validRowCount === 0
  ) {

    throw new Error(
      "No valid occupied bed rows found. Admission No., Ward and Bed are required."
    );

  }


  // ----------------------------------------------------
  // UNIT CHECK
  // ----------------------------------------------------

  if (
    detectedUnits.size === 0
  ) {

    throw new Error(
      "Unit could not be detected from Occupancy CSV"
    );

  }


  if (
    detectedUnits.size > 1
  ) {

    throw new Error(
      `Multiple units detected in same Occupancy CSV: ${
        Array.from(
          detectedUnits
        ).join(
          ", "
        )
      }`
    );

  }


  // ----------------------------------------------------
  // FINAL UNIT
  // ----------------------------------------------------

  const unitCode =
    Array.from(
      detectedUnits
    )[0];


  const occupancyCount =
    uniqueAdmissions.size;


  const duplicateAdmissionCount =
    validRowCount -
    occupancyCount;


  // ----------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------

  return {

    unitCode,

    occupancyCount,

    rawRowCount,

    validRowCount,

    duplicateAdmissionCount,

  };

}