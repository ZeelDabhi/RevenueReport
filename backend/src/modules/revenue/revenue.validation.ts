import type {
  ReportType,
} from "../../utils/reportDates.ts";


// ======================================================
// REPORT TYPE CHECK
// ======================================================

export function isReportType(
  value: string
): value is ReportType {

  return (
    value === "FTD" ||
    value === "MTD" ||
    value === "LMTD" ||
    value === "LM"
  );
}


// ======================================================
// UNIT CODE REQUIRED
// ======================================================

export function getUnitCode(
  value: unknown
): string {

  const unitCode =
    String(
      value ?? ""
    )
      .trim()
      .toUpperCase();


  if (!unitCode) {

    throw new Error(
      "unitCode is required"
    );

  }


  return unitCode;
}


// ======================================================
// REPORT TYPE REQUIRED
// ======================================================

export function getReportType(
  value: unknown
): ReportType {

  const reportType =
    String(
      value ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    !isReportType(
      reportType
    )
  ) {

    throw new Error(
      "reportType must be FTD, MTD, LMTD or LM"
    );

  }


  return reportType;
}


// ======================================================
// CSV FILE VALIDATION
// ======================================================

export function validateCsvFile(
  file: Express.Multer.File
): void {

  if (!file) {

    throw new Error(
      "CSV file is required"
    );

  }


  if (
    !file.originalname
      .toLowerCase()
      .endsWith(".csv")
  ) {

    throw new Error(
      `${file.originalname} is not a CSV file`
    );

  }

}


// ======================================================
// FILE SIZE VALIDATION
// Maximum: 20 MB
// ======================================================

export function validateFileSize(
  file: Express.Multer.File
): void {

  const maxSize =
    20 * 1024 * 1024;


  if (
    file.size >
    maxSize
  ) {

    throw new Error(
      `${file.originalname} exceeds 20 MB file size limit`
    );

  }

}


// ======================================================
// COMPLETE FILE VALIDATION
// ======================================================

export function validateRevenueFile(
  file: Express.Multer.File
): void {

  validateCsvFile(
    file
  );

  validateFileSize(
    file
  );

}