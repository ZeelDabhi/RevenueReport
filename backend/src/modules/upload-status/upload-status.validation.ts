// ======================================================
// UPLOAD STATUS DATE VALIDATION
//
// Default:
// Date not provided → Yesterday
//
// Optional:
// ?date=2026-09-18
// ======================================================


// ======================================================
// GET TODAY DATE IN INDIA
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
        (part) =>
          part.type === "year"
      )?.value
    );


  const month =
    Number(
      parts.find(
        (part) =>
          part.type === "month"
      )?.value
    );


  const day =
    Number(
      parts.find(
        (part) =>
          part.type === "day"
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
// GET YESTERDAY
// ======================================================

function getYesterdayDate(): Date {

  const today =
    getIndiaTodayDate();


  today.setUTCDate(
    today.getUTCDate() - 1
  );


  return today;
}


// ======================================================
// PARSE YYYY-MM-DD
// ======================================================

function parseDateString(
  value: string
): Date {

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(value);


  if (!match) {

    throw new Error(
      "date must be in YYYY-MM-DD format"
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
      "Invalid date"
    );

  }


  return date;
}


// ======================================================
// FINAL STATUS DATE
//
// No date:
// Yesterday automatic
//
// Date given:
// Use that date
// ======================================================

export function getUploadStatusDate(
  value: unknown
): Date {

  const input =
    String(
      value ?? ""
    ).trim();


  if (!input) {

    return getYesterdayDate();

  }


  return parseDateString(
    input
  );
}