export const REQUIRED_OCCUPANCY_UNITS = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
] as const;


// ======================================================
// INDIA TODAY
//
// Occupancy is stored against the ACTUAL current date.
//
// Example:
//
// Today:
// 2026-09-23
//
// Occupancy Date:
// 2026-09-23
// ======================================================

function getIndiaTodayDate(): Date {

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Kolkata",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );


  const parts =
    formatter.formatToParts(
      new Date()
    );


  const year =
    Number(
      parts.find(
        (
          part
        ) =>
          part.type ===
          "year"
      )?.value
    );


  const month =
    Number(
      parts.find(
        (
          part
        ) =>
          part.type ===
          "month"
      )?.value
    );


  const day =
    Number(
      parts.find(
        (
          part
        ) =>
          part.type ===
          "day"
      )?.value
    );


  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

}


// ======================================================
// PARSE YYYY-MM-DD
// ======================================================

function parseDateString(
  value: string
): Date {

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        value
      );


  if (
    !match
  ) {

    throw new Error(
      "occupancyDate must be in YYYY-MM-DD format"
    );

  }


  const year =
    Number(
      match[1]
    );


  const month =
    Number(
      match[2]
    );


  const day =
    Number(
      match[3]
    );


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {

    throw new Error(
      "Invalid occupancyDate"
    );

  }


  return date;

}


// ======================================================
// GET OCCUPANCY DATE
//
// FINAL RULE:
//
// Today:
// Allowed.
//
// Past Date:
// Allowed.
//
// Future Date:
// Not Allowed.
//
// Blank Date:
// Today automatic.
//
// Important:
//
// Occupancy stays stored on its ACTUAL date.
//
// Dashboard mapping:
//
// Dashboard 22/09
// will later read Occupancy 23/09.
//
// That mapping belongs in dashboard.service.ts,
// not here.
// ======================================================

export function getOccupancyDate(
  value: unknown
): Date {

  const input =
    String(
      value ?? ""
    ).trim();


  if (
    !input
  ) {

    return getIndiaTodayDate();

  }


  const occupancyDate =
    parseDateString(
      input
    );


  const indiaToday =
    getIndiaTodayDate();


  if (
    occupancyDate.getTime() >
    indiaToday.getTime()
  ) {

    throw new Error(
      "Future Bed Occupancy date is not allowed."
    );

  }


  return occupancyDate;

}