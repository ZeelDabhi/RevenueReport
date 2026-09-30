import { parse } from "csv-parse/sync";

export interface RevenueDepartmentRow {
  revenueOn: string | null;
  totalNetAmount: number;
}

export interface RevenueSummaryData {
  opBillCount: number;
  ipBillCount: number;
  erBillCount: number;
  dcBillCount: number;
  pharmacyBillCount: number;
  opticalBillCount: number;

  opBillAmount: number;
  ipBillAmount: number;
  erBillAmount: number;
  dcBillAmount: number;
  pharmacyBillAmount: number;
  opticalBillAmount: number;

  opDiscountAmount: number;
  ipDiscountAmount: number;
  erDiscountAmount: number;
  dcDiscountAmount: number;
  pharmacyDiscountAmount: number;
  opticalDiscountAmount: number;

  opRefundAmount: number;
  ipRefundAmount: number;
  erRefundAmount: number;
  dcRefundAmount: number;
  pharmacyRefundAmount: number;
  opticalRefundAmount: number;

  opCancelCreditAmount: number;
  ipCancelCreditAmount: number;
  erCancelCreditAmount: number;
  dcCancelCreditAmount: number;
  pharmacyCancelCreditAmount: number;
  opticalCancelCreditAmount: number;

  opNetAfterRefund: number;
  ipNetAfterRefund: number;
  erNetAfterRefund: number;
  dcNetAfterRefund: number;
  pharmacyNetAfterRefund: number;
  opticalNetAfterRefund: number;

  grandTotalBillCount: number;
  grandTotalBillAmount: number;
  grandTotalDiscountAmount: number;
  grandTotalRefundAmount: number;
  grandTotalNetAfterRefund: number;
  grandTotalCancelCreditAmount: number;
  finalNetAmount: number;
}

export interface ParsedRevenueCsv {
  departments: RevenueDepartmentRow[];
  totalNetAmount: number;
  totalNetAmountLakhs: number;
  summary: RevenueSummaryData;
  rawSummary: Record<string, number>;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .trim();
}

function toNumber(value: unknown): number {
  const cleaned = normalize(value).replace(/,/g, "");

  if (!cleaned) {
    return 0;
  }

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    throw new Error(
      `Invalid number found in CSV: ${String(value)}`
    );
  }

  return number;
}

export function parseRevenueCsv(
  fileBuffer: Buffer
): ParsedRevenueCsv {

  const csvText = fileBuffer
    .toString("utf8")
    .replace(/^\uFEFF/, "");

  const rows = parse(csvText, {
    relax_column_count: true,
    skip_empty_lines: false,
    trim: true,
  }) as string[][];

  if (!rows.length) {
    throw new Error("CSV file is empty");
  }

  const header1 = normalize(rows[0]?.[0]).toLowerCase();
  const header2 = normalize(rows[0]?.[1]).toLowerCase();

  if (
    header1 !== "revenue on" ||
    header2 !== "total net amount"
  ) {
    throw new Error(
      'CSV must contain "Revenue On" and "Total Net Amount" headers'
    );
  }

  const summaryIndex = rows.findIndex(
    (row) =>
      normalize(row?.[0]).toLowerCase() === "summary"
  );

  if (summaryIndex === -1) {
    throw new Error("Summary section not found");
  }

  const departments: RevenueDepartmentRow[] = [];

  for (let i = 1; i < summaryIndex; i++) {

    const row = rows[i];

    if (!row) continue;

    const revenueOn = normalize(row[0]);
    const amountValue = normalize(row[1]);

    if (!revenueOn && !amountValue) {
      continue;
    }

    if (!amountValue) {
      continue;
    }

    departments.push({
      revenueOn: revenueOn || null,
      totalNetAmount: toNumber(amountValue),
    });
  }

  if (departments.length === 0) {
    throw new Error("No Revenue On rows found");
  }

  // ===============================================
  // YOUR REQUIRED FORMULA
  // SUM(Total Net Amount)
  // ===============================================

  const totalNetAmount = departments.reduce(
    (total, row) => total + row.totalNetAmount,
    0
  );

  // SUM / 1E5
  const totalNetAmountLakhs =
    totalNetAmount / 100000;

  // ===============================================
  // SUMMARY ROW
  // ===============================================

  let summaryRow: string[] | undefined;

  for (
    let i = summaryIndex + 1;
    i < rows.length;
    i++
  ) {
    if (
      rows[i]?.some(
        (value) => normalize(value) !== ""
      )
    ) {
      summaryRow = rows[i];
      break;
    }
  }

  if (!summaryRow) {
    throw new Error("Summary values not found");
  }

  const rawSummary: Record<string, number> = {};

  for (
    let i = 0;
    i < summaryRow.length;
    i += 2
  ) {
    const key = normalize(summaryRow[i]);

    if (!key) continue;

    rawSummary[key] =
      toNumber(summaryRow[i + 1]);
  }

  const get = (key: string): number =>
    rawSummary[key] ?? 0;

  const summary: RevenueSummaryData = {

    opBillCount: get("OP Bill Count"),
    ipBillCount: get("IP Bill Count"),
    erBillCount: get("ER Bill Count"),
    dcBillCount: get("DC Bill Count"),
    pharmacyBillCount: get("Pharmacy Bill Count"),
    opticalBillCount: get("Optical Bill Count"),

    opBillAmount: get("OP Bill Amount"),
    ipBillAmount: get("IP Bill Amount"),
    erBillAmount: get("ER Bill Amount"),
    dcBillAmount: get("DC Bill Amount"),
    pharmacyBillAmount: get("Pharmacy Bill Amount"),
    opticalBillAmount: get("Optical Bill Amount"),

    opDiscountAmount: get("OP Discount Amount"),
    ipDiscountAmount: get("IP Discount Amount"),
    erDiscountAmount: get("ER Discount Amount"),
    dcDiscountAmount: get("DC Discount Amount"),
    pharmacyDiscountAmount: get(
      "Pharmacy Discount Amount"
    ),
    opticalDiscountAmount: get(
      "Optical Discount Amount"
    ),

    opRefundAmount: get("OP Refund Amount"),
    ipRefundAmount: get("IP Refund Amount"),
    erRefundAmount: get("ER Refund Amount"),
    dcRefundAmount: get("DC Refund Amount"),
    pharmacyRefundAmount: get(
      "Pharmacy Refund Amount"
    ),
    opticalRefundAmount: get(
      "Optical Refund Amount"
    ),

    opCancelCreditAmount: get(
      "OP Cancel Credit Amount"
    ),
    ipCancelCreditAmount: get(
      "IP Cancel Credit Amount"
    ),
    erCancelCreditAmount: get(
      "ER Cancel Credit Amount"
    ),
    dcCancelCreditAmount: get(
      "DC Cancel Credit Amount"
    ),
    pharmacyCancelCreditAmount: get(
      "Pharmacy Cancel Credit Amount"
    ),
    opticalCancelCreditAmount: get(
      "Optical Cancel Credit Amount"
    ),

    opNetAfterRefund: get(
      "(OP Net Amt - OP Refund Amt)"
    ),
    ipNetAfterRefund: get(
      "(IP Net Amt - IP Refund Amt)"
    ),
    erNetAfterRefund: get(
      "(ER Net Amt - ER Refund Amt)"
    ),
    dcNetAfterRefund: get(
      "(DC Net Amt - DC Refund Amt)"
    ),
    pharmacyNetAfterRefund: get(
      "(Pharmacy Net Amt - Pharmacy Refund Amt)"
    ),
    opticalNetAfterRefund: get(
      "(Optical Net Amt - Optical Refund Amt)"
    ),

    grandTotalBillCount: get(
      "Grand Total Bill Count"
    ),

    grandTotalBillAmount: get(
      "Grand Total Bill Amount"
    ),

    grandTotalDiscountAmount: get(
      "Grand Total Discount Amount"
    ),

    grandTotalRefundAmount: get(
      "Grand Total Refund Amount"
    ),

    grandTotalNetAfterRefund: get(
      "(Grand Total Net Amount - Grand Total Refund Amount)"
    ),

    grandTotalCancelCreditAmount: get(
      "Grand Total Cancel Credit Amount"
    ),

    finalNetAmount: get(
      "(Grand Total Net Amount - Grand Total Refund Amount - Grand Total Cancel Credit Amount)"
    ),
  };

  return {
    departments,
    totalNetAmount,
    totalNetAmountLakhs,
    summary,
    rawSummary,
  };
}