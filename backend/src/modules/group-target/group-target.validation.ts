// ======================================================
// YEAR VALIDATION
// ======================================================

export function validateGroupTargetYear(
  value: unknown
): number {

  const year =
    Number(value);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {

    throw new Error(
      "Valid year is required"
    );

  }
  return year;
}

export function validateGroupTargetMonth(
  value: unknown
): number {

  const month =
    Number(value);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {

    throw new Error(
      "Month must be between 1 and 12"
    );
  }
  return month;
}

export function validateGroupTargetLakhs(
  value: unknown
): number {

  const groupTargetLakhs =
    Number(value);
  if (
    !Number.isFinite(
      groupTargetLakhs
    ) ||
    groupTargetLakhs < 0
  ) {
    throw new Error(
      "Valid groupTargetLakhs is required"
    );

  }

  return groupTargetLakhs;
}
